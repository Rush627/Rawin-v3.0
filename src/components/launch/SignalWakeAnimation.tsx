"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerHaptic } from "@/lib/haptics";

export interface SignalWakeAnimationProps {
  primaryMessage?: string;
  secondaryMessage?: string;
  duration?: number; // Total timeline duration in seconds (CMS-controlled)
  onComplete?: () => void;
  isReducedMotion?: boolean;
}

/**
 * "Signal Wake" launch sequence — Spectral Editorial edition.
 *
 * 1. A single point of spectral light ignites at centre.
 * 2. The light blooms into a slow, breathing aurora field.
 * 3. The primary message rises through a typographic mask; the secondary follows.
 * 4. A hairline traces the remaining time across the base of the frame.
 * 5. An aperture closes over the scene to reveal the live website.
 *
 * Skippable at any time with click, tap, Enter, Space or Escape. Honours the CMS
 * duration and reduced-motion preference. CSS-only rendering: zero GPU loops.
 */
export default function SignalWakeAnimation({
  primaryMessage = "RAWIN v3.0",
  secondaryMessage = "A new iteration is live.",
  duration = 12.0,
  onComplete,
  isReducedMotion = false,
}: SignalWakeAnimationProps) {
  const [phase, setPhase] = useState<"ignite" | "reveal" | "exit">("ignite");
  const [isTouch, setIsTouch] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const exitingRef = useRef(false);

  const total = Math.max(3, duration) * 1000;
  const exitMs = isReducedMotion ? 300 : 1000;

  const beginExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setPhase("exit");
    window.setTimeout(() => onCompleteRef.current?.(), exitMs);
  }, [exitMs]);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const tReveal = window.setTimeout(() => setPhase((p) => (p === "ignite" ? "reveal" : p)), isReducedMotion ? 0 : 900);
    const tExit = window.setTimeout(beginExit, isReducedMotion ? Math.max(1500, total * 0.25) : total - exitMs);
    return () => {
      window.clearTimeout(tReveal);
      window.clearTimeout(tExit);
    };
  }, [total, exitMs, isReducedMotion, beginExit]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerHaptic(10);
        beginExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [beginExit]);

  const revealed = phase !== "ignite";
  const exiting = phase === "exit";

  return (
    <div
      onClick={() => {
        triggerHaptic(10);
        beginExit();
      }}
      role="status"
      aria-live="polite"
      aria-label={`${primaryMessage}. ${secondaryMessage}`}
      className="fixed inset-0 z-[9999] bg-bg text-fg select-none cursor-pointer overflow-hidden"
      style={{
        height: "100dvh",
        clipPath: isReducedMotion ? undefined : exiting ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)",
        opacity: isReducedMotion && exiting ? 0 : 1,
        transition: isReducedMotion
          ? `opacity ${exitMs}ms ease`
          : `clip-path ${exitMs}ms cubic-bezier(0.65, 0, 0.35, 1)`,
      }}
    >
      <style>{`
        @keyframes rawin-wake-breathe { 0%,100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); } 50% { transform: translate(-50%,-50%) scale(1.12) rotate(12deg); } }
        @keyframes rawin-wake-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>

      {/* Aurora field */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 rounded-full blur-[80px] transition-[width,height,opacity] ease-[cubic-bezier(0.2,0.7,0.1,1)]"
        style={{
          width: revealed ? "min(120vw, 1100px)" : "8px",
          height: revealed ? "min(120vw, 1100px)" : "8px",
          opacity: revealed ? 0.55 : 1,
          background:
            "conic-gradient(from 120deg, var(--accent), #c9bcff, var(--mint), var(--ember), var(--accent))",
          transitionDuration: isReducedMotion ? "0ms" : "2200ms",
          transform: "translate(-50%,-50%)",
          animation: isReducedMotion ? undefined : "rawin-wake-breathe 9s ease-in-out infinite",
        }}
      />
      <div aria-hidden="true" className="rawin-atmosphere !absolute" />

      {/* Ignition point */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-fg transition-opacity duration-700"
        style={{ opacity: revealed ? 0 : 1, boxShadow: "0 0 40px 12px var(--accent)" }}
      />

      {/* Content */}
      <div
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <p
          className="label-mono text-fg-muted transition-all duration-1000"
          style={{ opacity: revealed ? 1 : 0, transform: revealed ? "none" : "translateY(8px)" }}
        >
          Signal received
        </p>
        <h1 className="mt-6 overflow-hidden pb-[0.1em]">
          <span
            className="block display-lg text-fg transition-transform duration-[1300ms] ease-[cubic-bezier(0.2,0.7,0.1,1)]"
            style={{ transform: revealed ? "translateY(0)" : "translateY(110%)" }}
          >
            {primaryMessage}
          </span>
        </h1>
        <p
          className="mt-6 max-w-md text-base sm:text-lg text-fg-muted transition-all duration-1000 delay-300"
          style={{ opacity: revealed ? 1 : 0, transform: revealed ? "none" : "translateY(10px)" }}
        >
          {secondaryMessage}
        </p>
      </div>

      {/* Base: progress + instruction */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 px-6 sm:px-10 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]"
        style={{ opacity: revealed ? 1 : 0, transition: "opacity 1s ease" }}
      >
        <div className="flex items-center justify-between label-mono text-fg-subtle mb-3">
          <span>RAWIN / v3</span>
          <span>{isTouch ? "Tap to enter" : "Click or press Enter"}</span>
        </div>
        <div className="h-px w-full bg-line overflow-hidden">
          <div
            className="h-full w-full origin-left"
            style={{
              background: "var(--spectrum)",
              animation: isReducedMotion ? undefined : `rawin-wake-progress ${total}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
