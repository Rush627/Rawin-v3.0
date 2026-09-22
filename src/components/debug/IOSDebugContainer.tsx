"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled so it only ever evaluates in browser client
const IOSDebugPanel = dynamic(() => import("./IOSDebugPanel"), {
  ssr: false,
});

export default function IOSDebugContainer() {
  const [isDebugActive, setIsDebugActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        if (params.get("ios-debug") === "1" || search.includes("ios-debug=1")) {
          setIsDebugActive(true);
        }
      } catch {
        // Safe fallback
      }
    }
  }, []);

  if (!isDebugActive) {
    return null;
  }

  return <IOSDebugPanel />;
}
