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

/**
 * The homepage field sequence, as one explicit state machine (driven by CursorField):
 *
 *   none                no sequence on this page: the field behaves as everywhere else
 *   inactive            light theme (or no field on this device): no particles, no following
 *   name-reveal         the hero name rises in; the field is held (nothing drawn, no following)
 *   particle-emergence  the grains leave the letters; the pointer is still not followed
 *   cursor-following    every grain has left: the field follows the pointer
 *
 * Within one run the phases move forward one step at a time (name-reveal → particle-emergence →
 * cursor-following); a run starts again only through name-reveal (a fresh load, or a switch
 * back to the dark theme) or stops through inactive. The phase is mirrored on
 * <html data-hero-phase> for inspection and tests.
 */
export type HeroPhase = "none" | "inactive" | "name-reveal" | "particle-emergence" | "cursor-following";

const RUN: HeroPhase[] = ["name-reveal", "particle-emergence", "cursor-following"];

let phase: HeroPhase = "none";
const phaseListeners = new Set<(p: HeroPhase) => void>();

/** Whether `next` may follow `from`: a run (re)starts at name-reveal, inactive stops it, and
 *  inside a run the phases only move forward. */
export function canAdvance(from: HeroPhase, next: HeroPhase) {
  if (next === "none") return false;
  if (next === "inactive" || next === "name-reveal") return next !== from;
  const a = RUN.indexOf(from);
  const b = RUN.indexOf(next);
  // one step at a time: following is only ever reached through the emergence
  return a >= 0 && b === a + 1;
}

export function getHeroPhase() {
  return phase;
}

export function setHeroPhase(next: HeroPhase) {
  if (!canAdvance(phase, next)) return false;
  phase = next;
  if (typeof document !== "undefined") document.documentElement.dataset.heroPhase = next;
  phaseListeners.forEach((fn) => fn(next));
  return true;
}

export function subscribeHeroPhase(fn: (p: HeroPhase) => void) {
  phaseListeners.add(fn);
  return () => {
    phaseListeners.delete(fn);
  };
}
