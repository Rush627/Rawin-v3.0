"use client";

import { useEffect } from "react";
import RawinErrorView from "@/components/RawinErrorView";
import { isStaleBuildError, reloadForNewBuild } from "@/lib/stale-build";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const staleBuild = isStaleBuildError(error);

  useEffect(() => {
    // Log sanitized error trace to console without exposing secrets or credentials
    console.error("[RAWIN Application Error]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
    // An outdated tab requesting replaced script chunks: load the current build instead
    if (staleBuild) reloadForNewBuild();
  }, [error, staleBuild]);

  if (staleBuild) {
    return (
      <RawinErrorView
        code="500"
        title="RAWIN was updated"
        message="This tab is running an older version of the site. Reload to continue with the latest one."
        actionLabel="Reload"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <RawinErrorView
      code="500"
      title="Something went wrong"
      message="Something went wrong while loading this page. Try again, or head back to the homepage."
      actionLabel="Try again"
      onAction={() => retry()}
      secondaryHref="/"
      secondaryLabel="Back to home"
      reference={error.digest}
    />
  );
}
