"use client";

import { useEffect, useState, useCallback } from "react";
import RawinErrorView from "@/components/RawinErrorView";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only set offline if navigator is explicitly offline after mount
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOffline) {
      document.documentElement.setAttribute("data-error-active", "true");
      return () => {
        document.documentElement.removeAttribute("data-error-active");
      };
    }
  }, [isOffline]);

  const handleRetry = useCallback(() => {
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        setIsOffline(false);
      } else {
        window.location.reload();
      }
    }
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      data-error-overlay="true"
      className="fixed inset-0 z-[9999] bg-ink-black flex flex-col"
    >
      <RawinErrorView
        code="OFFLINE"
        title="You're offline"
        message="Check your connection and try again."
        actionLabel="Retry"
        onAction={handleRetry}
      />
    </div>
  );
}
