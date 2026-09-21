"use client";

import { useEffect, useState, useRef } from "react";

export interface SignalWakeAnimationProps {
  primaryMessage?: string;
  secondaryMessage?: string;
  duration?: number; // in seconds, e.g. 2.0
  onComplete?: () => void;
  isReducedMotion?: boolean;
}

export default function SignalWakeAnimation({
  primaryMessage = "RAWIN v3.0",
  secondaryMessage = "A new iteration is live.",
  duration = 2.0,
  onComplete,
  isReducedMotion = false,
}: SignalWakeAnimationProps) {
  // Animation phases:
  // 0: init (dark background)
  // 1: signal waking (horizontal beam forming)
  // 2: beam stabilized, primary text appearing
  // 3: secondary text appearing, full lock
  // 4: fade out / dissolve
  const [phase, setPhase] = useState<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // If reduced motion is preferred, use a simple and quick fade
    if (isReducedMotion) {
      setPhase(3);
      const exitTimer = setTimeout(() => {
        setPhase(4);
      }, Math.max(800, duration * 600));

      const doneTimer = setTimeout(() => {
        onCompleteRef.current?.();
      }, Math.max(1200, duration * 900));

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(doneTimer);
      };
    }

    // Dynamic phase timings calculated from configurable duration
    const totalMs = Math.max(1200, duration * 1000);
    const p1Time = totalMs * 0.12;
    const p2Time = totalMs * 0.32;
    const p3Time = totalMs * 0.52;
    const p4Time = totalMs * 0.78;
    const finishTime = totalMs;

    const t1 = setTimeout(() => setPhase(1), p1Time);
    const t2 = setTimeout(() => setPhase(2), p2Time);
    const t3 = setTimeout(() => setPhase(3), p3Time);
    const t4 = setTimeout(() => setPhase(4), p4Time);
    const tFinish = setTimeout(() => {
      onCompleteRef.current?.();
    }, finishTime);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tFinish);
    };
  }, [duration, isReducedMotion]);

  // Allow immediate skip via Escape key or click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        setPhase(4);
        setTimeout(() => onCompleteRef.current?.(), 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClick = () => {
    setPhase(4);
    setTimeout(() => onCompleteRef.current?.(), 300);
  };

  return (
    <div
      onClick={handleClick}
      role="status"
      aria-live="polite"
      aria-label={`${primaryMessage}. ${secondaryMessage}`}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#101019] select-none cursor-pointer overflow-hidden transition-opacity duration-500 ease-out ${
        phase === 4 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      {/* Subtle background scanline veil (pure CSS, lightweight) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"
        aria-hidden="true"
      />

      {/* Horizontal Signal Light Centerpiece */}
      <div
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        {/* Core signal line */}
        <div
          className={`h-[1.5px] bg-pacific-cyan transition-all ease-out ${
            phase === 0
              ? "w-0 opacity-0"
              : phase === 1
              ? "w-48 sm:w-80 opacity-90 shadow-[0_0_15px_#189BAD]"
              : phase >= 2 && phase < 4
              ? "w-full max-w-xl sm:max-w-2xl opacity-40 shadow-[0_0_25px_#189BAD]"
              : "w-0 opacity-0"
          }`}
          style={{
            transitionDuration: isReducedMotion ? "300ms" : "600ms",
          }}
        />

        {/* Ambient vertical signal bloom */}
        <div
          className={`absolute w-40 sm:w-72 h-10 sm:h-16 rounded-full bg-pacific-cyan/15 blur-2xl transition-all ease-out ${
            phase >= 1 && phase < 4 ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
          style={{
            transitionDuration: isReducedMotion ? "300ms" : "700ms",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-lg sm:max-w-xl mx-auto">
        {/* Signal indicator pill */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono tracking-widest uppercase mb-4 sm:mb-6 border transition-all duration-500 ease-out ${
            phase >= 1 && phase < 4
              ? "opacity-100 translate-y-0 text-pacific-cyan bg-pacific-cyan/10 border-pacific-cyan/25"
              : "opacity-0 -translate-y-2 text-muted border-transparent"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Primary Message */}
        <h1
          className={`text-3xl sm:text-5xl md:text-6xl font-bold font-space tracking-tight text-foreground mb-2 sm:mb-3 transition-all duration-700 ease-out ${
            phase >= 2 && phase < 4
              ? "opacity-100 translate-y-0 filter blur-0"
              : "opacity-0 translate-y-3 filter blur-[4px]"
          }`}
        >
          {primaryMessage}
        </h1>

        {/* Secondary Message */}
        <p
          className={`text-xs sm:text-sm md:text-base font-mono text-muted/90 max-w-md mx-auto transition-all duration-700 ease-out ${
            phase >= 3 && phase < 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          {secondaryMessage}
        </p>

        {/* Subdued skip hint */}
        <div
          className={`mt-8 sm:mt-10 text-[10px] font-mono text-muted/40 tracking-wider transition-opacity duration-500 ${
            phase >= 2 && phase < 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          [ CLICK OR TAP TO CONTINUE ]
        </div>
      </div>
    </div>
  );
}
