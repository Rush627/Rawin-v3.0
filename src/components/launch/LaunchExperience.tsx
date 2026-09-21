"use client";

import { useEffect, useState, useRef } from "react";
import type { LaunchExperienceContent } from "@/lib/site-content";
import SignalWakeAnimation from "./SignalWakeAnimation";

const STORAGE_KEY = "rawin-launch-seen";
const SESSION_KEY = "rawin-launch-seen-session";

export interface LaunchExperienceProps {
  launch?: LaunchExperienceContent | null;
  isPreview?: boolean;
  onComplete?: () => void;
}

export default function LaunchExperience({
  launch,
  isPreview = false,
  onComplete,
}: LaunchExperienceProps) {
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    const isUrlPreview =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("launch");

    // If preview mode, always render immediately regardless of storage or dates
    if (isPreview || isUrlPreview) {
      setShouldRender(true);
      return;
    }

    if (checkedRef.current) return;
    checkedRef.current = true;

    // 1. Master enable switch
    if (!launch || !launch.enabled) {
      setShouldRender(false);
      return;
    }

    // 2. Date window verification
    const now = Date.now();
    if (launch.startDate) {
      const startTime = new Date(launch.startDate).getTime();
      if (!isNaN(startTime) && now < startTime) {
        setShouldRender(false);
        return;
      }
    }

    if (launch.endDate) {
      const endTime = new Date(launch.endDate).getTime();
      if (!isNaN(endTime) && now > endTime) {
        setShouldRender(false);
        return;
      }
    }

    // 3. Frequency evaluation with safe storage wrapper
    const currentVersion = launch.launchVersion || "2026-v3-launch";

    try {
      if (launch.showFrequency === "once") {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.version === currentVersion) {
            setShouldRender(false);
            return;
          }
        }
      } else if (launch.showFrequency === "session") {
        const stored = window.sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.version === currentVersion) {
            setShouldRender(false);
            return;
          }
        }
      }
      // "visit": always runs once on initial page entry
    } catch {
      // If browser storage is blocked or throws in strict privacy mode, allow smooth fallback
    }

    // Check reduced motion preference
    try {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(motionQuery.matches);
    } catch {
      setIsReducedMotion(false);
    }

    // Mark as qualified to render
    setShouldRender(true);

    // Record seen state so future reloads respect showFrequency
    try {
      const payload = JSON.stringify({
        version: currentVersion,
        seenAt: new Date().toISOString(),
      });
      if (launch.showFrequency === "once") {
        window.localStorage.setItem(STORAGE_KEY, payload);
      } else if (launch.showFrequency === "session") {
        window.sessionStorage.setItem(SESSION_KEY, payload);
      }
    } catch {
      // Non-critical persistence catch
    }
  }, [launch, isPreview]);

  const handleAnimationComplete = () => {
    setShouldRender(false);
    onComplete?.();
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <SignalWakeAnimation
      primaryMessage={launch?.primaryMessage || "RAWIN v3.0"}
      secondaryMessage={launch?.secondaryMessage || "A new iteration is live."}
      duration={launch?.duration || 12.0}
      onComplete={handleAnimationComplete}
      isReducedMotion={isReducedMotion}
    />
  );
}
