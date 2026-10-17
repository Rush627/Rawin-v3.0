/**
 * What Orbit is doing right now, as reported by the conversation itself (AIAssistantView), so
 * the companion can reflect the real state rather than guess: thinking while a reply is being
 * generated, listening while the microphone is open, speaking while a reply is read aloud.
 * One small store, no framework; "idle" whenever nothing reports otherwise (the conversation
 * resets it when it unmounts).
 */
export type OrbitActivity = "idle" | "thinking" | "listening" | "speaking";

let activity: OrbitActivity = "idle";
const listeners = new Set<() => void>();

export function setOrbitActivity(next: OrbitActivity) {
  if (next === activity) return;
  activity = next;
  listeners.forEach((fn) => fn());
}

export function getOrbitActivity(): OrbitActivity {
  return activity;
}

export function subscribeOrbitActivity(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** The visible activity from the conversation's own states (speech and microphone win). */
export function orbitActivityFrom(s: { listening: boolean; speaking: boolean; generating: boolean }): OrbitActivity {
  if (s.listening) return "listening";
  if (s.speaking) return "speaking";
  if (s.generating) return "thinking";
  return "idle";
}
