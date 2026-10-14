import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSiteContentFresh, maintenanceActiveNow } from "@/lib/site-content";
import { getSystemChecks } from "@/lib/studio/system-checks";
import StudioHeader from "@/components/studio/StudioHeader";
import { AccountCard, AvailabilityCard, LaunchCard, SiteModeCard, SystemStatus, ThemeDefaultsCard } from "@/components/studio/SettingsCards";

export const metadata = { title: "Settings | RAWIN Studio" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login?redirect=/saint-denis/settings");

  const [content, system] = await Promise.all([getSiteContentFresh(), getSystemChecks()]);

  return (
    <div>
      <StudioHeader eyebrow="Settings" title="How the site runs" description="Availability, site mode, launch intro, theme defaults, your account and system health." />
      <div className="flex flex-col gap-4">
        <AvailabilityCard initial={content.availability} />
        <SiteModeCard initial={{ ...content.maintenance, active: maintenanceActiveNow(content.maintenance) }} />
        <LaunchCard initial={content.launchExperience} />
        <ThemeDefaultsCard
          initial={{
            themeDefaultDesktop: content.global.themeDefaultDesktop === "light" ? "light" : "dark",
            themeDefaultMobile: content.global.themeDefaultMobile === "dark" ? "dark" : "light",
          }}
        />
        <AccountCard email={session.email} />
        <SystemStatus checks={system.checks} />
      </div>
    </div>
  );
}
