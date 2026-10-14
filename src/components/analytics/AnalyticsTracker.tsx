"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Module-level, so React's development double effects and re-renders send one event per page
let lastSent = { path: "", at: 0 };

/**
 * Sends one page-view event per public page shown (first load and every client-side navigation).
 * Fire-and-forget: it never delays navigation and failures are ignored. The server validates,
 * deduplicates and decides what counts (see /api/analytics/collect).
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const now = Date.now();
    if (lastSent.path === pathname && now - lastSent.at < 10_000) return;
    lastSent = { path: pathname, at: now };
    try {
      void fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    } catch {
      // never let analytics affect the page
    }
  }, [pathname]);
  return null;
}
