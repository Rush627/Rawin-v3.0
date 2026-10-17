"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { THEME_CHANGE_EVENT } from "@/components/theme/ThemeProvider";
import { createFieldRenderer, type FieldRenderer } from "./particles/field-gl";
import { sampleGlyphPoints } from "./particles/glyph-mask";
import { createForegroundMap, fgHit, FG_PAD } from "./particles/foreground";
import { getHeroScene, setHeroPhase, subscribeFieldSignal, subscribeHeroScene, type FieldSignal } from "./particles/scene";

/**
 * RAWIN particle layer — two independent systems sharing one canvas and one loop.
 *
 * Background field: fine silver grains on slowly flowing, line-like streamlines (GPU-only,
 * see particles/field-gl.ts). It moves on its own clock and never reacts to the pointer.
 * It belongs to the homepage hero: drawn only while a hero is registered (particles/scene)
 * and on screen, clipped to the hero's box and moving with it.
 *
 * Cursor cloud: a weighted cloud of grains that follows the pointer.
 * - The cloud centre eases toward the pointer (FOLLOW_EASE), so the pointer leads and the
 *   cloud catches up; each grain is a softly damped spring toward its own slot in the cloud,
 *   so the mass keeps momentum and settles without bouncing.
 * - Slots form a dense elliptical core with a diffuse fringe; on movement they stretch back
 *   along the direction of travel, and a short-lived trail of grains marks the path.
 * - All visible content is a body in the field, through one shared foreground map
 *   (particles/foreground: text, SVG geometry, media, cards, frosted panels, the navigation,
 *   controls). Grains feel it a little before the boundary, slide along it, come to rest just
 *   outside it and never draw across it; fast grains that strike a surface or control are
 *   deflected and shed a few short-lived sparks. Grains whose home in the cloud lies inside
 *   content are displaced (faded) rather than piled onto it. Each class answers at its own
 *   scale: small type keeps a tight, unlit margin; display type parts around its letterforms;
 *   photographs and panels get the wider, softly lit rim.
 *   The hero's background field never reads it: it is atmosphere, independent of content
 *   and of the pointer, and runs on behind the portrait and the type (field-gl).
 * - Field signals (particles/scene) let a component ask for a short local burst: grains shed
 *   from an element's letter contours or around its rim, independent of the pointer.
 * - When the pointer rests, the cloud gently loosens and dims, then the simulation sleeps.
 * - On a first load / reload of the homepage, the cloud emerges from the hero name: grains
 *   are seeded on the rendered letterforms (sampled once, after fonts and the name's entrance
 *   have settled) and released in a left-to-right sweep into the cloud, which then follows
 *   the pointer through the same eased model.
 *
 * Gating: dark theme, fine pointer, no reduced motion; never on the Orbit stage or a
 * standalone system screen; paused while the tab is hidden; the whole loop sleeps after a
 * period without input. No React state per frame; a 2D-canvas cloud is the fallback when
 * WebGL is unavailable (no background field then).
 */

// ------------------------------------------------------------------ tuning
/** Share of the remaining distance the cloud centre covers per 60fps frame. */
const FOLLOW_EASE = 0.065;
/** Natural frequency range of the grain springs (Hz); spread gives internal motion. */
const SPRING_HZ_MIN = 0.45;
const SPRING_HZ_MAX = 0.8;
/** Grain spring damping ratio (1 = critical). Slightly under for a living, unbouncy settle. */
const DAMPING_RATIO = 0.86;
/** Cloud half-extents at a 1440px-wide viewport (scaled with the viewport). */
const CLOUD_RADIUS_X = 116;
const CLOUD_RADIUS_Y = 66;
/** Core concentration: Gaussian σ as a share of the radius (smaller = denser centre). */
const CLOUD_CORE_SIGMA = 0.32;
/** Trailing stretch: px of slot offset per px/frame of centre speed (per-grain share 0–1). */
const STRETCH = 7;
const STRETCH_MAX = 230;
/** Base grain opacity (the core is brighter, the fringe softer). */
const GRAIN_OPACITY = 1;
/** Trail grains: lifetime (s), spawn rate (grains per px travelled), opacity. */
const TRAIL_LIFETIME = 1.05;
const TRAIL_PER_PX = 1.6;
const TRAIL_OPACITY = 0.38;
/** Foreground: push and tangential slide (px/s²) inside the response band, and restitution of
 *  grains that strike a boundary. */
const SURF_REPEL = 1500;
const SURF_SLIDE = 620;
const SURF_RESTITUTION = 0.32;
/** Per foreground class — [small type, display type, surface, control, line]:
 *  response band outside the boundary (px), share of a grain's resting offset it keeps,
 *  lift of grains gathered at the edge, depth (px) over which a slot inside content fades,
 *  whether strikes shed sparks, and the share of the push and of the slide it applies.
 *  A label stays quiet; a photograph gets a lit rim; decorative geometry (rails, rules,
 *  nodes) is no wall: a light push, a stronger flow along it and a faint travelling ripple. */
const SKIN_BY = [10, 16, 24, 22, 14];
const REST_BY = [0.9, 0.7, 1, 0.8, 0.45];
const GLOW_BY = [0, 0.2, 0.4, 0.8, 0.3];
const DEPTH_BY = [10, 16, 32, 16, 5];
const SPARKS_BY = [false, false, true, true, false];
const PUSH_BY = [1, 1, 1, 1, 0.42];
const SLIDE_BY = [1, 1, 1, 1, 1.7];
/** Line ripple: perpendicular sway (px/s²), wavelength along the line (px) and speed (rad/s). */
const LINE_RIPPLE = 240;
const LINE_RIPPLE_WAVE = 22;
const LINE_RIPPLE_SPEED = 3.2;
const FG_LINE_CLASS = 4;
/** Grains rest this far outside a boundary: a minimum plus a per-grain spread (px). */
const SURF_CONTACT = 1.5;
const SURF_CONTACT_SPREAD = 11;
/** A grain deeper than this inside content (px) is pushed out over time, never snapped out. */
const SNAP_DEPTH = 8;
/** Impacts faster than this (px/s, into the surface) may shed a spark; at most this many/frame. */
const SURF_SPARK_IMPACT = 70;
const SURF_SPARK_CHANCE = 0.1;
const SURF_SPARK_MAX = 18;
/** Rest: after this long without movement the cloud loosens/dims to IDLE_GAIN. */
const IDLE_AFTER_MS = 1800;
const IDLE_GAIN = 0.5;
const IDLE_SPREAD = 1.16;
/** The cloud simulation always sleeps this long after the last pointer movement (ms). */
const SETTLE_CAP_MS = 5000;
/** A grain never strays further than this from its slot (px). */
const MAX_DISPLACEMENT = 240;
/** Background field: grains (scaled with screen area). */
const BG_COUNT = 11000;
/** Emergence from the hero name: sweep duration across the name and per-grain jitter (ms). */
const EMERGE_SWEEP_MS = 850;
const EMERGE_JITTER_MS = 200;
/** First grains leave the letters this soon after sampling (ms). */
const EMERGE_LEAD_MS = 40;
/** Emergence-only brightness/size lift, easing back to the normal balance over this long (ms). */
const EMERGE_BOOST = 0.9;
const EMERGE_BOOST_MS = 1600;
/** Share of released grains that also shed a short-lived spark at the letter edge. */
const EMERGE_SPARK_SHARE = 0.4;
/** The emergence starts once each name line is within this share of its height of rest. */
const NAME_SETTLE_SHARE = 0.04;
/** The whole layer sleeps after this long without pointer/scroll/key input (ms). */
const LAYER_SLEEP_MS = 45000;

const OFF_ROUTES = ["/ai"];

/** The name emergence plays once per document load (never on client-side returns). */
let emergenceClaimed = false;

/** Visibility of a grain at signed distance `d` from content: nothing is drawn across it. */
function clearOf(d: number) {
  if (d >= 2) return 1;
  if (d <= -0.5) return 0;
  const t = (d + 0.5) / 2.5;
  return t * t * (3 - 2 * t);
}

function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export default function CursorField() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname() || "/";
  const off = OFF_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const offRef = useRef(off);
  const gateChangedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    offRef.current = off;
    gateChangedRef.current?.();
  }, [off, pathname]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reducedMq.matches) return;

    const cores = navigator.hardwareConcurrency || 4;
    const N = cores <= 4 ? 2400 : 3400;
    const TRAIL_N = 1200;
    const area = (window.innerWidth * window.innerHeight) / (1440 * 900);
    const bgCount = Math.round(BG_COUNT * Math.min(1.4, Math.max(0.6, area)) * (cores <= 4 ? 0.7 : 1));

    // ------------------------------------------------------------- renderer
    // A fresh canvas per mount: a released WebGL context can never be reused, and a canvas
    // that once held WebGL cannot fall back to 2D (StrictMode remounts, retries).
    const makeCanvas = () => {
      const c = document.createElement("canvas");
      c.setAttribute("aria-hidden", "true");
      c.dataset.cursorField = "";
      c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
      host.appendChild(c);
      return c;
    };
    let canvas = makeCanvas();
    let gl: FieldRenderer | null = createFieldRenderer(canvas, bgCount);
    let ctx2d: CanvasRenderingContext2D | null = null;
    if (!gl) {
      canvas.remove();
      canvas = makeCanvas();
      ctx2d = canvas.getContext("2d");
    }
    if (!gl && !ctx2d) {
      canvas.remove();
      return;
    }
    canvas.dataset.renderer = gl ? "webgl" : "2d";

    let w = 0;
    let h = 0;
    let dpr = 1;
    let scale = 1; // cloud size relative to a 1440px viewport
    // The emergence lift: while the hero name gives up its grains they must draw over the
    // letters, so for those ~2s the cloud alone is drawn on a temporary canvas above the content.
    // The layer canvas never leaves z-index 0: the ambient field it also carries stays behind the
    // portrait and the type from the first frame (raising the whole layer used to lift it too).
    let lift: { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;
    const sizeLift = () => {
      if (!lift) return;
      lift.c.width = Math.round(w * dpr);
      lift.c.height = Math.round(h * dpr);
      lift.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const openLift = () => {
      if (lift) return;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.setAttribute("aria-hidden", "true");
      c.setAttribute("data-field-ignore", "");
      c.dataset.fieldLift = "";
      c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:30;";
      document.body.appendChild(c);
      lift = { c, ctx };
      sizeLift();
    };
    const closeLift = () => {
      lift?.c.remove();
      lift = null;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      scale = Math.min(1.15, Math.max(0.7, w / 1440));
      if (gl) gl.resize(w, h, dpr);
      else if (ctx2d) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      sizeLift();
    };
    resize();

    // ------------------------------------------------------------- cloud grains
    const sx = new Float32Array(N); // slot (unit, before radius)
    const sy = new Float32Array(N);
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const omega = new Float32Array(N);
    const lagShare = new Float32Array(N);
    const bright = new Float32Array(N);
    const size = new Float32Array(N);
    const phase = new Float32Array(N);
    const releaseAt = new Float32Array(N); // emergence: grain held on its letter until then (ms)
    const contact = new Float32Array(N); // how far outside a surface this grain comes to rest (px)
    for (let i = 0; i < N; i++) {
      // dense Gaussian core plus a wider, sparse fringe
      const fringe = Math.random() < 0.22;
      const sigma = fringe ? CLOUD_CORE_SIGMA * 2.1 : CLOUD_CORE_SIGMA;
      sx[i] = Math.max(-2.2, Math.min(2.2, gaussian() * sigma));
      sy[i] = Math.max(-2.2, Math.min(2.2, gaussian() * sigma));
      const hz = SPRING_HZ_MIN + Math.random() * (SPRING_HZ_MAX - SPRING_HZ_MIN);
      omega[i] = 2 * Math.PI * hz;
      lagShare[i] = Math.pow(Math.random(), 1.4);
      const r2 = sx[i] * sx[i] + sy[i] * sy[i];
      bright[i] = (0.35 + 0.65 * Math.exp(-r2 * 3.2)) * (0.55 + 0.45 * Math.random());
      const s = Math.random();
      size[i] = s > 0.96 ? 2.1 : s > 0.7 ? 1.6 : 1.25;
      phase[i] = Math.random() * Math.PI * 2;
      contact[i] = SURF_CONTACT + Math.pow(Math.random(), 1.6) * SURF_CONTACT_SPREAD;
    }
    // trail grains
    const tx = new Float32Array(TRAIL_N);
    const ty = new Float32Array(TRAIL_N);
    const tvx = new Float32Array(TRAIL_N);
    const tvy = new Float32Array(TRAIL_N);
    const tlife = new Float32Array(TRAIL_N);
    const tmax = new Float32Array(TRAIL_N);
    const tbright = new Float32Array(TRAIL_N); // trail brightness (sparks shed by the letters are brighter)
    const tstart = new Float64Array(TRAIL_N); // signal sparks wait until then (ms) before appearing
    const tfree = new Uint8Array(TRAIL_N); // 1: shown regardless of the cloud's presence (signals)
    let trailHead = 0;
    let trailAlive = 0;
    let trailCarry = 0;

    const points = new Float32Array((N + TRAIL_N) * 4);
    let pointCount = 0;

    /** One trail grain / spark into the ring buffer. */
    const spawnTrail = (x: number, y: number, vx0: number, vy0: number, life: number, brightness: number, startAt = 0, free = 0) => {
      const k = trailHead;
      trailHead = (trailHead + 1) % TRAIL_N;
      tx[k] = x;
      ty[k] = y;
      tvx[k] = vx0;
      tvy[k] = vy0;
      tmax[k] = life;
      tlife[k] = life;
      tbright[k] = brightness;
      tstart[k] = startAt;
      tfree[k] = free;
    };

    // ------------------------------------------------------------- state
    let dark = document.documentElement.getAttribute("data-theme") === "dark";
    let standalone = document.documentElement.hasAttribute("data-error-active");
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;
    let lastCx = 0;
    let lastCy = 0;
    let seeded = false;
    let present = false;
    let presence = 0; // whole-cloud fade in/out
    let gain = 1; // rest dimming
    let spreadNow = 1;
    let lastMove = 0;
    let lastInput = performance.now();
    let cloudAwake = false;
    let raf = 0;
    let running = false;
    let lastFrame = 0;
    let lastBgDraw = 0;
    let holding = false; // some grains are still held on the name
    let lowerAt = 0; // when to return the layer behind the content after the emergence
    let boostUntil = 0; // emergence brightness lift fades out by then
    let emergeCx = 0; // centre of the name, for the outward release
    let emergeCy = 0;
    let hero = getHeroScene();
    const t0 = performance.now();

    const enabled = () => dark && !offRef.current && !standalone && !document.hidden;

    // The homepage sequence (particles/scene.ts): on a fresh load of the homepage, and after a
    // switch back to the dark theme there, the field draws nothing and follows nothing until the
    // name has given up its grains. `followFrom` is when following may begin (Infinity = held);
    // the pointer is only remembered meanwhile, and the cloud glides to it once released.
    const isFreshLoad = () => {
      const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
      return !nav || nav.type === "navigate" || nav.type === "reload";
    };
    const sequenceDue = () => !emergenceClaimed && isFreshLoad() && location.pathname === "/";
    let followFrom = sequenceDue() ? Infinity : 0;
    let followTimer = 0;
    let pendingX = 0;
    let pendingY = 0;
    let pointerIn = false;
    if (followFrom === Infinity) setHeroPhase(dark ? "name-reveal" : "inactive");
    const openFollow = (at: number) => {
      followFrom = at;
      window.clearTimeout(followTimer);
      followTimer = window.setTimeout(() => {
        if (!enabled()) return;
        setHeroPhase("cursor-following");
        if (pointerIn) {
          // the cloud glides from where it gathered to the pointer (no jump)
          mx = pendingX;
          my = pendingY;
          present = true;
          lastMove = performance.now();
          cloudAwake = true;
          start();
        }
      }, Math.max(0, at - performance.now()));
    };
    /** The sequence cannot run (name off screen, nothing to sample): release the field now. */
    const abandonSequence = () => {
      if (followFrom !== Infinity) return;
      setHeroPhase("particle-emergence");
      openFollow(performance.now());
    };

    // ------------------------------------------------------------- the foreground
    // One map of all visible content, shared with the GPU field; rebuilt from the loop on a
    // throttled cadence (scroll, resize, fonts, DOM changes, route changes, periodic refresh).
    const fg = createForegroundMap(() => {
      canvas.dataset.fg = String(fg.version);
    });
    try {
      if (localStorage.getItem("rawin-field-debug") === "1") (window as unknown as { __rawinField?: unknown }).__rawinField = { map: fg, hit: fgHit };
    } catch {}
    const domObserver = new MutationObserver(() => fg.invalidate());
    domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    // ------------------------------------------------------------- cloud step
    const stepCloud = (dt: number, now: number) => {
      const k60 = dt * 60;
      // centre follows the pointer with an eased lag
      const ease = 1 - Math.pow(1 - FOLLOW_EASE, k60);
      lastCx = cx;
      lastCy = cy;
      cx += (mx - cx) * ease;
      cy += (my - cy) * ease;
      const dxc = cx - lastCx;
      const dyc = cy - lastCy;
      const travelled = Math.hypot(dxc, dyc);
      const speed = travelled / Math.max(k60, 0.001); // px per 60fps frame
      const dirX = travelled > 0.01 ? dxc / travelled : 0;
      const dirY = travelled > 0.01 ? dyc / travelled : 0;

      const resting = now - lastMove > IDLE_AFTER_MS;
      const ge = 1 - Math.pow(1 - 0.03, k60);
      gain += ((resting ? IDLE_GAIN : 1) - gain) * ge;
      spreadNow += ((resting ? IDLE_SPREAD : 1) - spreadNow) * ge;
      presence += ((present ? 1 : 0) - presence) * (1 - Math.pow(1 - 0.05, k60));

      const rx = CLOUD_RADIUS_X * scale * spreadNow;
      const ry = CLOUD_RADIUS_Y * scale * spreadNow;
      const lag = Math.min(STRETCH_MAX * scale, speed * STRETCH * scale);
      const time = now * 0.001;
      const mapOn = fg.ready();
      // during the name emergence grains are meant to stream off the letters: no snapping or
      // clearing until the layer is back behind the content
      const intro = holding || lowerAt > 0;
      let moving = 0;
      let n = 0;
      let sparks = 0;
      const boost = boostUntil > now ? 1 + EMERGE_BOOST * Math.min(1, (boostUntil - now) / EMERGE_BOOST_MS) : 1;
      const op = GRAIN_OPACITY * presence * gain * boost;
      const sizeBoost = boost > 1 ? 1 + (boost - 1) * 0.35 : 1;

      let held = 0;
      for (let i = 0; i < N; i++) {
        if (holding && releaseAt[i] > 0 && releaseAt[i] <= now) {
          // just released from its letter: pushed outward from the name (with a slight lift),
          // then the spring carries it into the cloud
          releaseAt[i] = 0;
          const ox = px[i] - emergeCx;
          const oy = py[i] - emergeCy;
          const od = Math.hypot(ox, oy) || 1;
          const sp = 90 + Math.random() * 170;
          vx[i] = (ox / od) * sp + 40;
          vy[i] = (oy / od) * sp - 50;
          if (Math.random() < EMERGE_SPARK_SHARE) {
            // a spark shed at the letter edge: brighter, short-lived, drifting outward
            spawnTrail(
              px[i],
              py[i],
              (ox / od) * sp * 0.8 + (Math.random() - 0.5) * 60,
              (oy / od) * sp * 0.8 - 30 + (Math.random() - 0.5) * 60,
              0.45 + Math.random() * 0.5,
              2.2,
            );
          }
        }
        if (holding && releaseAt[i] > now) {
          // still part of the letterform: drawn in place, bright, over the softened glyph
          held++;
          const a = Math.min(1, bright[i] * 1.35) * GRAIN_OPACITY * presence * boost;
          if (a > 0.01) {
            const j = n * 4;
            points[j] = px[i];
            points[j + 1] = py[i];
            points[j + 2] = a;
            points[j + 3] = size[i] * 1.2;
            n++;
          }
          continue;
        }
        // slot: elliptical cloud + slow internal drift, stretched back along the travel
        const slotX = cx + sx[i] * rx + Math.cos(time * 0.5 + phase[i] * 1.7) * 4 - dirX * lag * lagShare[i];
        const slotY = cy + sy[i] * ry + Math.sin(time * 0.7 + phase[i]) * 5 - dirY * lag * lagShare[i];
        const w0 = omega[i];
        let ax = w0 * w0 * (slotX - px[i]) - 2 * DAMPING_RATIO * w0 * vx[i];
        let ay = w0 * w0 * (slotY - py[i]) - 2 * DAMPING_RATIO * w0 * vy[i];

        const x = px[i];
        const y = py[i];
        // the foreground: a grain whose home lies inside content is displaced, fading with the
        // depth of that home below the boundary; the grain itself answers the nearest boundary
        let fade = 1;
        let sd = FG_PAD;
        let snx = 0;
        let sny = 0;
        let lab = 0;
        if (mapOn) {
          const hd = fg.sample(slotX, slotY);
          if (hd < 0) fade = 1 - Math.min(1, -hd / DEPTH_BY[fgHit.label]);
          sd = fg.sample(x, y);
          snx = fgHit.nx;
          sny = fgHit.ny;
          lab = fgHit.label;
        }
        let glow = 1;
        let tnx = 0;
        let tny = 0;
        const skin = SKIN_BY[lab];
        if (sd < skin) {
          // felt a little before the boundary: pushed out and set sliding along the contour,
          // in the direction the grain already travels (or its own at rest)
          const q = 1 - Math.max(0, sd) / skin;
          tnx = -sny;
          tny = snx;
          const vt = vx[i] * tnx + vy[i] * tny;
          const sg = Math.abs(vt) > 6 ? (vt > 0 ? 1 : -1) : phase[i] > Math.PI ? 1 : -1;
          tnx *= sg;
          tny *= sg;
          const push = SURF_REPEL * PUSH_BY[lab] * q * q;
          const slide = SURF_SLIDE * SLIDE_BY[lab] * q;
          ax += snx * push + tnx * slide;
          ay += sny * push + tny * slide;
          if (lab === FG_LINE_CLASS) {
            // a ripple travelling along the line: grains beside it sway in and out of the band
            const along = x * -sny + y * snx;
            const sway = LINE_RIPPLE * q * Math.sin(time * LINE_RIPPLE_SPEED - along / LINE_RIPPLE_WAVE);
            ax += snx * sway;
            ay += sny * sway;
          }
          glow = 1 + GLOW_BY[lab] * q;
        }

        let nvx = vx[i] + ax * dt;
        let nvy = vy[i] + ay * dt;
        let nx = x + nvx * dt;
        let ny = y + nvy * dt;
        // never stray far from the slot (keeps fast flicks from scattering grains)
        const ox = nx - slotX;
        const oy = ny - slotY;
        const od = Math.hypot(ox, oy);
        if (od > MAX_DISPLACEMENT) {
          const c = MAX_DISPLACEMENT / od;
          nx = slotX + ox * c;
          ny = slotY + oy * c;
          nvx *= 0.6;
          nvy *= 0.6;
        }
        // the boundary itself is never crossed: a grain that reaches it rests just outside
        // (at its own small offset, so the edge reads as a soft band, not a drawn line); one
        // that strikes it is deflected along the contour and may shed a spark. A grain found
        // deep inside (seeded there, or content that moved onto it) is not snapped out — the
        // push above carries it out while it stays hidden.
        let dz = FG_PAD;
        if (mapOn && (sd < FG_PAD || Math.abs(nx - x) + Math.abs(ny - y) > 8)) {
          const d2 = fg.sample(nx, ny);
          const lab2 = fgHit.label;
          const rest = contact[i] * REST_BY[lab2];
          dz = d2;
          if (!intro && d2 < rest && d2 > -SNAP_DEPTH) {
            const n2x = fgHit.nx;
            const n2y = fgHit.ny;
            nx += n2x * (rest - d2);
            ny += n2y * (rest - d2);
            dz = rest;
            const vn = nvx * n2x + nvy * n2y;
            if (vn < 0) {
              nvx -= (1 + SURF_RESTITUTION) * vn * n2x;
              nvy -= (1 + SURF_RESTITUTION) * vn * n2y;
              const kick = -vn * (0.35 + 0.4 * lagShare[i]);
              nvx += tnx * kick;
              nvy += tny * kick;
              if (SPARKS_BY[lab2] && -vn > SURF_SPARK_IMPACT && sparks < SURF_SPARK_MAX && Math.random() < SURF_SPARK_CHANCE) {
                sparks++;
                spawnTrail(
                  nx,
                  ny,
                  tnx * (50 + Math.random() * 110) + n2x * (20 + Math.random() * 50),
                  tny * (50 + Math.random() * 110) + n2y * (20 + Math.random() * 50),
                  0.35 + Math.random() * 0.45,
                  1.7,
                );
              }
            }
          }
        }
        px[i] = nx;
        py[i] = ny;
        vx[i] = nvx;
        vy[i] = nvy;
        // (the slow internal drift moves slots by up to ~4px/s; only real travel counts)
        if (nvx * nvx + nvy * nvy > 64) moving++;

        // nothing is drawn across content, whatever the physics did this frame
        const a = bright[i] * op * glow * fade * (mapOn && !intro ? clearOf(dz) : 1);
        if (a > 0.01) {
          const j = n * 4;
          points[j] = nx;
          points[j + 1] = ny;
          points[j + 2] = a;
          points[j + 3] = size[i] * sizeBoost;
          n++;
        }
      }

      // trail: spawn along the path the centre just travelled, then age
      if (present && travelled > 0.6) {
        trailCarry += travelled * TRAIL_PER_PX * Math.min(1, speed / 6);
        const spawn = Math.min(120, Math.floor(trailCarry));
        trailCarry -= spawn;
        for (let s = 0; s < spawn; s++) {
          const f = Math.random();
          spawnTrail(
            lastCx + dxc * f + gaussian() * rx * 0.32,
            lastCy + dyc * f + gaussian() * ry * 0.32,
            -dirX * (20 + Math.random() * 30) + gaussian() * 12,
            -dirY * (20 + Math.random() * 30) + gaussian() * 12,
            TRAIL_LIFETIME * (0.55 + Math.random() * 0.45),
            1,
          );
        }
      } else {
        trailCarry = 0;
      }
      trailAlive = 0;
      const tdamp = Math.pow(0.9, k60);
      for (let i = 0; i < TRAIL_N; i++) {
        if (tlife[i] <= 0) continue;
        if (tstart[i] > now) {
          trailAlive++; // a signal spark waiting for its moment in the sweep
          continue;
        }
        tlife[i] -= dt;
        if (tlife[i] <= 0) continue;
        trailAlive++;
        tvx[i] *= tdamp;
        tvy[i] *= tdamp;
        tx[i] += tvx[i] * dt;
        ty[i] += tvy[i] * dt;
        const life = tlife[i] / tmax[i];
        let a = Math.min(1, TRAIL_OPACITY * tbright[i] * life * life * (tfree[i] ? 1 : presence));
        if (a > 0.01 && mapOn && !intro) a *= clearOf(fg.sample(tx[i], ty[i]));
        if (a > 0.01) {
          const j = n * 4;
          points[j] = tx[i];
          points[j + 1] = ty[i];
          points[j + 2] = a;
          points[j + 3] = 1.05;
          n++;
        }
      }
      pointCount = n;
      if (holding && held === 0) {
        holding = false;
        lowerAt = now + 700;
      }
      if (lowerAt && now >= lowerAt) {
        lowerAt = 0;
        closeLift();
      }

      // Settled once the rest state is reached and (nearly) every grain is still; a few grains
      // pinned between overlapping content may never fully rest, so the simulation also stops
      // SETTLE_CAP_MS after the last move (never mid-emergence or while a trail is alive).
      const quiet = !holding && !lowerAt && trailAlive === 0;
      const settled =
        quiet &&
        ((resting &&
          Math.abs(gain - IDLE_GAIN) < 0.01 &&
          Math.abs(spreadNow - IDLE_SPREAD) < 0.005 &&
          speed < 0.02 &&
          moving < N * 0.01) ||
          now - lastMove > SETTLE_CAP_MS);
      const gone = !present && presence < 0.01 && trailAlive === 0;
      if (gone) pointCount = 0;
      return !(settled || gone);
    };

    // ------------------------------------------------------------- frame
    /** The hero's on-screen box while it is registered and at least partly visible. */
    const heroBox = () => {
      if (!hero || !hero.section.isConnected) return null;
      const r = hero.section.getBoundingClientRect();
      return r.bottom > 0 && r.top < h ? { top: r.top, bottom: r.bottom } : null;
    };

    const drawPoints2d = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgb(236,238,244)";
      for (let i = 0; i < pointCount; i++) {
        const j = i * 4;
        ctx.globalAlpha = Math.min(1, points[j + 2]);
        const s = points[j + 3];
        ctx.fillRect(points[j] - s / 2, points[j + 1] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    const draw2d = () => {
      if (!ctx2d) return;
      if (lift) {
        ctx2d.clearRect(0, 0, w, h);
        drawPoints2d(lift.ctx);
      } else drawPoints2d(ctx2d);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!enabled() || (gl && gl.lost())) {
        running = false;
        canvas.dataset.state = "asleep";
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - (lastFrame || now - 16.7)) / 1000));
      lastFrame = now;

      const box = gl && now >= followFrom && now - lastInput < LAYER_SLEEP_MS ? heroBox() : null;
      const bgOn = Boolean(box);
      // the foreground map belongs to the cursor cloud alone: one scroll read per frame and a
      // rebuild when one is due, only while the cloud is awake
      if (cloudAwake) {
        fg.setScroll(window.scrollY);
        fg.tick(now);
      }

      if (cloudAwake) {
        cloudAwake = stepCloud(dt, now);
        if (!cloudAwake) canvas.dataset.cloud = "asleep";
      }

      // the background alone runs at ~30fps; with the cloud active, every frame
      if (cloudAwake || now - lastBgDraw > 31) {
        lastBgDraw = now;
        if (gl) {
          // the field travels with the hero: its origin is the hero's top edge. It is pure
          // atmosphere and never reads the foreground (it runs on behind the portrait and type).
          gl.beginFrame((now - t0) / 1000, box ? 1 : 0, box ? -box.top : 0, box);
          if (lift) drawPoints2d(lift.ctx);
          else gl.drawPoints(points, pointCount);
        } else draw2d();
      }

      if (cloudAwake || bgOn) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        canvas.dataset.state = "asleep";
      }
    };

    const start = () => {
      if (running || !enabled()) return;
      running = true;
      lastFrame = 0;
      canvas.dataset.state = "awake";
      raf = requestAnimationFrame(frame);
    };
    const stop = (clear: boolean) => {
      cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      canvas.dataset.state = "asleep";
      if (clear) {
        holding = false;
        lowerAt = 0;
        closeLift();
        cloudAwake = false;
        present = false;
        presence = 0;
        seeded = false;
        pointCount = 0;
        tlife.fill(0);
        if (gl) gl.clear();
        else ctx2d?.clearRect(0, 0, w, h);
      }
    };

    // ------------------------------------------------------------- input
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastInput = performance.now();
      pendingX = e.clientX;
      pendingY = e.clientY;
      pointerIn = true;
      if (!enabled()) return;
      // held: the name has not given up its grains yet, so the field does not follow
      if (lastInput < followFrom) return;
      mx = e.clientX;
      my = e.clientY;
      if (!seeded) {
        // first appearance: gather in place around the pointer, no fly-in from a corner
        seeded = true;
        cx = lastCx = mx;
        cy = lastCy = my;
        for (let i = 0; i < N; i++) {
          px[i] = mx + sx[i] * CLOUD_RADIUS_X * scale * 1.5;
          py[i] = my + sy[i] * CLOUD_RADIUS_Y * scale * 1.5;
          vx[i] = 0;
          vy[i] = 0;
        }
      }
      present = true;
      lastMove = lastInput;
      cloudAwake = true;
      canvas.dataset.cloud = "awake";
      start();
    };
    const onLeave = () => {
      pointerIn = false;
      present = false;
      cloudAwake = true;
      start();
    };
    const onScroll = () => {
      lastInput = performance.now();
      fg.invalidate(); // content moved under the cloud
      if (present) cloudAwake = true;
      start();
    };
    const onKey = () => {
      lastInput = performance.now();
      start();
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        fg.invalidate();
        lastBgDraw = 0;
        start();
      }, 120);
    };
    // device-pixel-ratio changes (moving between displays, zoom) also resize the backing store
    let dprMq: MediaQueryList | null = null;
    const onDpr = () => {
      onResize();
      watchDpr();
    };
    const watchDpr = () => {
      dprMq?.removeEventListener("change", onDpr);
      dprMq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprMq.addEventListener("change", onDpr);
    };
    watchDpr();
    const onFonts = () => {
      fg.invalidate();
    };
    const onTheme = () => {
      const wasDark = dark;
      dark = document.documentElement.getAttribute("data-theme") === "dark";
      if (wasDark === dark) return;
      if (!dark) {
        // light theme: no field at all. An emergence in progress ends at once (the name's
        // mask is cleared) and the loop stops; nothing runs hidden.
        cancelEmergence();
        followFrom = Infinity;
        window.clearTimeout(followTimer);
        stop(true);
        setHeroPhase("inactive");
        return;
      }
      // back to dark: on the homepage with the name in view the grains emerge from it again
      // before the field follows; anywhere else the field simply resumes
      if (hero?.name?.isConnected) {
        const r = hero.name.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) {
          lastInput = performance.now();
          fg.invalidate();
          lastBgDraw = 0;
          followFrom = Infinity;
          present = false;
          setHeroPhase("name-reveal");
          scheduleEmergence(true);
          return;
        }
      }
      if (followFrom === Infinity) {
        setHeroPhase("particle-emergence");
        openFollow(performance.now());
      }
      if (!dark) stop(true);
      else {
        lastInput = performance.now();
        fg.invalidate();
        start();
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop(false);
      else {
        lastInput = performance.now();
        start();
      }
    };
    const onReduced = () => {
      if (reducedMq.matches) stop(true);
    };
    // standalone system screens (404 / errors) mark <html data-error-active>
    const attrObserver = new MutationObserver(() => {
      const next = document.documentElement.hasAttribute("data-error-active");
      if (next === standalone) return;
      standalone = next;
      if (standalone) stop(true);
      else start();
    });
    attrObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-error-active"] });
    gateChangedRef.current = () => {
      if (offRef.current) stop(true);
      else {
        lastInput = performance.now();
        fg.invalidate();
        start();
      }
    };

    // ------------------------------------------------------------- emergence from the hero name
    let emergeTimer = 0;
    let idleHandle = 0;
    let disposed = false;
    let emergenceRan = false;
    let cleanupMask: (() => void) | null = null;
    // the name's lines rise into place on load; sample only once they have settled
    const nameSettled = (name: HTMLElement) =>
      Array.from(name.querySelectorAll<HTMLElement>(":scope > span > span")).every((el) => {
        const t = getComputedStyle(el).transform;
        if (t === "none") return true;
        // close enough to rest: the rise's ease-out tail creeps over its last few percent, and
        // the grains (sampled from the letters where they are drawn now) need not wait for it
        const m = t.match(/^matrix\(1, 0, 0, 1, (-?[\d.e-]+), (-?[\d.e-]+)\)$/);
        const near = Math.max(1.5, el.offsetHeight * NAME_SETTLE_SHARE);
        return Boolean(m && Math.abs(Number(m[1])) < near && Math.abs(Number(m[2])) < near);
      });
    let emergeToken = 0;
    const cancelEmergence = () => {
      window.clearTimeout(emergeTimer);
      if (idleHandle) window.cancelIdleCallback?.(idleHandle);
      idleHandle = 0;
      emergeToken++;
      cleanupMask?.();
      cleanupMask = null;
    };
    const emerge = (name: HTMLElement, token: number) => {
      if (disposed || token !== emergeToken || !enabled()) return;
      if (!name.isConnected) return abandonSequence();
      const rect = name.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > h) return abandonSequence();
      const pts = sampleGlyphPoints(name, N);
      if (!pts) return abandonSequence();
      emergenceRan = true;
      const count = pts.length / 2;
      const now = performance.now();
      for (let i = 0; i < N; i++) {
        const k = i % count;
        const x = pts[k * 2];
        const y = pts[k * 2 + 1];
        const extra = i >= count ? 1 : 0; // more grains than samples: tiny offsets, same letters
        px[i] = rect.left + x + extra * (Math.random() - 0.5) * 2;
        py[i] = rect.top + y + extra * (Math.random() - 0.5) * 2;
        vx[i] = 0;
        vy[i] = 0;
        // a sweep across the name, left to right, with a little per-grain irregularity
        releaseAt[i] = now + EMERGE_LEAD_MS + (x / rect.width) * EMERGE_SWEEP_MS + Math.random() * EMERGE_JITTER_MS;
      }
      if (!present) {
        // no pointer yet: the cloud gathers in the open space beside the name
        cx = lastCx = mx = Math.min(rect.right + 40 * scale, w * 0.56);
        cy = lastCy = my = rect.top + rect.height * 0.52;
      }
      // A soft band of lowered ink travels across the real heading in step with the release, so
      // the letters visibly give up their grains (never below ~38% opacity: always readable).
      // A mask animation only: layout, text and accessibility are untouched.
      const band = "linear-gradient(90deg, #000 0%, #000 29%, rgb(0 0 0 / 0.38) 33.5%, rgb(0 0 0 / 0.38) 38.5%, #000 43%, #000 100%)";
      const nameStyle = name.style as CSSStyleDeclaration & { webkitMaskImage: string; webkitMaskSize: string };
      nameStyle.maskImage = nameStyle.webkitMaskImage = band;
      nameStyle.maskSize = nameStyle.webkitMaskSize = "300% 100%";
      nameStyle.maskRepeat = "no-repeat";
      const sweep = name.animate(
        [
          { maskPosition: "62% 0", WebkitMaskPosition: "62% 0" },
          { maskPosition: "-3% 0", WebkitMaskPosition: "-3% 0" },
        ],
        { duration: EMERGE_SWEEP_MS + EMERGE_JITTER_MS, delay: EMERGE_LEAD_MS, easing: "linear", fill: "both" },
      );
      const clearMask = () => {
        sweep.cancel();
        nameStyle.maskImage = nameStyle.webkitMaskImage = "";
        nameStyle.maskSize = nameStyle.webkitMaskSize = "";
        nameStyle.maskRepeat = "";
      };
      sweep.finished.then(clearMask, clearMask);
      cleanupMask = clearMask;
      canvas.dataset.emergedAt = String(Math.round(now));
      setHeroPhase("particle-emergence");
      // the pointer may lead the cloud once every grain has left the letters
      openFollow(now + EMERGE_LEAD_MS + EMERGE_SWEEP_MS + EMERGE_JITTER_MS);

      emergeCx = rect.left + rect.width * 0.5;
      emergeCy = rect.top + rect.height * 0.5;
      boostUntil = now + EMERGE_SWEEP_MS + EMERGE_JITTER_MS + EMERGE_BOOST_MS;
      presence = 1; // the grains are visible from the first frame, no fade-in lead
      seeded = true;
      present = true;
      holding = true;
      // while the type dissolves, the cloud draws above the hero copy on its own lift canvas
      // (never taking pointer events); it returns to the layer once every grain has left the
      // letters. The ambient field stays on the layer, behind the content, throughout.
      openLift();
      lastMove = now + EMERGE_SWEEP_MS; // lively through the sweep, then it may come to rest
      cloudAwake = true;
      canvas.dataset.cloud = "awake";
      canvas.dataset.emerged = "true";
      start();
    };
    /** `again`: a switch back to the dark theme replays the emergence on this document. */
    const scheduleEmergence = (again = false) => {
      const name = hero?.name;
      if (!name || !enabled()) return;
      if (!again && (emergenceClaimed || !isFreshLoad())) return;
      emergenceClaimed = true;
      cancelEmergence();
      const token = emergeToken;
      const began = performance.now();
      const tryStart = () => {
        if (disposed || token !== emergeToken) return;
        if (!nameSettled(name) && performance.now() - began < 7000) {
          emergeTimer = window.setTimeout(tryStart, 30);
          return;
        }
        // sampling the letterforms is the one heavier step: do it when the main thread is idle
        if (typeof window.requestIdleCallback === "function") idleHandle = window.requestIdleCallback(() => emerge(name, token), { timeout: 50 });
        else emergeTimer = window.setTimeout(() => emerge(name, token), 0);
      };
      (document.fonts?.ready ?? Promise.resolve())
        .then(() => {
          if (!disposed) tryStart();
        })
        .catch(tryStart);
    };
    // ------------------------------------------------------------- field signals
    /** Point on a rounded rectangle's perimeter at arc length `s` (clockwise from the top-left
     *  straight), with its outward normal and clockwise tangent. */
    const rim = { x: 0, y: 0, nx: 0, ny: 0 };
    const rimPoint = (l: number, t: number, W: number, H: number, r: number, s: number) => {
      const sw = Math.max(0, W - 2 * r);
      const sh = Math.max(0, H - 2 * r);
      const arc = (Math.PI / 2) * r;
      const segs = [sw, arc, sh, arc, sw, arc, sh, arc];
      let k = 0;
      while (k < 7 && s > segs[k]) s -= segs[k++];
      const f = segs[k] > 0 ? s / segs[k] : 0;
      const corner = (cxr: number, cyr: number, a0: number) => {
        const a = a0 + f * (Math.PI / 2);
        rim.nx = Math.cos(a);
        rim.ny = Math.sin(a);
        rim.x = cxr + rim.nx * r;
        rim.y = cyr + rim.ny * r;
      };
      if (k === 0) Object.assign(rim, { x: l + r + f * sw, y: t, nx: 0, ny: -1 });
      else if (k === 1) corner(l + W - r, t + r, -Math.PI / 2);
      else if (k === 2) Object.assign(rim, { x: l + W, y: t + r + f * sh, nx: 1, ny: 0 });
      else if (k === 3) corner(l + W - r, t + H - r, 0);
      else if (k === 4) Object.assign(rim, { x: l + W - r - f * sw, y: t + H, nx: 0, ny: 1 });
      else if (k === 5) corner(l + r, t + H - r, Math.PI / 2);
      else if (k === 6) Object.assign(rim, { x: l, y: t + H - r - f * sh, nx: -1, ny: 0 });
      else corner(l + r, t + r, Math.PI);
      return rim;
    };
    const onSignal = (sig: FieldSignal) => {
      if (!enabled() || !sig.el.isConnected) return;
      const rect = sig.el.getBoundingClientRect();
      if (rect.width < 4 || rect.bottom < 0 || rect.top > h) return;
      const now = performance.now();
      const sweep = sig.sweepMs ?? 1000;
      const k = Math.max(0, Math.min(1, sig.strength ?? 1));
      if (sig.mode === "outline") {
        // grains lift off the letter contours as the sweep passes, rising and drifting on
        const pts = sampleGlyphPoints(sig.el, Math.round(640 * k), true);
        if (!pts) return;
        for (let j = 0; j < pts.length; j += 2) {
          const x = pts[j];
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
          const sp = 16 + Math.random() * 64;
          spawnTrail(
            rect.left + x,
            rect.top + pts[j + 1],
            Math.cos(ang) * sp + 16,
            Math.sin(ang) * sp,
            0.7 + Math.random() * 0.95,
            1.4 + Math.random() * 1.0,
            now + (x / rect.width) * sweep + Math.random() * 90,
            1,
          );
        }
      } else {
        // a signal runs once around the control's edge, shedding grains outward as it goes
        const r = Math.min(rect.height / 2, rect.width / 2, parseFloat(getComputedStyle(sig.el).borderTopLeftRadius) || 0);
        const per = 2 * (rect.width - 2 * r) + 2 * (rect.height - 2 * r) + 2 * Math.PI * r;
        const count = Math.round(200 * k);
        for (let j = 0; j < count; j++) {
          const u = j / count;
          const p = rimPoint(rect.left, rect.top, rect.width, rect.height, r, u * per);
          const out = 14 + Math.random() * 46;
          const along = 30 + Math.random() * 70;
          spawnTrail(
            p.x + p.nx * 2,
            p.y + p.ny * 2,
            p.nx * out - p.ny * along,
            p.ny * out + p.nx * along,
            0.45 + Math.random() * 0.6,
            1.3 + Math.random() * 0.9,
            now + u * sweep + Math.random() * 40,
            1,
          );
        }
      }
      cloudAwake = true;
      canvas.dataset.cloud = "awake";
      canvas.dataset.signal = String(Math.round(now));
      start();
    };
    const unsubscribeSignal = subscribeFieldSignal(onSignal);

    const unsubscribeScene = subscribeHeroScene(() => {
      hero = getHeroScene();
      // the hero left (client navigation away) while the field was still held: release it
      if (!hero && followFrom === Infinity && dark) abandonSequence();
      lastBgDraw = 0;
      lastInput = performance.now();
      if (hero) scheduleEmergence();
      start();
    });
    scheduleEmergence();
    // whatever happens to the hero, a held field is released within a few seconds
    const safetyTimer = window.setTimeout(() => {
      if (dark && followFrom === Infinity && !emergenceRan) abandonSequence();
    }, 9000);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener(THEME_CHANGE_EVENT, onTheme);
    document.addEventListener("visibilitychange", onVisibility);
    document.fonts?.addEventListener?.("loadingdone", onFonts);
    reducedMq.addEventListener?.("change", onReduced);
    start();

    return () => {
      disposed = true;
      cleanupMask?.();
      window.clearTimeout(followTimer);
      window.clearTimeout(safetyTimer);
      closeLift();
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(emergeTimer);
      if (idleHandle) window.cancelIdleCallback?.(idleHandle);
      // a mount torn down before the emergence ran (e.g. StrictMode) leaves it to the next one
      if (!emergenceRan) emergenceClaimed = false;
      unsubscribeScene();
      unsubscribeSignal();
      gateChangedRef.current = null;
      attrObserver.disconnect();
      domObserver.disconnect();
      fg.dispose();
      try {
        delete (window as unknown as { __rawinField?: unknown }).__rawinField;
      } catch {}
      dprMq?.removeEventListener("change", onDpr);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      document.fonts?.removeEventListener?.("loadingdone", onFonts);
      reducedMq.removeEventListener?.("change", onReduced);
      gl?.dispose();
      gl = null;
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" data-field-ignore="" className="fixed inset-0 z-0 pointer-events-none" />;
}
