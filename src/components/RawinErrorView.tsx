"use client";

import React, { useEffect, useState, useRef } from "react";
import { RefreshCw } from "lucide-react";
import FuzzyText from "@/components/FuzzyText";

export interface RawinErrorViewProps {
  code: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onExpire?: () => void;
  maintenanceMessage?: string;
  endsAt?: string | null;
}

function formatRemaining(totalMs: number): string {
  if (totalMs <= 0) return "00:00";
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function RawinErrorView({
  code,
  title,
  message,
  actionLabel,
  onAction,
  onExpire,
  maintenanceMessage,
  endsAt,
}: RawinErrorViewProps) {
  const [remainingText, setRemainingText] = useState<string | null>(null);
  const hasReloadedRef = useRef(false);

  useEffect(() => {
    if (!endsAt) {
      setRemainingText(null);
      return;
    }

    const targetTime = new Date(endsAt).getTime();
    if (isNaN(targetTime)) return;

    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setRemainingText(null);
        if (onExpire) {
          onExpire();
        } else if (!hasReloadedRef.current) {
          hasReloadedRef.current = true;
          window.location.reload();
        }
        return;
      }
      setRemainingText(formatRemaining(diff));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-error-active", "true");
      return () => {
        document.documentElement.removeAttribute("data-error-active");
      };
    }
  }, []);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      window.location.reload();
    }
  };

  const resolvedActionLabel = actionLabel || (code === "OFFLINE" ? "Retry" : "Refresh");

  return (
    <main
      role="main"
      data-error-view="true"
      className="relative w-full min-h-screen min-h-dvh flex flex-col items-center justify-center px-4 py-12 bg-ink-black text-foreground overflow-hidden selection:bg-pacific-cyan/30"
    >
      {/* Subtle Atmospheric Radial Accent */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[350px] sm:h-[500px] rounded-full bg-pacific-cyan/[0.06] blur-[140px] pointer-events-none"
      />

      {/* Grid Grain Pattern Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40"
      />

      {/* Main Content: Generous Whitespace, Dominant Error Code */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Dominant Focal Point: Giant FuzzyText Code */}
        <div className="w-full flex justify-center items-center py-2 sm:py-4">
          <FuzzyText
            baseIntensity={0.14}
            hoverIntensity={0.45}
            enableHover={true}
            fuzzRange={26}
            fps={60}
            direction="horizontal"
            transitionDuration={8}
            clickEffect={false}
            glitchMode={false}
            color="#F5F7FA"
            fontSize="clamp(6rem, 22vw, 15rem)"
            fontWeight={900}
            className="select-none drop-shadow-[0_0_36px_rgba(24,155,173,0.22)]"
          >
            {code}
          </FuzzyText>
        </div>

        {/* Content Hierarchy: Heading, Message, Notice, Countdown, Button */}
        <div className="flex flex-col items-center gap-4 max-w-lg mt-2 sm:mt-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-space text-foreground tracking-tight">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-muted leading-relaxed font-sans max-w-md">
            {message}
          </p>

          {/* Administrator Custom Notice */}
          {maintenanceMessage && (
            <div className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs sm:text-sm text-foreground/90 font-mono text-center shadow-inner">
              <span className="text-pacific-cyan text-[10px] sm:text-[11px] block uppercase tracking-wider font-semibold mb-1">
                Notice from Administrator
              </span>
              <p className="whitespace-pre-wrap leading-relaxed text-muted/90">
                {maintenanceMessage}
              </p>
            </div>
          )}

          {/* Live Expiry Countdown */}
          {remainingText && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pacific-cyan/10 border border-pacific-cyan/25 text-pacific-cyan font-mono text-xs sm:text-sm tracking-wide"
              aria-live="polite"
            >
              <span className="w-2 h-2 rounded-full bg-pacific-cyan animate-pulse" />
              <span>{remainingText} remaining</span>
            </div>
          )}

          {/* Refresh / Retry Button (No Back to Home) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAction}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.25)] hover:shadow-[0_0_30px_rgba(24,155,173,0.4)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{resolvedActionLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
