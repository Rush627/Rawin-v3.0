/**
 * RAWIN motion conventions.
 * One editorial curve for entrances, a quint-out for UI response, and three
 * durations. Springs are reserved for layout/shared-element motion only.
 */
export const EASE_EDITORIAL = [0.2, 0.7, 0.1, 1] as const;
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  quick: 0.2,
  base: 0.45,
  slow: 0.8,
  cinematic: 1.2,
} as const;

export const LAYOUT_SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;

export const STAGGER = 0.06;
