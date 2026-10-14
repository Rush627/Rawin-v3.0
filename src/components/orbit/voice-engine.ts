/**
 * Orbit voice engine: the dictation (speech recognition) and spoken-reply (speech synthesis)
 * lifecycles as small state machines over injected browser APIs. No React here: the hooks in
 * useOrbitVoice.ts subscribe to these controllers, and the tests drive them with mocks.
 *
 * Browser rules this encodes (the reasons for the shape of the code):
 * - iOS Safari only lets speechSynthesis.speak() and recognition.start() begin inside the tap
 *   that asked for them. Both are therefore called synchronously from start()/speak(), never
 *   from a timer or a promise callback. Speech that starts later (a reply read aloud when it
 *   arrives) works only once synthesis was unlocked by a tap: prime().
 * - Android Chrome ends recognition on every pause and, in continuous mode, repeats earlier
 *   words in later results. On Android each session is a single utterance; the dictation is
 *   carried on by a bounded number of restarts while the visitor keeps talking.
 * - A browser may skip events (no "start", no "end" after an error), so every waiting state
 *   has a timeout that settles it.
 * - Chrome drops the events of an utterance that was garbage collected, so live utterances
 *   are held until they finish.
 */

/* ------------------------------------------------------------------ shared */

export interface TimerApi {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const realTimers: TimerApi = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
};

type Listener = () => void;

class Observable<S> {
  protected state: S;
  private listeners = new Set<Listener>();
  constructor(initial: S) {
    this.state = initial;
  }
  getState = (): S => this.state;
  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  protected set(patch: Partial<S>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
}

/** BCP 47 tag with a region ("en" → "en-US"); some Android recognisers reject a bare language. */
export function resolveLocale(docLang: string | undefined, navLang: string | undefined): string {
  const doc = (docLang || "").trim().replace("_", "-");
  const nav = (navLang || "").trim().replace("_", "-");
  if (doc.includes("-")) return doc;
  if (doc && nav.toLowerCase().startsWith(doc.toLowerCase() + "-")) return nav;
  if (doc) return doc.toLowerCase() === "en" ? "en-US" : doc;
  return nav || "en-US";
}

export function joinText(existing: string, addition: string) {
  const a = existing.replace(/\s+$/, "");
  const b = addition.trim();
  if (!b) return existing;
  return (a ? `${a} ${b}` : b).slice(0, 4000);
}

/* ------------------------------------------------------------------ dictation */

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
export type RecognitionCtor = new () => SpeechRecognitionLike;

export type VoiceErrorKind =
  | "unsupported"
  | "insecure"
  | "permission"
  | "no-device"
  | "device-busy"
  | "no-speech"
  | "service"
  | "network"
  | "transcription"
  | "unexpected";

export interface VoiceError {
  kind: VoiceErrorKind;
  message: string;
  /** The microphone works but the browser's recogniser does not */
  serviceProblem?: boolean;
  /** Soft notices (e.g. nothing heard) rather than failures */
  soft?: boolean;
}

export const VOICE_ERRORS = {
  unsupported: { kind: "unsupported", message: "This browser doesn't support speech recognition. You can type your message instead." },
  insecure: { kind: "insecure", message: "Voice input needs a secure (HTTPS) connection." },
  permission: {
    kind: "permission",
    message: "Microphone access is blocked for this site. Allow it from the site settings next to the address bar, then try again.",
  },
  "no-device": { kind: "no-device", message: "No usable microphone was detected." },
  "device-busy": { kind: "device-busy", message: "The microphone is being used by another application." },
  "no-speech": { kind: "no-speech", message: "No speech was detected. Tap the microphone and try again.", soft: true },
  service: {
    kind: "service",
    message: "This browser's speech-recognition service is turned off or unavailable. Your microphone is fine.",
    serviceProblem: true,
  },
  "speech-blocked": {
    kind: "service",
    message:
      "Speech recognition was refused. If the microphone is allowed, check that dictation (on iPhone: Siri & Dictation) is turned on for this browser, then try again.",
    serviceProblem: true,
  },
  network: {
    kind: "network",
    message:
      "This browser couldn't reach its speech-recognition service. Your microphone is fine; this happens in some browsers (such as Brave or Opera) and on restricted networks.",
    serviceProblem: true,
  },
  "start-timeout": { kind: "unexpected", message: "The microphone didn't start. Tap it to try again, or type your message." },
  unexpected: { kind: "unexpected", message: "Voice input stopped unexpectedly. Tap the microphone to try again, or type your message." },
} satisfies Record<string, VoiceError>;

/**
 * Map Web Speech error codes. "not-allowed" is reported both when the microphone permission is
 * refused and when the browser refuses its speech service (iOS with dictation turned off), so
 * it is told apart by the Permissions API answer when the browser gives one.
 */
export function recognitionError(code: string, micPermission: PermissionState | "unknown" = "unknown"): VoiceError | null {
  switch (code) {
    case "aborted":
      return null; // our own stop or cancel
    case "no-speech":
      return VOICE_ERRORS["no-speech"];
    case "audio-capture":
      return VOICE_ERRORS["no-device"];
    case "network":
      return VOICE_ERRORS.network;
    case "service-not-allowed":
      return VOICE_ERRORS.service;
    case "not-allowed":
      return micPermission === "granted" ? VOICE_ERRORS["speech-blocked"] : VOICE_ERRORS.permission;
    case "language-not-supported":
      return { kind: "service", message: "Speech recognition doesn't support this language in this browser.", serviceProblem: true };
    default:
      return VOICE_ERRORS.unexpected;
  }
}

export type DictationPhase = "idle" | "starting" | "listening" | "stopping";

export interface DictationState {
  phase: DictationPhase;
  error: VoiceError | null;
}

export interface DictationEnv extends TimerApi {
  getCtor(): RecognitionCtor | null;
  isSecureContext(): boolean;
  locale(): string;
  /** Android recognisers: one utterance per session (see the module comment) */
  singleUtterance(): boolean;
  /** Microphone permission as last reported by the Permissions API ("unknown" when not exposed) */
  micPermission(): PermissionState | "unknown";
}

/** Restarts allowed after a session that heard speech ends on its own (Android pauses) */
export const MAX_AUTO_RESTARTS = 4;
/** No "start" event within this time: treat the session as started (or failed if it ended) */
export const START_GRACE_MS = 4000;
/** No "end" event within this time after stop() or an error: settle anyway */
export const END_GRACE_MS = 1500;

/**
 * One authoritative dictation at a time. A dictation is one or more recogniser sessions (more
 * than one only when a single-utterance recogniser is restarted while the visitor keeps talking);
 * every callback is checked against the current session, so a stale recogniser can never write
 * to the composer, and cancel() (used when the message is sent) discards whatever is pending.
 *
 * Text model: `base` is the composer text when the microphone was tapped; `committed` holds the
 * words of finished sessions; the current session's final and interim words follow. The
 * composer always shows base + committed + current.
 */
export class DictationController extends Observable<DictationState> {
  private env: DictationEnv;
  private onText: (text: string) => void;
  private session = 0;
  private rec: SpeechRecognitionLike | null = null;
  private base = "";
  private committed = "";
  private sessionFinal = "";
  private sessionInterim = "";
  private heardInSession = false;
  private restarts = 0;
  private userStopped = false;
  private pendingError: VoiceError | null = null;
  private timer: unknown = null;

  constructor(env: DictationEnv, onText: (text: string) => void) {
    super({ phase: "idle", error: null });
    this.env = env;
    this.onText = onText;
  }

  setOnText(fn: (text: string) => void) {
    this.onText = fn;
  }

  get supported() {
    return Boolean(this.env.getCtor());
  }

  /** Must be called from the tap itself (iOS requires the gesture for recognition.start). */
  start(existing: string) {
    if (this.state.phase !== "idle") return;
    const Ctor = this.env.getCtor();
    if (!Ctor) return this.set({ error: VOICE_ERRORS.unsupported });
    if (!this.env.isSecureContext()) return this.set({ error: VOICE_ERRORS.insecure });

    this.base = existing;
    this.committed = "";
    this.restarts = 0;
    this.userStopped = false;
    this.pendingError = null;
    this.set({ phase: "starting", error: null });
    this.open(Ctor);
  }

  /** The visitor's stop: keep what was heard and finish. */
  stop() {
    const phase = this.state.phase;
    if (phase === "idle" || phase === "stopping") return;
    this.userStopped = true;
    this.set({ phase: "stopping" });
    const rec = this.rec;
    if (!rec) return this.finish();
    try {
      rec.stop();
    } catch {
      return this.finish();
    }
    this.arm(END_GRACE_MS, () => this.finish());
  }

  /** Discard everything pending (the message was sent, or the conversation reset). */
  cancel() {
    this.session += 1;
    this.disarm();
    this.detach(true);
    this.pendingError = null;
    if (this.state.phase !== "idle") this.set({ phase: "idle" });
  }

  clearError() {
    if (this.state.error) this.set({ error: null });
  }

  dispose() {
    this.cancel();
  }

  /* -------------------------------------------------------------- internals */

  private open(Ctor: RecognitionCtor) {
    const session = ++this.session;
    const single = this.env.singleUtterance();
    let rec: SpeechRecognitionLike;
    try {
      rec = new Ctor();
    } catch {
      return this.fail(VOICE_ERRORS.unexpected);
    }
    rec.lang = this.env.locale();
    rec.continuous = !single;
    rec.interimResults = true;
    this.sessionFinal = "";
    this.sessionInterim = "";
    this.heardInSession = false;

    const current = () => session === this.session && rec === this.rec;
    const started = () => {
      if (!current()) return;
      if (this.state.phase === "starting") {
        this.disarm();
        this.set({ phase: "listening" });
      }
    };
    rec.onstart = started;
    rec.onaudiostart = started;

    rec.onresult = (e) => {
      if (!current()) return;
      // each session has its own result list; rebuild it rather than appending, so a browser
      // that re-sends earlier results cannot duplicate words
      let fin = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r?.[0]?.transcript ?? "";
        if (r.isFinal) fin += t;
        else interim += t;
      }
      this.sessionFinal = fin;
      this.sessionInterim = interim;
      if (fin.trim() || interim.trim()) this.heardInSession = true;
      started();
      this.emit(joinText(this.committed, fin + interim));
    };

    rec.onerror = (e) => {
      if (!current()) return;
      const mapped = recognitionError(e.error, this.env.micPermission());
      // silence after words were already captured is the natural end of a dictation, not an error
      const naturalEnd = mapped?.kind === "no-speech" && Boolean(this.committed || this.heardInSession);
      if (mapped && !naturalEnd) this.pendingError = mapped;
      // not every browser follows an error with "end"
      this.arm(END_GRACE_MS, () => {
        if (current()) this.onSessionEnd();
      });
    };

    rec.onend = () => {
      if (!current()) return;
      this.onSessionEnd();
    };

    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.rec = null;
      return this.fail(VOICE_ERRORS.unexpected);
    }
    if (this.state.phase === "starting") {
      // no "start" event: assume it is running unless it ends or fails meanwhile
      this.arm(START_GRACE_MS, () => {
        if (current() && this.state.phase === "starting") this.set({ phase: "listening" });
      });
    }
  }

  private onSessionEnd() {
    this.disarm();
    // a browser that never marks results final (seen on iOS) still keeps what it showed
    const words = this.sessionFinal.trim() ? this.sessionFinal : this.sessionInterim;
    this.committed = joinText(this.committed, words);
    const heard = this.heardInSession;
    this.detach(false);

    if (this.pendingError) return this.finish();
    if (this.userStopped) return this.finish();

    // A single-utterance recogniser (Android) ends at every pause: carry on while the visitor
    // is still talking (bounded). A continuous one ended because the browser decided so, and a
    // restart outside the tap could be refused (iOS): finish.
    const Ctor = this.env.getCtor();
    if (heard && this.env.singleUtterance() && this.restarts < MAX_AUTO_RESTARTS && Ctor) {
      this.restarts += 1;
      this.open(Ctor);
      return;
    }
    this.finish();
  }

  private finish() {
    this.disarm();
    this.detach(true);
    this.session += 1;
    const error = this.pendingError;
    this.pendingError = null;
    this.emit(this.committed);
    this.set({ phase: "idle", error });
  }

  private fail(error: VoiceError) {
    this.disarm();
    this.detach(true);
    this.session += 1;
    this.set({ phase: "idle", error });
  }

  private emit(spoken: string) {
    if (!spoken.trim()) return;
    this.onText(joinText(this.base, spoken));
  }

  private detach(abort: boolean) {
    const rec = this.rec;
    this.rec = null;
    if (!rec) return;
    rec.onstart = null;
    rec.onaudiostart = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    if (abort) {
      try {
        rec.abort();
      } catch {
        // already ended
      }
    }
  }

  private arm(ms: number, fn: () => void) {
    this.disarm();
    this.timer = this.env.setTimeout(() => {
      this.timer = null;
      fn();
    }, ms);
  }

  private disarm() {
    if (this.timer !== null) this.env.clearTimeout(this.timer);
    this.timer = null;
  }
}

/* ------------------------------------------------------------------ spoken replies */

/** Turn a Markdown reply into natural speech: no syntax, code or raw URLs read aloud. */
export function speakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " I've included a code sample on screen. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " a link on screen ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\|/g, ", ")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();
}

/** Short utterances avoid Chrome's long-utterance cut-off and keep cancellation snappy. */
export function chunkSentences(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * Rank installed voices: language match first, then quality hints browsers expose in voice
 * names ("Natural"/"Neural" on Edge and Windows, "Enhanced"/"Premium" on Apple, Google's
 * network voices in Chrome). Legacy SAPI "Desktop" voices and eSpeak-style engines rank last.
 */
export function scoreVoice(v: Pick<SpeechSynthesisVoice, "lang" | "name" | "default">, lang: string): number {
  const vl = (v.lang || "").toLowerCase().replace("_", "-");
  const want = lang.toLowerCase();
  let score = 0;
  if (vl === want) score += 100;
  else if (vl.split("-")[0] === want.split("-")[0]) score += 60;
  else return -1000;
  const n = v.name.toLowerCase();
  if (/natural|neural/.test(n)) score += 50;
  if (/enhanced|premium|siri/.test(n)) score += 35;
  if (/google/.test(n)) score += 25;
  if (/desktop|espeak|festival|compact|robot/.test(n)) score -= 40;
  if (v.default) score += 5;
  return score;
}

export function rankVoices<V extends Pick<SpeechSynthesisVoice, "lang" | "name" | "default">>(voices: V[], locale: string): V[] {
  const lang = locale.toLowerCase();
  return voices
    .map((v) => ({ v, s: scoreVoice(v, lang) }))
    .filter((x) => x.s > -1000)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);
}

export interface SynthLike {
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  speak(u: UtteranceLike): void;
  cancel(): void;
  resume(): void;
  getVoices(): VoiceLike[];
}
export interface VoiceLike {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
}
export interface UtteranceLike {
  text: string;
  lang: string;
  voice: VoiceLike | null;
  rate: number;
  pitch: number;
  volume: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
export type UtteranceCtor = new (text: string) => UtteranceLike;

export interface SpeechEnv extends TimerApi {
  synth(): SynthLike | null;
  Utterance(): UtteranceCtor | null;
  locale(): string;
  /** The voice the visitor chose (or the best ranked one); null lets the browser decide */
  pickVoice(): VoiceLike | null;
}

export type PlaybackPhase = "idle" | "preparing" | "playing";

export interface PlaybackState {
  phase: PlaybackPhase;
  /** The reply being prepared or played */
  id: string | null;
  error: string | null;
}

/** No "start" event within this time: the speech did not begin */
export const SPEAK_START_MS = 3500;

export const SPEECH_ERRORS = {
  unsupported: "Spoken replies aren't available in this browser.",
  empty: "This reply has nothing to read aloud.",
  blocked: "The browser blocked speech playback. Tap Listen on the reply to hear it.",
  failed: "This reply couldn't be read aloud. Tap Listen to try again.",
  silent:
    "Speech didn't start on this device. Check the volume (and on iPhone, the silent switch), then tap Listen to try again.",
} as const;

/** Errors after which the same text may play with the browser's default voice */
const VOICE_RETRY_CODES = new Set(["synthesis-failed", "voice-unavailable", "language-unavailable", "synthesis-unavailable", "text-too-long"]);

/**
 * Spoken replies. The state is truthful: "preparing" from the tap until the browser reports
 * that speech started, "playing" only after that, and back to "idle" when it ends, fails or
 * never starts. One reply at a time: a new one (or stop) cancels the previous one and
 * invalidates its queued sentences.
 */
export class SpeechController extends Observable<PlaybackState> {
  private env: SpeechEnv;
  private run = 0;
  private timer: unknown = null;
  /** Live utterances, kept referenced until they finish (Chrome drops events of collected ones) */
  private live = new Set<UtteranceLike>();
  private primed = false;

  constructor(env: SpeechEnv) {
    super({ phase: "idle", id: null, error: null });
    this.env = env;
  }

  get supported() {
    return Boolean(this.env.synth() && this.env.Utterance());
  }

  /**
   * Unlock synthesis inside a tap (iOS allows later, untapped speech only after one spoken from
   * a gesture). A silent, empty utterance; harmless elsewhere. Only the first call does anything.
   */
  prime() {
    if (this.primed) return;
    const synth = this.env.synth();
    const U = this.env.Utterance();
    if (!synth || !U) return;
    this.primed = true;
    if (synth.speaking || synth.pending) return; // already unlocked by real speech
    try {
      const u = new U("");
      u.volume = 0;
      const done = () => this.live.delete(u);
      u.onend = done;
      u.onerror = done;
      this.live.add(u);
      synth.speak(u);
    } catch {
      // nothing to unlock
    }
  }

  /** Speak a reply. Call it from the tap when there is one: the first sentence starts in it. */
  speak(id: string, markdown: string) {
    const synth = this.env.synth();
    const U = this.env.Utterance();
    if (!synth || !U) return this.set({ phase: "idle", id: null, error: SPEECH_ERRORS.unsupported });
    const parts = chunkSentences(speakable(markdown)).filter((p) => p.trim());
    if (!parts.length) return this.set({ phase: "idle", id: null, error: SPEECH_ERRORS.empty });

    const run = ++this.run;
    this.disarm();
    // cancel only what is actually queued: a cancel() right before speak() on an idle engine
    // can swallow the new utterance in some Chrome builds
    try {
      if (synth.speaking || synth.pending) synth.cancel();
      if (synth.paused) synth.resume();
    } catch {
      // ignore
    }
    this.live.clear();
    this.primed = true;
    this.set({ phase: "preparing", id, error: null });

    let index = 0;
    let started = false;
    let voice = this.env.pickVoice();
    let retriedWithoutVoice = false;

    const isCurrent = () => run === this.run;

    const settle = (error: string | null) => {
      if (!isCurrent()) return;
      this.disarm();
      this.live.clear();
      this.set({ phase: "idle", id: null, error });
    };

    const retryWithoutVoice = () => {
      // the chosen voice is listed but cannot speak here (seen on Android): use the default
      retriedWithoutVoice = true;
      voice = null;
      try {
        if (synth.speaking || synth.pending) synth.cancel();
      } catch {
        // ignore
      }
      speakPart(index - 1);
    };

    const speakPart = (i: number) => {
      if (!isCurrent()) return;
      if (i >= parts.length) return settle(null);
      index = i + 1;
      let u: UtteranceLike;
      try {
        u = new U(parts[i]);
      } catch {
        return settle(SPEECH_ERRORS.failed);
      }
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang.replace("_", "-");
      } else {
        u.lang = this.env.locale();
      }
      u.rate = 0.98;
      u.pitch = 1;
      u.volume = 1;
      u.onstart = () => {
        if (!isCurrent()) return;
        if (!started) {
          started = true;
          this.disarm();
          this.set({ phase: "playing" });
        }
      };
      u.onend = () => {
        this.live.delete(u);
        if (!isCurrent()) return;
        speakPart(i + 1);
      };
      u.onerror = (e) => {
        this.live.delete(u);
        if (!isCurrent()) return;
        const code = e?.error || "";
        if (code === "interrupted" || code === "canceled") return; // our own cancel
        if (!started && voice && !retriedWithoutVoice && VOICE_RETRY_CODES.has(code)) return retryWithoutVoice();
        settle(code === "not-allowed" ? SPEECH_ERRORS.blocked : SPEECH_ERRORS.failed);
      };
      this.live.add(u);

      if (!started) {
        this.arm(SPEAK_START_MS, () => {
          if (!isCurrent() || started) return;
          if (voice && !retriedWithoutVoice) return retryWithoutVoice();
          try {
            synth.cancel();
          } catch {
            // ignore
          }
          settle(SPEECH_ERRORS.silent);
        });
      }
      try {
        synth.speak(u);
      } catch {
        this.live.delete(u);
        settle(SPEECH_ERRORS.failed);
      }
    };

    speakPart(0);
  }

  stop() {
    this.run += 1;
    this.disarm();
    const synth = this.env.synth();
    try {
      if (synth && (synth.speaking || synth.pending)) synth.cancel();
    } catch {
      // ignore
    }
    this.live.clear();
    if (this.state.phase !== "idle" || this.state.id) this.set({ phase: "idle", id: null });
  }

  /** Listen / Stop on one reply */
  toggle(id: string, markdown: string) {
    if (this.state.id === id && this.state.phase !== "idle") this.stop();
    else this.speak(id, markdown);
  }

  clearError() {
    if (this.state.error) this.set({ error: null });
  }

  dispose() {
    this.stop();
  }

  private arm(ms: number, fn: () => void) {
    this.disarm();
    this.timer = this.env.setTimeout(() => {
      this.timer = null;
      fn();
    }, ms);
  }

  private disarm() {
    if (this.timer !== null) this.env.clearTimeout(this.timer);
    this.timer = null;
  }
}

/* ------------------------------------------------------------------ browser environments */

export function browserLocale(): string {
  if (typeof document === "undefined") return "en-US";
  return resolveLocale(document.documentElement.lang, typeof navigator !== "undefined" ? navigator.language : undefined);
}

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Microphone permission tracked through the Permissions API where the browser exposes it */
export function trackMicPermission(): () => PermissionState | "unknown" {
  let value: PermissionState | "unknown" = "unknown";
  try {
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => {
        value = status.state;
        status.onchange = () => {
          value = status.state;
        };
      })
      .catch(() => {});
  } catch {
    // not exposed (older Safari)
  }
  return () => value;
}

export function browserDictationEnv(): DictationEnv {
  const mic = typeof navigator !== "undefined" ? trackMicPermission() : () => "unknown" as const;
  return {
    ...realTimers,
    getCtor: getRecognitionCtor,
    isSecureContext: () => typeof window !== "undefined" && window.isSecureContext,
    locale: browserLocale,
    singleUtterance: () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
    micPermission: mic,
  };
}

export function browserSpeechEnv(pickVoice: () => VoiceLike | null): SpeechEnv {
  return {
    ...realTimers,
    synth: () => (typeof window !== "undefined" && "speechSynthesis" in window ? (window.speechSynthesis as unknown as SynthLike) : null),
    Utterance: () =>
      typeof window !== "undefined" && typeof window.SpeechSynthesisUtterance === "function"
        ? (window.SpeechSynthesisUtterance as unknown as UtteranceCtor)
        : null,
    locale: browserLocale,
    pickVoice,
  };
}
