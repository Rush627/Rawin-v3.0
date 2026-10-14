/**
 * Which page elements the particle layer works with. The homepage hero registers itself
 * (and its name heading) while it is mounted; the background streamline field exists only
 * while a hero is registered, and the name is the source of the first-load emergence.
 * Pages without a hero register nothing, so the field is absent there by ownership,
 * not by a CSS override.
 */
export interface HeroScene {
  section: HTMLElement;
  name: HTMLElement | null;
}

let scene: HeroScene | null = null;
const listeners = new Set<() => void>();

export function setHeroScene(next: HeroScene | null) {
  scene = next;
  listeners.forEach((fn) => fn());
}

export function getHeroScene() {
  return scene;
}

export function subscribeHeroScene(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Field signals: a component asks the shared particle layer for a short, local burst of
 * activity tied to one of its elements (the closing call to action uses this). The layer
 * decides whether it can honour it (dark theme, fine pointer, motion allowed); a signal
 * is a hint, never something the component waits on.
 *
 *   outline  grains shed from the element's letter contours in a left-to-right sweep
 *   rim      grains shed around the element's rounded edge, travelling around it
 */
export interface FieldSignal {
  el: Element;
  mode: "outline" | "rim";
  /** how long the sweep across / around the element takes (ms) */
  sweepMs?: number;
  /** 0–1 scale of the burst */
  strength?: number;
}

const signalListeners = new Set<(signal: FieldSignal) => void>();

export function emitFieldSignal(signal: FieldSignal) {
  signalListeners.forEach((fn) => fn(signal));
}

export function subscribeFieldSignal(fn: (signal: FieldSignal) => void) {
  signalListeners.add(fn);
  return () => {
    signalListeners.delete(fn);
  };
}
