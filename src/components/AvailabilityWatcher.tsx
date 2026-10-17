"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import RawinErrorView, { type RawinErrorViewProps } from "@/components/RawinErrorView";
import type { PublicAvailability } from "@/lib/site-content";
import { LIVE_SYNC_CHANNEL } from "@/lib/cms/live-sync";
import { publishSoundSettings } from "@/components/audio/SoundSettings";

const MAINTENANCE_POLL_MS = 2500; // 2.5s for fast maintenance recovery detection
const LIVE_POLL_MS = 8000; // 8s for live CMS synchronization (target 5-10s)

export interface AvailabilityWatcherProps {
  initialStatus?: "live" | "offline" | "maintenance";
  isServerFallback?: boolean;
  /** The CMS header brand, so the overlay shows the same identity as the server-rendered screen */
  brandMode?: RawinErrorViewProps["brandMode"];
  logos?: RawinErrorViewProps["logos"];
}

export default function AvailabilityWatcher({
  initialStatus = "live",
  isServerFallback = false,
  brandMode,
  logos,
}: AvailabilityWatcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = Boolean(pathname?.startsWith("/saint-denis"));

  const [state, setState] = useState<PublicAvailability>({ status: initialStatus });
  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRevisionRef = useRef<number | null>(null);

  const statusRef = useRef(state.status);
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);
  // whether the server rendered the maintenance screen for this page (updated by each refresh)
  const serverFallbackRef = useRef(isServerFallback);
  useEffect(() => {
    serverFallbackRef.current = isServerFallback;
  }, [isServerFallback]);

  const checkAvailability = useCallback(
    async (_force?: boolean) => {
      // Never poll on administrative Studio routes
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
          if (data.sound) publishSoundSettings(data.sound);
          const prevStatus = statusRef.current;
          const nextStatus = data.status;

          setState(data);

          // 1. Recovery from maintenance. The page itself is static and may still be the
          // maintenance copy for a few seconds after the setting changes, so a page the server
          // rendered as maintenance keeps refreshing (at the maintenance poll rate) until the
          // server copy is live too; one refresh is not always enough.
          if (nextStatus === "live" && (prevStatus !== "live" || serverFallbackRef.current)) {
            router.refresh();
          }

          // 2. CMS Content Synchronization:
          if (nextStatus === "live" && typeof data.revision === "number" && data.revision > 0) {
            if (lastRevisionRef.current !== null && data.revision > lastRevisionRef.current) {
              // A new revision was published! Refresh Server Components without losing scroll/form state
              lastRevisionRef.current = data.revision;
              router.refresh();
            } else if (lastRevisionRef.current === null) {
              lastRevisionRef.current = data.revision;
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          // Silently preserve current state during brief connection drops
        }
      } finally {
        isCheckingRef.current = false;
      }
    },
    [isAdmin, router]
  );

  useEffect(() => {
    if (isAdmin) return;

    // Check availability asynchronously on initial mount
    const mountTimer = setTimeout(() => {
      void checkAvailability();
    }, 0);

    // Adaptive interval: 2.5s when in maintenance/offline; 8s when live
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      const intervalMs =
        statusRef.current === "live" && !isServerFallback
          ? LIVE_POLL_MS
          : MAINTENANCE_POLL_MS;

      timer = setTimeout(async () => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          await checkAvailability();
        }
        scheduleNext();
      }, intervalMs);
    };

    scheduleNext();

    // Immediate re-check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkAvailability();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Immediate re-check on window focus
    const handleFocus = () => {
      void checkAvailability();
    };
    window.addEventListener("focus", handleFocus);

    // Immediate re-check when network connection is restored
    const handleOnline = () => {
      void checkAvailability();
    };
    window.addEventListener("online", handleOnline);

    // Instant cross-tab synchronization via BroadcastChannel within the same browser
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(LIVE_SYNC_CHANNEL);
        channel.onmessage = (event) => {
          if (
            event.data?.type === "AVAILABILITY_CHANGED" ||
            event.data?.type === "CMS_UPDATED"
          ) {
            void checkAvailability();
          }
        };
      } catch {}
    }

    return () => {
      clearTimeout(mountTimer);
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      if (channel) {
        channel.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAdmin, isServerFallback, checkAvailability]);

  // Immediate check when navigating between client-side routes
  useEffect(() => {
    if (isAdmin) return;
    const navTimer = setTimeout(() => {
      void checkAvailability();
    }, 0);
    return () => clearTimeout(navTimer);
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
      className="fixed inset-0 z-[9998] bg-bg flex flex-col overflow-y-auto"
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
        brandMode={brandMode}
        logos={logos}
        onAction={() => {
          checkAvailability(true);
        }}
        onExpire={() => {
          checkAvailability(true);
        }}
      />
    </div>
  );
}
