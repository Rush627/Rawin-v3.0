import type { OrbitState } from "@/components/OrbitMark";

/**
 * Pure logic behind the Orbit Signal Field (the ambient background of /ai): how the real request
 * lifecycle maps to a visual phase, and which rendering tier a device gets. No DOM access here.
 */

/** rest: idle / stopped · send: message just sent · active: generating or streaming ·
 *  settle: reply finished, easing back to rest · error: request failed (neutral, dimmed) */
export type FieldPhase = "rest" | "send" | "active" | "settle" | "error";

export function fieldPhase(state: OrbitState): FieldPhase {
  switch (state) {
    case "user_sent":
      return "send";
    case "generating":
    case "streaming":
      return "active";
    case "complete":
      return "settle";
    case "error":
      return "error";
    default:
      return "rest";
  }
}

/** full: complete composition · lite: fewer moving elements · still: static composition */
export type FieldTier = "full" | "lite" | "still";

export interface TierSignals {
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.hardwareConcurrency, when the browser reports it */
  cores?: number;
  /** navigator.deviceMemory in GB (Chromium only) */
  memory?: number;
  /** a phone-class device: coarse pointer or a narrow viewport */
  phone: boolean;
}

/**
 * Conservative tier choice from capability hints. The hints are imperfect (deviceMemory is
 * Chromium-only and coarsened; Safari caps hardwareConcurrency), so unknown phones get "lite"
 * and only clearly capable ones get "full". Reduced motion and data saving always mean "still".
 */
export function chooseTier(s: TierSignals): FieldTier {
  if (s.reducedMotion || s.saveData) return "still";
  if ((s.memory !== undefined && s.memory <= 2) || (s.cores !== undefined && s.cores <= 2)) return "still";
  if (s.phone) {
    const strongCpu = s.cores !== undefined && s.cores >= 8;
    const enoughMemory = s.memory === undefined ? false : s.memory >= 6;
    return strongCpu && enoughMemory ? "full" : "lite";
  }
  if ((s.cores !== undefined && s.cores <= 4) || (s.memory !== undefined && s.memory <= 4)) return "lite";
  return "full";
}
