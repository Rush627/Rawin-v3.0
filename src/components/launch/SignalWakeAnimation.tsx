"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import LaunchCanvas from "./LaunchCanvas";
import CrtTransitionOverlay from "./CrtTransitionOverlay";
import { triggerHaptic } from "@/lib/haptics";

export interface SignalWakeAnimationProps {
  primaryMessage?: string;
  secondaryMessage?: string;
  duration?: number; // Total timeline duration in seconds, e.g. 10.0 to 15.0
  onComplete?: () => void;
  isReducedMotion?: boolean;
}

/**
 * Launch Experience 2.0 Renderer: Rebuilt around the RAWIN Home Canvas Field-Particle Engine.
 *
 * Visual Sequence:
 * 1. Dark launch environment appears with ambient dust field.
 * 2. "RAWIN v3.0" materializes directly from dense glyph-origin particles.
 * 3. Title shimmers in Pacific Cyan and bright white sparks on letter contours.
 * 4. Particles disperse organically outward using authentic field physics.
 * 5. Full-screen particle field fills the viewport.
 * 6. CRT convergence closes toward center from top and bottom.
 * 7. Concentrated white ignition flash appears at center.
 * 8. White illumination expands vertically from center to top and bottom.
 * 9. Live RAWIN website is revealed.
 *
 * Strictly adheres to the zero em dash constraint across all code and comments.
 */
export default function SignalWakeAnimation({
  primaryMessage = "RAWIN v3.0",
  secondaryMessage = "A new iteration is live.",
  duration = 12.0,
  onComplete,
  isReducedMotion = false,
}: SignalWakeAnimationProps) {
  // Visual states:
  // contentRevealed: controls initial semantic elements (badge, cyan line, secondary message)
  // crtActive: triggers the CRT convergence, flash, and vertical expansion
  const [contentRevealed, setContentRevealed] = useState<boolean>(false);
  const [crtActive, setCrtActive] = useState<boolean>(false);
  const [isTouch, setIsTouch] = useState<boolean>(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const isInterruptedRef = useRef(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (isReducedMotion) {
      setContentRevealed(true);
      const timerExit = setTimeout(() => {
        setCrtActive(true);
      }, Math.max(1200, duration * 250));
      return () => clearTimeout(timerExit);
    }

    // Reveal semantic elements (badge, cyan line, secondary message) as title materializes (~1.0s at 12s)
    const revealDelay = Math.max(800, duration * 80);
    const tReveal = setTimeout(() => {
      setContentRevealed(true);
    }, revealDelay);

    return () => {
      clearTimeout(tReveal);
    };
  }, [duration, isReducedMotion]);

  // Milestone: Canvas has reached the CRT phase naturally
  const handleTriggerCrt = useCallback(() => {
    if (!isInterruptedRef.current) {
      setCrtActive(true);
    }
  }, []);

  // Manual skip handler (click, tap, or keypress)
  const handleManualContinue = useCallback(() => {
    if (crtActive) return;
    isInterruptedRef.current = true;
    triggerHaptic(10);
    setCrtActive(true);
  }, [crtActive]);

  // Keyboard accessibility: Escape, Enter, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleManualContinue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualContinue]);

  const handleFinalComplete = useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  return (
    <div
      onClick={handleManualContinue}
      role="status"
      aria-live="polite"
      aria-label={`${primaryMessage}. ${secondaryMessage}`}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#101019] select-none cursor-pointer overflow-hidden transition-opacity duration-500 ease-out ${
        crtActive ? "pointer-events-none" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      {/* Full-Screen WebGL Canvas Particle Engine */}
      <LaunchCanvas
        primaryMessage={primaryMessage}
        duration={duration}
        onTriggerCrt={handleTriggerCrt}
        isReducedMotion={isReducedMotion}
      />

      {/* Subtle background scanline veil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"
        aria-hidden="true"
      />

      {/* Semantic Content & Layout Layer */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto pointer-events-none select-none transition-opacity duration-700 ease-out ${
          crtActive ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Status indicator pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono tracking-widest uppercase mb-3 sm:mb-4 border transition-all duration-700 ease-out ${
            contentRevealed && !crtActive
              ? "opacity-100 translate-y-0 text-pacific-cyan bg-pacific-cyan/10 border-pacific-cyan/25"
              : "opacity-0 -translate-y-2 text-muted border-transparent"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Anchor spacer reserved for Canvas particle title with semantic accessible h1 */}
        <div
          id="launch-title-anchor"
          className="h-14 sm:h-20 md:h-24 flex items-center justify-center w-full"
          aria-hidden="true"
        >
          <h1 className="sr-only">{primaryMessage}</h1>
        </div>

        {/* Cyan Horizontal Accent Line strictly BELOW the Title with deliberate gap */}
        <div className="w-full flex items-center justify-center my-3 sm:my-5">
          <div
            className={`h-[1.5px] bg-pacific-cyan rounded-full transition-all ease-out ${
              contentRevealed && !crtActive
                ? "w-32 sm:w-48 md:w-60 opacity-80 shadow-[0_0_15px_#189BAD]"
                : "w-0 opacity-0"
            }`}
            style={{
              transitionDuration: isReducedMotion ? "300ms" : "700ms",
            }}
          />
        </div>

        {/* Secondary Message */}
        <p
          className={`text-xs sm:text-sm md:text-base font-mono text-muted/90 max-w-md mx-auto mb-6 sm:mb-8 transition-all duration-700 ease-out ${
            contentRevealed && !crtActive
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          {secondaryMessage}
        </p>

        {/* Subdued continue instruction */}
        <div
          className={`text-[10px] font-mono text-muted/40 tracking-wider transition-opacity duration-500 ${
            contentRevealed && !crtActive ? "opacity-100" : "opacity-0"
          }`}
        >
          {isTouch ? "[ TAP TO CONTINUE ]" : "[ CLICK OR TAP TO CONTINUE ]"}
        </div>
      </div>

      {/* CRT Transition Overlay */}
      <CrtTransitionOverlay
        active={crtActive}
        onComplete={handleFinalComplete}
        isReducedMotion={isReducedMotion}
      />
    </div>
  );
}
