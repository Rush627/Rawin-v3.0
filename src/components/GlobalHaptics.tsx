"use client";

import { useEffect } from "react";
import { triggerHaptic } from "@/lib/haptics";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  '[role="button"]',
  '[role="switch"]',
  '[role="tab"]',
  'input[type="submit"]',
  'input[type="button"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  "select",
  "[data-haptic]",
].join(", ");

export default function GlobalHaptics() {
  useEffect(() => {
    if (typeof window === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    let handledTouch = false;

    const handleInteraction = (e: Event, isTouch: boolean) => {
      const target = (e.target as HTMLElement | null)?.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!target) return;

      // Skip disabled or inert controls
      if (
        target.hasAttribute("disabled") ||
        target.getAttribute("aria-disabled") === "true" ||
        target.classList.contains("disabled")
      ) {
        return;
      }

      // Check for primary or heavy action
      const isHeavy =
        target.getAttribute("data-haptic") === "heavy" ||
        target.classList.contains("bg-pacific-cyan") ||
        target.classList.contains("bg-red-500") ||
        target.getAttribute("type") === "submit";

      triggerHaptic(isHeavy ? 14 : 8);

      if (isTouch) {
        handledTouch = true;
        setTimeout(() => {
          handledTouch = false;
        }, 150);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        handleInteraction(e, true);
      }
    };

    const onClick = (e: MouseEvent) => {
      // If already handled by pointerdown on touch device, do not double-vibrate
      if (handledTouch) return;
      handleInteraction(e, false);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
    window.addEventListener("click", onClick, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
