"use client";

import OrbitWavesBackground from "./OrbitWavesBackground";

/**
 * OrbitTerminalBackground (Legacy Alias)
 * Re-exports OrbitWavesBackground (React Bits GradientWaves WebGL background)
 * to ensure complete backward compatibility without keeping any legacy background running.
 */
export default function OrbitTerminalBackground() {
  return <OrbitWavesBackground />;
}

