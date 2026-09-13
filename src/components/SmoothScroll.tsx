"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Disable Lenis on touch-only mobile devices where native momentum scrolling is superior
    // and where Lenis touch listeners intercept physical touch clicks
    const isTouchOnly = window.matchMedia("(pointer: coarse) and (hover: none)").matches;
    if (isTouchOnly) {
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
