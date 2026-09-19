"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Galaxy = dynamic(() => import("@/components/orbit/Galaxy"), {
  ssr: false,
});

type DeviceTier = "desktop" | "tablet" | "mobile";

export default function OrbitGalaxyBackground() {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkTier = () => {
      const w = window.innerWidth;
      const nextTier: DeviceTier = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      setDeviceTier((prev) => (prev !== nextTier ? nextTier : prev));
    };

    const checkMotion = () => {
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };

    checkTier();
    checkMotion();

    window.addEventListener("resize", checkTier, { passive: true });
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener?.("change", checkMotion);

    return () => {
      window.removeEventListener("resize", checkTier);
      motionQuery.removeEventListener?.("change", checkMotion);
    };
  }, []);

  // Desktop calibrated settings (full quality, authentic Orbit atmosphere)
  const desktopConfig = {
    numLayers: 4,
    starSpeed: 0.38,
    density: 0.85,
    glowIntensity: 0.28,
    saturation: 0.0,
    mouseInteraction: !reducedMotion,
    mouseRepulsion: !reducedMotion,
    repulsionStrength: 1.4,
    twinkleIntensity: 0.25,
    rotationSpeed: 0.05,
    speed: 0.75,
    transparent: true,
    disableAnimation: reducedMotion,
    dprCap: 1.5,
  };

  // Tablet calibrated settings (intermediate quality, balanced GPU footprint)
  const tabletConfig = {
    numLayers: 3,
    starSpeed: 0.30,
    density: 0.65,
    glowIntensity: 0.22,
    saturation: 0.0,
    mouseInteraction: false,
    mouseRepulsion: false,
    repulsionStrength: 0.0,
    twinkleIntensity: 0.20,
    rotationSpeed: 0.04,
    speed: 0.65,
    transparent: true,
    disableAnimation: reducedMotion,
    dprCap: 1.0,
  };

  // Smartphone calibrated settings (lightweight, 2 layers, capped 0.75 DPR, smooth 60fps)
  const mobileConfig = {
    numLayers: 2,
    starSpeed: 0.22,
    density: 0.38,
    glowIntensity: 0.16,
    saturation: 0.0,
    mouseInteraction: false,
    mouseRepulsion: false,
    repulsionStrength: 0.0,
    twinkleIntensity: 0.12,
    rotationSpeed: 0.025,
    speed: 0.50,
    transparent: true,
    disableAnimation: reducedMotion,
    dprCap: 0.75,
  };

  const activeConfig =
    deviceTier === "mobile"
      ? mobileConfig
      : deviceTier === "tablet"
      ? tabletConfig
      : desktopConfig;

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] min-h-screen min-h-dvh pointer-events-none z-0 overflow-hidden select-none bg-[#101019]"
      aria-hidden="true"
    >
      {/* Base RAWIN Ink Black (#101019) backdrop */}
      <div className="absolute inset-0 w-full h-full bg-[#101019]" />

      {/* Atmospheric vignette to gently soften edges and enhance depth */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(16, 16, 25, 0.75) 100%)",
        }}
      />

      {/* Interactive Galaxy starfield */}
      {mounted && (
        <div className="relative w-full h-full z-0">
          <Galaxy {...activeConfig} />
        </div>
      )}
    </div>
  );
}
