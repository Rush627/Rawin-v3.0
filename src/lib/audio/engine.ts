"use client";

import { AMBIENCE, CLICK, FORMATS } from "./catalog";
import { bakeLoop } from "./loop";
import type { EarlyAudio } from "./boot-script";
import { ambienceSilent, effectiveAmbienceLevel, readSoundPreference, writeSoundPreference, type SoundPreference } from "./policy";

/**
 * RAWIN's one audio director: a single AudioContext for the whole site, kept on window so client
 * navigation and React remounts never make a second one.
 *
 *   master (mute, page lifecycle) ─ out
 *     ├─ level (hero / ambient / silent / held for Orbit), glided, never stepped
 *     │   └─ bed (start and stop fades) ─ the ambience: one decoded buffer, looped seamlessly
 *     └─ click  the interface click (one decoded buffer)
 *
 * Both sounds are plain Web Audio buffers, not media elements: the loop is sample-accurate (see
 * loop.ts), and the ambience is not presented to the system as a media session (no lock-screen
 * or notification player), because no media element is playing. One format per sound is
 * downloaded (the first the browser can play, see catalog.ts).
 *
 * Start-up: as soon as the public site knows its route and CMS settings, the director creates
 * its context and loads the ambience. If the browser lets the context run (it does after the
 * visitor has used the site, on some browsers), the ambience starts at once; if not, the start
 * is pending and happens on the first click, tap or key press anywhere. The control shows
 * "waiting" in that state, never "playing".
 *
 * Order of precedence for the ambience: the CMS switch, then the visitor's mute, then Orbit's
 * microphone or voice (held at silence), then the route and scroll level.
 *
 * A hidden page fades the master out and suspends the context (a click in flight is cut first, so
 * nothing is left to resume as a stray beep); on return it resumes and fades back in, where the
 * loop left off.
 */

export type SoundStatus = "muted" | "waiting" | "live" | "unavailable";

export interface AudioState {
  enabled: boolean;
  /** the browser allows playback (context running) */
  unlocked: boolean;
  /** muted by the visitor, waiting for the browser, audible, or nothing allowed by the CMS */
  status: SoundStatus;
}

export interface AudioSnapshot {
  enabled: boolean;
  status: SoundStatus;
  available: { background: boolean; click: boolean };
  context: AudioContextState | "none";
  route: string | null;
  presence: number;
  holds: string[];
  ambience: {
    format: string | null;
    loaded: boolean;
    playing: boolean;
    sources: number;
    target: number;
    level: number;
    position: number;
    loop: { loopStart: number; loopEnd: number } | null;
    pending: boolean;
    error: boolean;
  };
  click: { format: string | null; state: "loaded" | "loading" | "missing" | "idle"; count: number };
  formatsTried: string[];
  /** the start-up and lifecycle transitions, oldest first (ms since the page loaded) */
  trace: string[];
}

const MASTER = 0.9;

declare global {
  interface Navigator {
    getAutoplayPolicy?: (type: "mediaelement" | "audiocontext") => "allowed" | "allowed-muted" | "disallowed";
  }
}

export class AudioDirector {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private level: GainNode | null = null;
  private bed: GainNode | null = null;
  private clickBus: GainNode | null = null;

  private bgBuffer: AudioBuffer | null = null;
  private bgLoad: Promise<AudioBuffer | null> | null = null;
  private bgFormat: string | null = null;
  private bgLoop: { loopStart: number; loopEnd: number } | null = null;
  private bgError = false;
  private source: AudioBufferSourceNode | null = null;
  private sources = 0;
  private startedAt = 0;
  private offset = 0;
  private everStarted = false;
  private stopTimer = 0;

  private clickBuf: AudioBuffer | null = null;
  private clickLoad: Promise<AudioBuffer | null> | null = null;
  private clickFormat: string | null = null;
  private clickMissing = false;
  private lastClick: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private lastClickAt = -Infinity;
  private clicks = 0;
  private formatsTried: string[] = [];

  private pref: SoundPreference = "on";
  private available = { background: true, click: true };
  private holds = new Set<string>();
  private installed = false;
  private gestured = false;
  private listeners = new Set<(s: AudioState) => void>();
  private route: string | null = null;
  private presence = 0;
  private hidden = false;
  private suspendTimer = 0;
  private trace: string[] = [];
  private blockedNoted = false;

  /** Record a lifecycle transition (kept short: the last 40). */
  private note(event: string) {
    const t = typeof performance !== "undefined" ? Math.round(performance.now()) : 0;
    this.trace.push(`${t} ${event}`);
    if (this.trace.length > 40) this.trace.shift();
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.pref = readSoundPreference(window.localStorage ?? null);
      this.hidden = document.hidden;
    }
  }

  /* ------------------------------------------------------------ state */

  private playing() {
    return Boolean(this.source && this.ctx?.state === "running");
  }

  private status(): SoundStatus {
    if (!this.available.background && !this.available.click) return "unavailable";
    if (this.pref === "off") return "muted";
    if (this.wantsAmbience()) return this.playing() ? "live" : "waiting";
    // the ambience is not wanted here (Studio, CMS off, page hidden): live once audio may play
    return this.ctx?.state === "running" || (this.hidden && this.everStarted) ? "live" : "waiting";
  }

  state(): AudioState {
    return { enabled: this.pref === "on", unlocked: this.ctx?.state === "running", status: this.status() };
  }

  private position() {
    const ctx = this.ctx;
    if (!ctx || !this.source || !this.bgBuffer) return this.offset;
    const raw = this.offset + (ctx.currentTime - this.startedAt);
    const loop = this.bgLoop;
    if (!loop) return raw % this.bgBuffer.duration;
    if (raw < loop.loopEnd) return raw;
    const span = loop.loopEnd - loop.loopStart;
    return loop.loopStart + ((raw - loop.loopStart) % span);
  }

  snapshot(): AudioSnapshot {
    return {
      enabled: this.pref === "on",
      status: this.status(),
      available: { ...this.available },
      context: this.ctx?.state ?? "none",
      route: this.route,
      presence: Math.round(this.presence * 100) / 100,
      holds: [...this.holds],
      ambience: {
        format: this.bgFormat,
        loaded: Boolean(this.bgBuffer),
        playing: this.playing(),
        sources: this.sources,
        target: Math.round(this.target() * 1000) / 1000,
        level: this.level ? Math.round(this.level.gain.value * 1000) / 1000 : 0,
        position: Math.round(this.position() * 10) / 10,
        loop: this.bgLoop,
        pending: this.wantsAmbience() && !this.playing(),
        error: this.bgError,
      },
      click: {
        format: this.clickFormat,
        state: this.clickBuf ? "loaded" : this.clickMissing ? "missing" : this.clickLoad ? "loading" : "idle",
        count: this.clicks,
      },
      formatsTried: [...this.formatsTried],
      trace: [...this.trace],
    };
  }

  subscribe(fn: (s: AudioState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const s = this.state();
    this.listeners.forEach((fn) => fn(s));
  }

  /* ------------------------------------------------------------ lifecycle */

  /** Gesture listeners (a pending start happens on the first one) and page lifecycle. */
  install() {
    if (this.installed || typeof window === "undefined") return;
    this.installed = true;
    // the events browsers accept as user activation (a scroll's touchend is not one; the next
    // tap is): any of them completes a pending start
    const onGesture = (e: Event) => {
      if (this.pref === "on" && (this.available.background || this.available.click)) this.unlock(e.type);
    };
    for (const type of ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const) {
      window.addEventListener(type, onGesture, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", () => this.onVisibility());
    window.addEventListener("pagehide", () => this.onVisibility(true));
    window.addEventListener("pageshow", () => this.onVisibility());
  }

  private onVisibility(forceHidden = false) {
    const hidden = forceHidden || document.hidden;
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    this.note(hidden ? "page: hidden" : "page: visible");
    const ctx = this.ctx;
    window.clearTimeout(this.suspendTimer);
    if (hidden) {
      // fade out (no pop), cut a click in flight (so no tail is left to play on return), then
      // let the browser idle the audio thread
      this.chokeLastClick(0.02);
      if (ctx && this.master) {
        this.ramp(this.master.gain, 0, 0.06);
        this.suspendTimer = window.setTimeout(() => {
          if (this.hidden) ctx.suspend().catch(() => {});
        }, 120);
      }
    } else if (ctx && this.master) {
      ctx
        .resume()
        .catch(() => {})
        .finally(() => {
          if (this.hidden) return;
          if (this.master) this.ramp(this.master.gain, this.pref === "on" ? MASTER : 0, 0.4);
          this.sync();
        });
    } else this.sync();
    this.emit();
  }

  /** Must be called inside a user gesture. Safe to call repeatedly. */
  unlock(source = "call") {
    if (typeof window === "undefined" || this.pref !== "on" || this.hidden) return;
    this.gestured = true;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state !== "running") {
      this.note(`gesture:${source} resume`);
      // a silent one-sample buffer started inside the gesture unlocks iOS output
      try {
        const b = ctx.createBuffer(1, 1, ctx.sampleRate);
        const s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start();
      } catch {
        // ignore
      }
      ctx
        .resume()
        .then(() => this.sync())
        .catch(() => {});
    }
    if (this.available.click) this.loadClick();
    this.sync();
  }

  /**
   * Bring the ambience in line with what is wanted (the one place that starts or stops it).
   * Starting needs a running context; otherwise the start stays pending until one runs.
   */
  private sync() {
    this.applyLevel();
    const want = this.wantsAmbience();
    if (!want) {
      // CMS off, muted, or a silent route: fade out and release the source (hidden pages are
      // suspended instead, so the loop keeps its place)
      if (this.source && !this.hidden) this.stopBed(this.pref === "off" ? 0.25 : AMBIENCE.glideS * 3);
      // clicks alone: still have the click ready before the first activation needs it
      if (this.pref === "on" && this.available.click && !this.hidden && (this.ctx || this.autoplayPolicy() !== "disallowed")) {
        this.ensureContext();
        this.loadClick();
      }
      this.emit();
      return;
    }
    if (!this.ctx && !this.gestured && this.autoplayPolicy() === "disallowed") {
      // the browser states it will not run audio before a gesture: wait for one
      this.emit();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.loadBed();
    // the click is tiny: have it ready before the first activation needs it
    if (this.available.click) this.loadClick();
    if (ctx.state !== "running") {
      // not allowed to run yet: try (allowed on some browsers without a gesture), else wait for
      // the first gesture. One attempt per reason to start, never a loop.
      if (this.autoplayPolicy() !== "disallowed") {
        ctx.resume().catch(() => {});
        if (!this.blockedNoted) {
          this.blockedNoted = true;
          this.note("autoplay: attempted");
          // a browser that allows it runs the context within a frame or two; one that does not
          // leaves it suspended: that is the "blocked, waiting for a gesture" state
          window.setTimeout(() => {
            if (this.ctx?.state !== "running" && this.wantsAmbience()) this.note("autoplay: blocked, waiting for a gesture");
          }, 300);
        }
      }
      this.emit();
      return;
    }
    if (!this.source) {
      if (this.bgBuffer) this.startBed();
      else this.loadBed().then(() => this.wantsAmbience() && this.ctx?.state === "running" && !this.source && this.startBed());
    } else {
      // a stop in progress (e.g. CMS switched off and on again) is cancelled
      window.clearTimeout(this.stopTimer);
      if (this.bed && this.ctx) this.ramp(this.bed.gain, 1, 0.6);
    }
    this.emit();
  }

  /** The browser's own answer where it gives one (Firefox), else "unknown": try and see. */
  private autoplayPolicy(): "allowed" | "allowed-muted" | "disallowed" | "unknown" {
    try {
      return navigator.getAutoplayPolicy ? navigator.getAutoplayPolicy("audiocontext") : "unknown";
    } catch {
      return "unknown";
    }
  }

  setEnabled(on: boolean) {
    this.pref = on ? "on" : "off";
    if (typeof window !== "undefined") writeSoundPreference(window.localStorage ?? null, this.pref);
    if (on) {
      this.unlock();
      if (this.ctx && this.master && !this.hidden) this.ramp(this.master.gain, MASTER, 0.2);
    } else {
      this.chokeLastClick(0.05);
      if (this.ctx && this.master) this.ramp(this.master.gain, 0, 0.2);
    }
    this.sync();
  }

  /** What the CMS allows (the visitor's mute is separate and only silences what is allowed). */
  setAvailable(next: { background: boolean; click: boolean }) {
    if (next.background === this.available.background && next.click === this.available.click) return;
    this.available = { ...next };
    if (!next.click) this.chokeLastClick(0.05);
    else if (this.ctx) this.loadClick();
    if (!next.background && this.source) this.stopBed(0.3);
    this.sync();
  }

  /**
   * The current public route (null when the public site is left). Leaving the homepage drops
   * the hero's hold at once, so the level only ever glides down on the way out.
   */
  setRoute(pathname: string | null) {
    if (pathname === this.route) return;
    if (pathname !== "/") this.presence = 0;
    this.route = pathname;
    this.sync();
  }

  /** How much the homepage hero holds the view (0..1); retargets the level, cheaply. */
  setHeroPresence(presence: number) {
    const p = Math.min(1, Math.max(0, presence));
    if (Math.abs(p - this.presence) < 0.005) return;
    this.presence = p;
    if (this.route === "/") this.applyLevel();
  }

  /**
   * Something that needs the ambience out of the way (Orbit listening or speaking) holds it at
   * silence; the level returns when every hold is released. The loop keeps running underneath.
   */
  hold(key: string, on: boolean) {
    const had = this.holds.size > 0;
    if (on) this.holds.add(key);
    else this.holds.delete(key);
    if (had !== this.holds.size > 0) this.applyLevel();
  }

  /* ------------------------------------------------------------ graph */

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    // a context the boot script already unlocked inside the visitor's first tap (before
    // hydration) is adopted: it is allowed to play, and a second context is never made
    const early = this.early();
    let ctx: AudioContext;
    if (early?.ctx && early.ctx.state !== "closed") {
      ctx = early.ctx;
      early.ctx = null;
    } else {
      try {
        ctx = new Ctor({ latencyHint: "playback" });
      } catch {
        return null;
      }
    }
    this.ctx = ctx;
    this.note(early && ctx.state !== "suspended" ? `context: adopted from the first tap (${ctx.state})` : `context: created (${ctx.state})`);
    this.master = ctx.createGain();
    this.master.gain.value = this.pref === "on" && !this.hidden ? MASTER : 0;
    this.master.connect(ctx.destination);
    this.level = ctx.createGain();
    this.level.gain.value = 0;
    this.level.connect(this.master);
    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    this.bed.connect(this.level);
    this.clickBus = ctx.createGain();
    this.clickBus.connect(this.master);
    ctx.addEventListener("statechange", () => {
      // the browser allowed (or took back) playback: reconcile, report the real state
      this.note(`context: ${ctx.state}`);
      if (ctx.state === "running") this.sync();
      this.emit();
    });
    return ctx;
  }

  private ramp(param: AudioParam, value: number, seconds: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + seconds);
  }

  /** Fetch and decode the first format this browser plays; the next only if that one fails. */
  private async fetchDecode(base: string, ctx: BaseAudioContext): Promise<{ buffer: AudioBuffer; ext: string } | null> {
    const probe = typeof Audio !== "undefined" ? new Audio() : null;
    const order = FORMATS.filter((f) => f.ext === "mp3" || (probe?.canPlayType(f.type) ?? "") !== "");
    for (const f of order) {
      const url = `${base}.${f.ext}`;
      this.formatsTried.push(url);
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        return { buffer, ext: f.ext };
      } catch {
        // not decodable here: the next format
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ ambience */

  private wantsAmbience() {
    return this.pref === "on" && this.available.background && !ambienceSilent(this.route) && !this.hidden;
  }

  private target() {
    return effectiveAmbienceLevel(
      { cmsBackground: this.available.background, muted: this.pref !== "on", held: this.holds.size > 0, route: this.route, presence: this.presence },
      AMBIENCE,
    );
  }

  /** Glide the level toward the current target (a new target simply replaces the glide). */
  private applyLevel() {
    const ctx = this.ctx;
    if (!ctx || !this.level) return;
    const t = ctx.currentTime;
    const p = this.level.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.setTargetAtTime(this.target(), t, this.holds.size > 0 ? AMBIENCE.duckS : AMBIENCE.glideS);
  }

  /** What the inline boot script prepared (public layout), if it ran. */
  private early(): EarlyAudio | null {
    return typeof window === "undefined" ? null : ((window as unknown as { __rawinEarlyAudio?: EarlyAudio }).__rawinEarlyAudio ?? null);
  }

  /** The ambience bytes the boot script started downloading before hydration, decoded here. */
  private async earlyBed(ctx: BaseAudioContext): Promise<{ buffer: AudioBuffer; ext: string } | null> {
    const early = this.early();
    if (!early?.bed || !early.ext) return null;
    const pending = early.bed;
    const ext = early.ext;
    early.bed = null;
    try {
      const bytes = await pending;
      if (!bytes) return null;
      this.formatsTried.push(`${AMBIENCE.base}.${ext} (early)`);
      return { buffer: await ctx.decodeAudioData(bytes), ext };
    } catch {
      return null;
    }
  }

  private loadBed(): Promise<AudioBuffer | null> {
    if (this.bgLoad) return this.bgLoad;
    const ctx = this.ensureContext();
    if (!ctx) return Promise.resolve(null);
    this.bgLoad = this.earlyBed(ctx).then((r) => r ?? this.fetchDecode(AMBIENCE.base, ctx)).then((r) => {
      if (!r) {
        this.bgError = true;
        this.note("ambience: no playable format");
        this.emit();
        return null;
      }
      this.note(`ambience: decoded (${r.ext})`);
      const channels = Array.from({ length: r.buffer.numberOfChannels }, (_, i) => r.buffer.getChannelData(i));
      this.bgLoop = bakeLoop(channels, r.buffer.sampleRate, AMBIENCE.loop);
      this.bgBuffer = r.buffer;
      this.bgFormat = r.ext;
      this.emit();
      return r.buffer;
    });
    return this.bgLoad;
  }

  private startBed() {
    const ctx = this.ctx;
    const buf = this.bgBuffer;
    if (!ctx || !buf || !this.bed || this.source) return;
    window.clearTimeout(this.stopTimer);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    if (this.bgLoop) {
      src.loopStart = this.bgLoop.loopStart;
      src.loopEnd = this.bgLoop.loopEnd;
    }
    src.connect(this.bed);
    const t = ctx.currentTime;
    const first = !this.everStarted;
    this.bed.gain.cancelScheduledValues(t);
    this.bed.gain.setValueAtTime(0, t);
    this.bed.gain.linearRampToValueAtTime(1, t + (first ? AMBIENCE.fadeInS : 1.2));
    src.start(t, this.offset);
    this.note(`ambience: started at ${Math.round(this.offset * 10) / 10}s`);
    this.startedAt = t;
    this.source = src;
    this.sources += 1;
    this.everStarted = true;
    src.onended = () => {
      this.sources -= 1;
      try {
        src.disconnect();
      } catch {
        // already gone
      }
    };
    this.applyLevel();
    this.emit();
  }

  /** Fade the ambience out and release its source, remembering where the loop was. */
  private stopBed(seconds: number) {
    const ctx = this.ctx;
    const src = this.source;
    if (!ctx || !src || !this.bed) return;
    this.offset = this.position();
    this.note("ambience: stopped");
    this.source = null;
    this.ramp(this.bed.gain, 0, seconds);
    try {
      src.stop(ctx.currentTime + seconds + 0.02);
    } catch {
      // already stopped
    }
    this.emit();
  }

  /* ------------------------------------------------------------ click */

  private loadClick(): Promise<AudioBuffer | null> {
    if (this.clickLoad) return this.clickLoad;
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    this.clickLoad = this.fetchDecode(CLICK.base, ctx).then((r) => {
      if (!r) {
        this.clickMissing = true;
        return null;
      }
      this.clickBuf = r.buffer;
      this.clickFormat = r.ext;
      return r.buffer;
    });
    return this.clickLoad;
  }

  private chokeLastClick(seconds: number = CLICK.chokeS) {
    const ctx = this.ctx;
    if (!ctx || !this.lastClick) return;
    const t = ctx.currentTime;
    const { src, gain } = this.lastClick;
    this.lastClick = null;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + seconds);
    try {
      src.stop(t + seconds + 0.01);
    } catch {
      // already stopped
    }
  }

  /** One click (call inside the activating gesture). Rapid repeats are dropped; a new click cuts the previous tail. */
  click(pan = 0): boolean {
    const ctx = this.ctx;
    if (!ctx || this.pref !== "on" || !this.available.click || this.hidden || !this.clickBus) return false;
    const buf = this.clickBuf;
    if (!buf || ctx.state !== "running") {
      // the first activation of a visit may still be decoding the click or resuming the
      // context: it plays once both are ready, unless that took too long to read as this one
      // (and never if the click was switched off, muted or the page hidden meanwhile)
      const asked = performance.now();
      Promise.all([this.loadClick(), ctx.resume().catch(() => {})]).then(() => {
        if (this.clickBuf && performance.now() - asked < 450 && this.ctx?.state === "running") this.click(pan);
      });
      return false;
    }
    const now = performance.now();
    if (now - this.lastClickAt < CLICK.cooldownMs) return false;
    this.lastClickAt = now;
    this.chokeLastClick();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = CLICK.gain;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(g).connect(p).connect(this.clickBus);
    src.start(ctx.currentTime);
    const voice = { src, gain: g };
    this.lastClick = voice;
    this.clicks += 1;
    src.onended = () => {
      if (this.lastClick === voice) this.lastClick = null;
      try {
        src.disconnect();
        p.disconnect();
      } catch {
        // already gone
      }
    };
    return true;
  }
}

/** The site's single audio director (created lazily in the browser; null on the server). */
export function getAudio(): AudioDirector | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __rawinAudio?: AudioDirector };
  if (!w.__rawinAudio) w.__rawinAudio = new AudioDirector();
  return w.__rawinAudio;
}


