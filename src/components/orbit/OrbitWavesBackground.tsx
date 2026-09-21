"use client";

import { useEffect, useState, useMemo } from "react";
import GradientWaves, { GradientWavesProps } from "./GradientWaves";

export default function OrbitWavesBackground() {
  const [mounted, setMounted] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkDevice = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;
      setIsTouchDevice(isTouch);

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(motionQuery.matches);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice, { passive: true });
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const config: GradientWavesProps = useMemo(() => {
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

    if (prefersReducedMotion) {
      return {
        horizonColor: "#5227FF",
        waveColor: "#FF9FFC",
        crestColor: "#FFFFFF",
        speed: 0,
        amplitude: 2.0,
        waveScale: 0.6,
        waveRatio: 0.9,
        swell: 30,
        turbulence: 16,
        tilt: 1.11,
        zoom: 1.0,
        height: 5.5,
        fogDepth: 15,
        detail: "low",
        brightness: 0.8,
        opacity: 0.85,
        mouseInteraction: false,
        parallaxStrength: 0,
        grain: false,
        grainIntensity: 0,
      };
    }

    if (isMobile) {
      // GPU-conscious passive mobile profile (low detail, no grain, no touch tracking)
      return {
        horizonColor: "#5227FF",
        waveColor: "#FF9FFC",
        crestColor: "#FFFFFF",
        speed: 0.25,
        amplitude: 2.0,
        waveScale: 0.6,
        waveRatio: 0.9,
        swell: 30,
        turbulence: 16,
        tilt: 1.11,
        zoom: 1.0,
        height: 5.5,
        fogDepth: 15,
        detail: "low",
        brightness: 0.75,
        opacity: 0.8,
        mouseInteraction: false,
        parallaxStrength: 0,
        grain: false,
        grainIntensity: 0,
      };
    }

    if (isTablet) {
      // Balanced tablet profile
      return {
        horizonColor: "#5227FF",
        waveColor: "#FF9FFC",
        crestColor: "#FFFFFF",
        speed: 0.32,
        amplitude: 2.2,
        waveScale: 0.6,
        waveRatio: 0.9,
        swell: 32,
        turbulence: 18,
        tilt: 1.11,
        zoom: 1.0,
        height: 5.5,
        fogDepth: 15,
        detail: "medium",
        brightness: 0.9,
        opacity: 0.9,
        mouseInteraction: !isTouchDevice,
        parallaxStrength: isTouchDevice ? 0 : 0.35,
        grain: false,
        grainIntensity: 0,
      };
    }

    // Full-quality desktop profile (medium detail, subtle mouse parallax, soft grain)
    return {
      horizonColor: "#5227FF",
      waveColor: "#FF9FFC",
      crestColor: "#FFFFFF",
      speed: 0.4,
      amplitude: 2.5,
      waveScale: 0.6,
      waveRatio: 0.9,
      swell: 35,
      turbulence: 20,
      tilt: 1.11,
      zoom: 1.0,
      height: 5.5,
      fogDepth: 15,
      detail: "medium",
      brightness: 1.0,
      opacity: 1.0,
      mouseInteraction: true,
      parallaxStrength: 0.5,
      grain: true,
      grainIntensity: 0.05,
    };
  }, [viewportWidth, isTouchDevice, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 bg-[#101019]"
      aria-hidden="true"
    >
      {mounted && (
        <div className="absolute inset-0 w-full h-full">
          <GradientWaves {...config} />
        </div>
      )}
    </div>
  );
}
