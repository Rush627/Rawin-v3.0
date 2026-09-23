"use client";

import { useEffect } from "react";
import RawinErrorView from "@/components/RawinErrorView";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RAWIN Global System Error]", {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen min-h-dvh bg-ink-black text-foreground antialiased selection:bg-pacific-cyan/30 selection:text-foreground flex flex-col font-sans">
        <RawinErrorView
          code="500"
          title="Something went wrong"
          message="An unexpected system error occurred while loading this page."
          actionLabel="Refresh"
          onAction={() => reset()}
        />
      </body>
    </html>
  );
}
