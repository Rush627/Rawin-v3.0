"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import RawinErrorView from "@/components/RawinErrorView";
import type { PublicAvailability } from "@/lib/site-content";

export interface AvailabilityWatcherProps {
  initialStatus?: "live" | "offline" | "maintenance";
  isServerFallback?: boolean;
}

export default function AvailabilityWatcher({
  initialStatus = "live",
  isServerFallback = false,
}: AvailabilityWatcherProps) {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  const [state, setState] = useState<PublicAvailability>({ status: initialStatus });
  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasTriggeredReloadRef = useRef(false);

  const checkAvailability = useCallback(async () => {
    // Never poll on administrative routes
    if (isAdmin) return;
    if (isCheckingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    isCheckingRef.current = true;

    try {
      const res = await fetch("/api/availability", {
        cache: "no-store",
        signal: controller.signal,
      });

      if (res.ok) {
        const data: PublicAvailability = await res.json();
        setState(data);

        // If this tab was loaded on the server-rendered 503 screen,
        // reload once the site transitions back to live so the complete website renders.
        if (isServerFallback && data.status === "live" && !hasTriggeredReloadRef.current) {
          hasTriggeredReloadRef.current = true;
          window.location.reload();
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        // Silently preserve current state during brief connection hiccups
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [isAdmin, isServerFallback]);

  useEffect(() => {
    if (isAdmin) return;

    // Check availability on initial mount
    checkAvailability();

    // Conservative polling (every 12 seconds), automatically paused when tab is hidden
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        checkAvailability();
      }
    }, 12000);

    // Immediate re-check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAvailability();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Immediate re-check when network connection is restored
    const handleOnline = () => {
      checkAvailability();
    };
    window.addEventListener("online", handleOnline);

    // Instant cross-tab synchronization via BroadcastChannel within the same browser
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("rawin_availability_sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "AVAILABILITY_CHANGED") {
            checkAvailability();
          }
        };
      } catch {}
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      if (channel) {
        channel.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAdmin, checkAvailability]);

  // Immediate check when navigating between client-side routes
  useEffect(() => {
    if (isAdmin) return;
    checkAvailability();
  }, [pathname, isAdmin, checkAvailability]);

  // If on admin routes, or if the site is live, or if this is the server fallback, do not render client overlay
  const isOverlayActive = !isAdmin && state.status !== "live" && !isServerFallback;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOverlayActive) {
      document.documentElement.setAttribute("data-error-active", "true");
      return () => {
        document.documentElement.removeAttribute("data-error-active");
      };
    }
  }, [isOverlayActive]);

  if (!isOverlayActive) {
    return null;
  }

  const isMaintenance = state.status === "maintenance";

  return (
    <div
      data-error-overlay="true"
      className="fixed inset-0 z-[9998] bg-ink-black flex flex-col overflow-y-auto"
      role="region"
      aria-label="Website Availability Notice"
    >
      <RawinErrorView
        code="503"
        title={isMaintenance ? "We'll be back soon." : "Site temporarily unavailable"}
        message={
          isMaintenance
            ? "The site is undergoing scheduled maintenance."
            : "The site is currently offline for updates."
        }
        maintenanceMessage={isMaintenance ? state.message : undefined}
        endsAt={isMaintenance ? state.endsAt : undefined}
        actionLabel="Refresh"
        onAction={() => {
          checkAvailability();
        }}
        onExpire={() => {
          checkAvailability();
        }}
      />
    </div>
  );
}
