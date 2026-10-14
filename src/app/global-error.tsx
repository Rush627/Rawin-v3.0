"use client";

import "./globals.css";
import { useEffect } from "react";
import RawinErrorView from "@/components/RawinErrorView";
import { themeBootScript } from "@/components/theme/theme-script";
import { isStaleBuildError, reloadForNewBuild } from "@/lib/stale-build";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const staleBuild = isStaleBuildError(error);
  useEffect(() => {
    console.error("[RAWIN Global System Error]", {
      name: error?.name,
      message: error?.message,
      digest: error?.digest,
    });
    if (staleBuild) reloadForNewBuild();
  }, [error, staleBuild]);

  // Replaces the root layout entirely, so it resolves the theme itself before paint
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen min-h-dvh bg-bg text-fg antialiased flex flex-col font-sans">
        {staleBuild ? (
          <RawinErrorView
            code="500"
            title="RAWIN was updated"
            message="This tab is running an older version of the site. Reload to continue with the latest one."
            actionLabel="Reload"
            onAction={() => window.location.reload()}
          />
        ) : (
          <RawinErrorView
            code="500"
            title="Something went wrong"
            message="An unexpected system error occurred while loading this page."
            actionLabel="Try again"
            onAction={() => retry()}
            reference={error?.digest}
          />
        )}
      </body>
    </html>
  );
}
