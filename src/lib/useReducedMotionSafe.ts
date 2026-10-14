"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

const noopSubscribe = () => () => {};

/**
 * Hydration-safe reduced-motion preference. The server can't know it, so this reports
 * `false` while hydrating (matching the server HTML) and the real preference right after.
 * Use it wherever the value changes rendered markup; framer's own hook returns the real
 * value on the first client render and causes hydration mismatches for reduced-motion users.
 * (Transform animations that start in that first frame are made instant by the
 * `MotionConfig reducedMotion="user"` around the public tree.)
 */
export function useReducedMotionSafe(): boolean {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduced = useReducedMotion();
  return hydrated && !!reduced;
}
