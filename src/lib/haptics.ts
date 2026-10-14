// Centralized Capability-Aware Haptic Feedback Utility for RAWIN 3.0
// Supports:
// 1. Legitimate native iOS WKWebView bridge (window.webkit.messageHandlers.haptic) if present.
// 2. Web Vibration API on genuinely supported platforms (e.g. Android Chrome).
// 3. Graceful, silent fallback on iPhone Safari and unsupported platforms without fake hardware claims.

let lastHapticTimestamp = 0;
const HAPTIC_DEBOUNCE_MS = 60;

export type HapticType = "selection" | "impact" | "success";

interface WebKitBridge {
  postMessage: (message: unknown) => void;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        haptic?: WebKitBridge;
        haptics?: WebKitBridge;
      };
    };
    AndroidBridge?: {
      haptic?: (type: string) => void;
    };
  }
}

/**
 * Checks whether haptic feedback is genuinely available on this runtime.
 * Distinguishes native wrapper bridges from standard Web Vibration API.
 */
export function getHapticCapabilities(): {
  hasNativeBridge: boolean;
  hasWebVibration: boolean;
} {
  if (typeof window === "undefined") {
    return { hasNativeBridge: false, hasWebVibration: false };
  }

  const hasNativeBridge = Boolean(
    window.webkit?.messageHandlers?.haptic?.postMessage ||
      window.webkit?.messageHandlers?.haptics?.postMessage ||
      typeof window.AndroidBridge?.haptic === "function"
  );

  const hasWebVibration =
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function";

  return { hasNativeBridge, hasWebVibration };
}

/**
 * Dispatches a semantic haptic event if supported by the active environment.
 * Strictly debounced to prevent duplicate activations across touch/pointer/click events.
 */
function triggerSemanticHaptic(type: HapticType = "selection"): boolean {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  if (now - lastHapticTimestamp < HAPTIC_DEBOUNCE_MS) {
    return false;
  }
  lastHapticTimestamp = now;

  // 1. Legitimate Native Bridge (iOS WKWebView / Android wrapper)
  try {
    const webkitHaptic =
      window.webkit?.messageHandlers?.haptic ||
      window.webkit?.messageHandlers?.haptics;

    if (webkitHaptic && typeof webkitHaptic.postMessage === "function") {
      webkitHaptic.postMessage({ type });
      return true;
    }

    if (typeof window.AndroidBridge?.haptic === "function") {
      window.AndroidBridge.haptic(type);
      return true;
    }
  } catch {
    // Fail silently if native bridge rejects message
  }

  // 2. Standard Web Vibration API (Android Chrome / supported devices)
  // Note: iOS Safari does NOT support navigator.vibrate; this correctly returns false.
  if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      if (type === "selection") {
        return navigator.vibrate(8);
      }
      if (type === "impact") {
        return navigator.vibrate(14);
      }
      if (type === "success") {
        return navigator.vibrate([10, 30, 15]);
      }
      return navigator.vibrate(10);
    } catch {
      return false;
    }
  }

  // 3. iPhone Safari / Desktop without native bridge:
  // Graceful no-op. Relies on polished CSS transient :active styling without fake hardware claims.
  return false;
}

/**
 * Semantic haptic controller.
 */
export const haptic = {
  /** Subtle confirmation for deliberate selection (e.g. Analytics country selection). */
  selection: () => triggerSemanticHaptic("selection"),
  /** Slightly stronger confirmation for important actions (e.g. CTA activation, menu toggle). */
  impact: () => triggerSemanticHaptic("impact"),
  /** Distinct success confirmation (e.g. form submission completion). */
  success: () => triggerSemanticHaptic("success"),
};

/**
 * Flexible trigger supporting semantic names or millisecond durations.
 */
export function triggerHaptic(arg: number | HapticType = "selection"): boolean {
  if (arg === "impact" || (typeof arg === "number" && arg > 12)) {
    return haptic.impact();
  }
  if (arg === "success") {
    return haptic.success();
  }
  return haptic.selection();
}
