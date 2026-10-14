"use client";

import OrbitOrb, { type OrbMood } from "./OrbitOrb";

interface OrbitEmblemProps {
  mood?: OrbMood;
  pulseKey?: number;
  /** Width classes for the orb box (the rings extend ~18% beyond it) */
  className?: string;
  /** Square render resolution in CSS px for the WebGL canvas */
  resolution?: number;
}

/**
 * Rawin Orbit's emblem — the single presentation of the orb used everywhere (homepage
 * "Contextual assistant" section and the Orbit page): the WebGL orb inside a dashed
 * halo ring and a tilted orbital ellipse. Size it with `className`; the object itself
 * never changes between pages.
 */
export default function OrbitEmblem({ mood = "idle", pulseKey = 0, className = "w-[180px]", resolution = 220 }: OrbitEmblemProps) {
  return (
    <div className={`relative aspect-square shrink-0 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -inset-[18%] w-[136%] h-[136%] text-line-strong pointer-events-none" fill="none">
        <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
        <ellipse cx="100" cy="100" rx="98" ry="34" transform="rotate(-20 100 100)" stroke="currentColor" strokeWidth="0.6" />
      </svg>
      <OrbitOrb mood={mood} pulseKey={pulseKey} size={resolution} fill />
    </div>
  );
}
