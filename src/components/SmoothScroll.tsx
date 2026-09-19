"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    // Disable Lenis on iOS WebKit, Android, and touch-first devices where native momentum
    // scrolling and native scroll restoration are superior
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
      (typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0);
    if (isTouch) {
      return;
    }

    // Respect user's motion preference on desktop
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    // Expose lenis on window for global controls (e.g. Back to Top)
    (window as unknown as { __lenis?: Lenis | null }).__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      (window as unknown as { __lenis?: Lenis | null }).__lenis = null;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
