"use client";

import { useEffect, useState, useRef } from "react";

export interface CrtTransitionOverlayProps {
  active: boolean;
  onComplete: () => void;
  isReducedMotion?: boolean;
}

/**
 * High-performance CRT transition overlay for RAWIN 3.0 Launch Experience.
 * Features:
 * 1. Top and bottom convergence towards the center horizon line.
 * 2. Concentrated center white ignition flash at the convergence point.
 * 3. Vertical white flash expansion from center to top and bottom.
 * 4. Momentary full-frame white burst dissolving into the live website.
 *
 * Adheres strictly to the zero em dash constraint.
 */
export default function CrtTransitionOverlay({
  active,
  onComplete,
  isReducedMotion = false,
}: CrtTransitionOverlayProps) {
  // Phase:
  // 0: idle (hidden)
  // 1: converging (shutters closing to center, beam forming)
  // 2: center-flash (concentrated ignition spark at center point)
  // 3: expanding (white beam expanding vertically to full screen)
  // 4: reveal (white frame fading out smoothly to reveal live website)
  const [phase, setPhase] = useState<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (isReducedMotion) {
      setPhase(4);
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 400);
      return () => clearTimeout(timer);
    }

    // Sequence timing
    setPhase(1); // Start convergence immediately

    const tFlash = setTimeout(() => {
      setPhase(2); // Center flash ignition
    }, 420);

    const tExpand = setTimeout(() => {
      setPhase(3); // Vertical expansion
    }, 580);

    const tReveal = setTimeout(() => {
      setPhase(4); // Fade out white frame
    }, 850);

    const tDone = setTimeout(() => {
      onCompleteRef.current();
    }, 1150);

    return () => {
      clearTimeout(tFlash);
      clearTimeout(tExpand);
      clearTimeout(tReveal);
      clearTimeout(tDone);
    };
  }, [active, isReducedMotion]);

  if (!active && phase === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden select-none"
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      {/* Top Shutter: slides down to center */}
      <div
        className="absolute top-0 left-0 right-0 bg-[#0c0c14] transition-transform ease-in-out"
        style={{
          height: "50%",
          transformOrigin: "top",
          transform:
            phase >= 1 && phase < 3
              ? "scaleY(1)"
              : phase >= 3
              ? "scaleY(0)"
              : "scaleY(0)",
          transitionDuration: phase === 1 ? "420ms" : "150ms",
        }}
      />

      {/* Bottom Shutter: slides up to center */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#0c0c14] transition-transform ease-in-out"
        style={{
          height: "50%",
          transformOrigin: "bottom",
          transform:
            phase >= 1 && phase < 3
              ? "scaleY(1)"
              : phase >= 3
              ? "scaleY(0)"
              : "scaleY(0)",
          transitionDuration: phase === 1 ? "420ms" : "150ms",
        }}
      />

      {/* CRT Horizontal Scanline Veil */}
      <div
        className={`absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px] transition-opacity duration-300 ${
          phase >= 1 && phase < 3 ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* Center Razor Beam at Convergence Horizon */}
      <div
        className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ease-out ${
          phase >= 1 && phase < 3 ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
        }`}
      >
        <div className="w-full h-[2px] bg-white shadow-[0_0_20px_#ffffff,0_0_40px_#189BAD]" />
      </div>

      {/* Concentrated White Center Flash (Screen Ignition Point) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ease-out ${
          phase === 2
            ? "w-40 h-40 opacity-100 scale-100"
            : phase >= 3
            ? "w-80 h-80 opacity-0 scale-150"
            : "w-0 h-0 opacity-0 scale-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.95) 25%, rgba(24,155,173,0.7) 50%, rgba(24,155,173,0) 75%)",
          boxShadow: "0 0 80px 30px #ffffff, 0 0 120px 60px #189BAD",
          transitionDuration: phase === 2 ? "140ms" : "200ms",
        }}
      />

      {/* Vertical Flash Expansion from Center toward Top and Bottom */}
      <div
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-white transition-all ease-out"
        style={{
          height:
            phase === 3 ? "100%" : phase === 4 ? "100%" : phase === 2 ? "4px" : "0px",
          opacity: phase === 3 ? 1.0 : phase === 4 ? 0.0 : 0.0,
          boxShadow:
            phase === 3
              ? "0 0 120px 40px #ffffff, inset 0 0 80px rgba(24,155,173,0.5)"
              : "none",
          transitionDuration: phase === 3 ? "240ms" : phase === 4 ? "300ms" : "150ms",
        }}
      />
    </div>
  );
}
