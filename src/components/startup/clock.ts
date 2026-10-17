/**
 * Small shared helpers for the startup compositions (Supernova, Signal Awakening): a frame
 * clock that pauses through main-thread stalls rather than skipping ahead, easing, and a canvas
 * sized from its own box (so the same component
 * fills the whole screen on the site and a device frame in the Studio preview).
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
export const easeInCubic = (t: number) => t * t * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** The most one frame may advance a startup's clock (ms). */
export const MAX_STEP_MS = 64;

/**
 * Runs frame(elapsedMs) every animation frame until totalMs, then end(). Returns a cancel.
 * Elapsed time advances by the real gap between frames, but by at most MAX_STEP_MS per frame:
 * the page hydrating behind the overlay can block the main thread for most of a second on first
 * load, and a stall then pauses the animation instead of skipping a short startup in one jump.
 * (The boot script's fail-safe still bounds the total.)
 */
export function runClock(totalMs: number, frame: (t: number) => void, end: () => void): () => void {
  let elapsed = 0;
  let last = -1;
  let raf = 0;
  let stopped = false;
  const tick = (now: number) => {
    if (stopped) return;
    if (last >= 0) elapsed += Math.min(MAX_STEP_MS, Math.max(0, now - last));
    last = now;
    const t = elapsed;
    try {
      frame(Math.min(t, totalMs));
    } catch {
      // a drawing failure must never hold the overlay: finish at once
      stopped = true;
      end();
      return;
    }
    if (t >= totalMs) {
      stopped = true;
      end();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

export interface CanvasBox {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** re-measure after a resize */
  measure: () => void;
}

/** A 2D canvas sized to its element's box at a capped pixel ratio, or null without 2D support. */
export function canvasBox(canvas: HTMLCanvasElement | null, maxDpr: number): CanvasBox | null {
  const ctx = canvas?.getContext("2d") ?? null;
  if (!canvas || !ctx) return null;
  const box: CanvasBox = {
    ctx,
    w: 1,
    h: 1,
    measure: () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      box.w = Math.max(1, r.width);
      box.h = Math.max(1, r.height);
      canvas.width = Math.round(box.w * dpr);
      canvas.height = Math.round(box.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  };
  box.measure();
  return box;
}

/** A seeded random source, so a composition looks the same on every play (and in previews). */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type StartupLayout = "desktop" | "mobile";
export type StartupEnd = "finish" | "skip";
