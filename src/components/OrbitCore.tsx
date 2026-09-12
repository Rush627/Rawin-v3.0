"use client";

import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";

export type OrbitCoreState =
  | "idle"
  | "user_sent"
  | "generating"
  | "streaming"
  | "complete"
  | "error";

interface OrbitCoreProps {
  state?: OrbitCoreState;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}

export default function OrbitCore({
  state = "idle",
  size = "md",
  className = "",
}: OrbitCoreProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isGenerating = state === "generating";
  const isStreaming = state === "streaming";
  const isActive = isGenerating || isStreaming;
  const isUserSent = state === "user_sent";
  const isError = state === "error";
  const isComplete = state === "complete";

  // Dimension scaling
  const dim = {
    sm: {
      box: "w-7 h-7",
      core: "w-2 h-2",
      layer1: "w-4 h-4",
      layer2: "w-5.5 h-5.5",
      layer3: "w-7 h-7",
    },
    md: {
      box: "w-9 h-9",
      core: "w-2.5 h-2.5",
      layer1: "w-5 h-5",
      layer2: "w-7 h-7",
      layer3: "w-9 h-9",
    },
    lg: {
      box: "w-16 h-16",
      core: "w-4 h-4",
      layer1: "w-9 h-9",
      layer2: "w-12 h-12",
      layer3: "w-16 h-16",
    },
    hero: {
      box: "w-24 h-24",
      core: "w-6 h-6",
      layer1: "w-14 h-14",
      layer2: "w-18 h-18",
      layer3: "w-24 h-24",
    },
  }[size];

  // Motion variants according to state and reduced motion preference
  const layer1Anim = reducedMotion
    ? { scale: 1, opacity: isError ? 0.3 : isActive ? 0.8 : 0.4 }
    : isError
    ? { scale: 0.95, opacity: 0.5, rotate: 0 }
    : isActive
    ? {
        scale: [1, 1.14, 0.96, 1],
        rotate: [0, 90, 180, 270, 360],
        opacity: [0.65, 0.9, 0.7, 0.65],
      }
    : isUserSent
    ? { scale: [1, 1.2, 1], opacity: 0.8 }
    : isComplete
    ? { scale: [1.1, 1], opacity: 0.5 }
    : {
        // Idle breathing
        scale: [1, 1.06, 1],
        opacity: [0.35, 0.55, 0.35],
      };

  const layer1Trans: Transition = reducedMotion
    ? { duration: 0.3 }
    : isError
    ? { duration: 0.4 }
    : isActive
    ? { repeat: Infinity, duration: isStreaming ? 3.5 : 4.5, ease: "easeInOut" as const }
    : isUserSent
    ? { duration: 0.6, ease: "easeOut" as const }
    : isComplete
    ? { duration: 0.8, ease: "easeOut" as const }
    : {
        repeat: Infinity,
        duration: 5,
        ease: "easeInOut" as const,
      };

  const layer2Anim = reducedMotion
    ? { scale: 1, opacity: isError ? 0.2 : isActive ? 0.6 : 0.25 }
    : isError
    ? { scale: 0.9, opacity: 0.3, rotate: 0 }
    : isActive
    ? {
        scale: [1, 0.92, 1.1, 1],
        rotate: [360, 270, 180, 90, 0],
        opacity: [0.3, 0.6, 0.4, 0.3],
      }
    : isUserSent
    ? { scale: [1, 1.15, 1], opacity: 0.5 }
    : {
        scale: [1, 1.04, 1],
        opacity: [0.2, 0.35, 0.2],
      };

  const layer2Trans: Transition = reducedMotion
    ? { duration: 0.3 }
    : isError
    ? { duration: 0.4 }
    : isActive
    ? { repeat: Infinity, duration: isStreaming ? 4.5 : 6, ease: "easeInOut" as const }
    : {
        repeat: Infinity,
        duration: 7,
        ease: "easeInOut" as const,
      };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${dim.box} ${className}`}
      aria-label={`Orbit Core: ${state}`}
      role="img"
    >
      {/* Ambient Depth Glow (Soft cyan illumination / Error rose illumination) */}
      <div
        className={`absolute inset-0 rounded-full blur-md transition-opacity duration-700 pointer-events-none ${
          isError
            ? "bg-rose-500/20 opacity-80"
            : isActive
            ? "bg-pacific-cyan/35 opacity-90"
            : isUserSent
            ? "bg-pacific-cyan/40 opacity-90"
            : "bg-pacific-cyan/15 opacity-40"
        }`}
      />

      {/* Layer 3: Outermost subtle orbital boundary / translucent horizon */}
      <div
        className={`absolute ${dim.layer3} rounded-full border transition-all duration-700 ${
          isError
            ? "border-rose-500/20"
            : isActive
            ? "border-pacific-cyan/30 shadow-[0_0_16px_rgba(24,155,173,0.15)]"
            : "border-white/[0.06]"
        }`}
      />

      {/* Layer 2: Intermediate fluid energy ellipse / deformation */}
      <motion.div
        className={`absolute ${dim.layer2} rounded-full border pointer-events-none transition-colors duration-500 ${
          isError
            ? "border-rose-400/30"
            : isActive
            ? "border-pacific-cyan/45 bg-pacific-cyan/[0.04]"
            : "border-pacific-cyan/20 bg-pacific-cyan/[0.02]"
        }`}
        style={{ borderRadius: "46% 54% 52% 48% / 50% 48% 52% 50%" }}
        animate={layer2Anim}
        transition={layer2Trans}
      />

      {/* Layer 1: Inner fluid breathing light sphere */}
      <motion.div
        className={`absolute ${dim.layer1} rounded-full pointer-events-none transition-colors duration-500 ${
          isError
            ? "bg-gradient-to-tr from-rose-500/30 to-amber-500/20 border border-rose-500/40"
            : isActive
            ? "bg-gradient-to-tr from-pacific-cyan/30 via-pacific-cyan/15 to-transparent border border-pacific-cyan/50"
            : "bg-gradient-to-tr from-pacific-cyan/20 via-pacific-cyan/10 to-transparent border border-pacific-cyan/30"
        }`}
        style={{ borderRadius: "52% 48% 55% 45% / 48% 54% 46% 52%" }}
        animate={layer1Anim}
        transition={layer1Trans}
      />

      {/* Central Luminance Nucleus */}
      <div
        className={`relative z-10 rounded-full transition-all duration-500 ${dim.core} ${
          isError
            ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
            : isActive
            ? "bg-pacific-cyan shadow-[0_0_12px_rgba(24,155,173,0.85)] scale-110"
            : isUserSent
            ? "bg-pacific-cyan shadow-[0_0_10px_rgba(24,155,173,0.6)]"
            : "bg-pacific-cyan/80 shadow-[0_0_6px_rgba(24,155,173,0.4)]"
        }`}
      />
    </div>
  );
}
