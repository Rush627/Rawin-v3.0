"use client";

import "./OrbitGlassOrb.css";

export type OrbitGlassOrbState = "idle" | "responding";
export type OrbitGlassOrbSize = "hero" | "compact" | "avatar";

export interface OrbitGlassOrbProps {
  state?: OrbitGlassOrbState;
  size?: OrbitGlassOrbSize;
  className?: string;
  active?: boolean;
}

export default function OrbitGlassOrb({
  state = "idle",
  size = "hero",
  className = "",
  active = false,
}: OrbitGlassOrbProps) {
  const isResponding = active || state === "responding";
  const stateClass = isResponding ? "orbit-orb--responding" : "orbit-orb--idle";

  const sizeClass = {
    hero: "w-[76px] h-[76px] sm:w-[86px] sm:h-[86px] lg:w-[86px] lg:h-[86px]",
    compact: "w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] lg:w-[62px] lg:h-[62px]",
    avatar: "w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]",
  }[size];

  return (
    <div
      className={`orbit-orb-root shrink-0 ${sizeClass} ${stateClass} ${className}`}
      data-orb-size={size}
      aria-hidden="true"
    >
      {/* Outer atmospheric halo */}
      <div className="orbit-orb-halo" />

      {/* Main glass sphere */}
      <div className="orbit-orb-shell">

        {/* Aurora interior - blobs use screen blend for additive luminosity */}
        <div className="orbit-orb-aurora">

          {/* Blob A: Deep violet/indigo - foundational aurora layer */}
          <div className="orbit-blob orbit-blob-a" />

          {/* Blob B: Pacific cyan - primary signature color */}
          <div className="orbit-blob orbit-blob-b" />

          {/* Blob C: Vivid indigo/purple - counter drift */}
          <div className="orbit-blob orbit-blob-c" />

          {/* Blob D: Magenta/rose accent - Siri warmth */}
          <div className="orbit-blob orbit-blob-d" />

          {/* Blob E: Electric cyan highlight - luminous core */}
          <div className="orbit-blob orbit-blob-e" />

        </div>

        {/* Glass lens overlay - top specular highlight */}
        <div className="orbit-orb-lens" />

        {/* Hairline rim */}
        <div className="orbit-orb-rim" />
      </div>
    </div>
  );
}
