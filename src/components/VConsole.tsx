"use client";

import { useEffect } from "react";

export default function VConsole() {
  useEffect(() => {
    let instance: { destroy?: () => void } | null = null;

    import("vconsole")
      .then(({ default: VConsoleConstructor }) => {
        instance = new VConsoleConstructor();
      })
      .catch((err) => {
        console.error("Failed to initialize vConsole:", err);
      });

    return () => {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
    };
  }, []);

  return null;
}
