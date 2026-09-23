"use client";

import { useEffect } from "react";
import RawinErrorView from "@/components/RawinErrorView";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error trace to console without exposing secrets or credentials
    console.error("[RAWIN Application Error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <RawinErrorView
      code="500"
      title="Something went wrong"
      message="Something went wrong while loading this page."
      actionLabel="Refresh"
      onAction={() => reset()}
    />
  );
}
