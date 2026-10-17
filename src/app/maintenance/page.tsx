import type { Metadata } from "next";
import RawinErrorView from "@/components/RawinErrorView";
import SystemScreenBoot from "@/components/system/SystemScreenBoot";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Temporarily unavailable | RAWIN",
  robots: { index: false, follow: false },
};

/**
 * A standalone maintenance screen (the public layout renders the same view in place on every
 * public page). Only the maintenance copy is rendered; no page content is included, and when the
 * setting cannot be read the generic "temporarily unavailable" copy is shown instead of an error.
 */
export default async function MaintenancePage() {
  const content = await getSiteContent().catch(() => null);
  const m = content?.maintenance;
  const withMessage = Boolean(m?.enabled && m.showMessage);
  return (
    <>
      <SystemScreenBoot />
      <RawinErrorView
        code="503"
        title={withMessage ? "We'll be back soon." : "Site temporarily unavailable"}
        message={withMessage ? "The site is undergoing scheduled maintenance." : "The site is currently offline for updates."}
        maintenanceMessage={withMessage ? m?.message : undefined}
        endsAt={withMessage ? m?.endsAt || undefined : undefined}
        actionLabel="Refresh"
        brandMode={content?.global?.headerBrand === "logo" ? "logo" : "wordmark"}
        logos={
          content?.assets
            ? { light: content.assets.logoLight, dark: content.assets.logoDark }
            : undefined
        }
      />
    </>
  );
}
