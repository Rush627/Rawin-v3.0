// Centralized Lightweight Haptic Feedback Utility for RAWIN 3.0
// Feature-detects navigator.vibrate for supported mobile browsers (e.g. Android Chrome).
// Safe no-op on iOS and unsupported environments.

let lastHapticTimestamp = 0;
const HAPTIC_DEBOUNCE_MS = 60;

/**
 * Triggers a subtle haptic vibration if supported.
 * Strictly debounced to prevent duplicate activations across pointer/touch/click events.
 *
 * @param durationMs Duration of vibration in milliseconds (default: 8ms)
 */
export function triggerHaptic(durationMs: number = 8): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  // Feature detection
  if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") {
    return false;
  }

  const now = Date.now();
  if (now - lastHapticTimestamp < HAPTIC_DEBOUNCE_MS) {
    return false;
  }

  lastHapticTimestamp = now;

  try {
    return navigator.vibrate(Math.min(Math.max(4, durationMs), 35));
  } catch {
    return false;
  }
}
