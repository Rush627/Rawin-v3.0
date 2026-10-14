import type { Metadata } from "next";
import RawinErrorView from "@/components/RawinErrorView";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Temporarily unavailable | RAWIN",
  robots: { index: false, follow: false },
};

/**
 * Served by the proxy (as a rewrite, with HTTP 503) for every public page while maintenance or
 * offline mode is on. Only the maintenance copy is rendered; no page content is included.
 */
export default async function MaintenancePage() {
  const content = await getSiteContent();
  const m = content.maintenance;
  const withMessage = m?.enabled && m.showMessage;
  return (
    <main className="min-h-screen min-h-dvh flex flex-col justify-center items-center w-full relative z-10">
      <RawinErrorView
        code="503"
        title={withMessage ? "We'll be back soon." : "Site temporarily unavailable"}
        message={withMessage ? "The site is undergoing scheduled maintenance." : "The site is currently offline for updates."}
        maintenanceMessage={withMessage ? m.message : undefined}
        endsAt={withMessage ? m.endsAt || undefined : undefined}
        actionLabel="Refresh"
      />
    </main>
  );
}
