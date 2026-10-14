import SmoothScroll from "@/components/SmoothScroll";
import SiteHeader from "@/components/shell/SiteHeader";
import SiteFooter from "@/components/shell/SiteFooter";
import RawinErrorView from "@/components/RawinErrorView";
import CustomCursor from "@/components/system/CustomCursor";
import CursorField from "@/components/system/CursorField";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import {
  getSiteContent,
  DEFAULT_SITE_CONTENT,
  maintenanceActiveNow,
  shortenPageLifetimeForMaintenance,
} from "@/lib/site-content";
import ContentUnavailable from "@/components/system/ContentUnavailable";

/**
 * The public shell, and the maintenance gate for every public page.
 *
 * The public pages are static (regenerated in the background), so nothing here may read the
 * request: no cookies, headers or session. A request-dependent call made only while maintenance
 * is on turns a static page dynamic at regeneration time, which Next.js answers with a bare
 * HTTP 500 ("Page changed from static to dynamic at runtime"); that was the recurring
 * maintenance failure. The decision therefore uses the stored setting alone and is the same for
 * every visitor, administrators included (Studio stays available to them).
 *
 * While maintenance is on, the maintenance screen replaces the page (each page also checks
 * publicSiteClosed() first, because Next.js renders it in parallel with this layout, so its own
 * queries are never made), and the page's cache lifetime is shortened so it converges quickly
 * when the setting changes or a timed window ends.
 *
 * If the stored setting cannot be read (database unreachable and nothing cached), the state is
 * unknown: the site is treated as closed, never rendered from defaults, and a short-lived
 * "temporarily unavailable" screen is served instead of an error, replaced on the next render
 * that can read the content.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent().catch(() => null);

  if (!content) return <ContentUnavailable />;

  // content may be cached for a while: the end of a timed window is checked at render time
  const isMaintenanceActive = maintenanceActiveNow(content.maintenance);

  if (isMaintenanceActive) {
    await shortenPageLifetimeForMaintenance();
    const isMaintenanceMessage = content.maintenance?.showMessage;
    return (
      <main className="min-h-screen min-h-dvh flex flex-col justify-center items-center w-full relative z-10">
        <RawinErrorView
          code="503"
          title={isMaintenanceMessage ? "We'll be back soon." : "Site temporarily unavailable"}
          message={
            isMaintenanceMessage
              ? "The site is undergoing scheduled maintenance."
              : "The site is currently offline for updates."
          }
          maintenanceMessage={
            isMaintenanceMessage ? content.maintenance?.message : undefined
          }
          endsAt={
            isMaintenanceMessage ? content.maintenance?.endsAt || undefined : undefined
          }
          actionLabel="Refresh"
        />
      </main>
    );
  }

  const footerCopyright =
    content.global?.footerCopyright ||
    DEFAULT_SITE_CONTENT.global.footerCopyright;
  const currentYear = new Date().getFullYear();

  return (
    <SmoothScroll>
      <div aria-hidden="true" className="rawin-atmosphere" />
      <CursorField />
      <CustomCursor />
      <a
        href="#main"
        className="skip-link btn btn-primary btn-sm"
      >
        Skip to content
      </a>
      <SiteHeader
        brandMode={content.global?.headerBrand === "logo" ? "logo" : "wordmark"}
        logos={{ light: content.assets.logoLight, dark: content.assets.logoDark }}
        email={content.contact.email}
        socials={content.contact?.socials}
      />
      {/* No z-index here: LiquidGL places its canvas on <body> at (lens z - 1), so main must not
          trap the hero panels inside its own stacking context. */}
      <main id="main" className="flex-1 flex flex-col relative">
        {children}
      </main>
      <AnalyticsTracker />
      <SiteFooter
        content={content.global}
        availability={content.availability}
        contact={{
          ...content.contact,
          phone: content.contact?.showPhoneNumber ? content.contact.phone : "",
        }}
        footerCopyright={footerCopyright}
        currentYear={currentYear}
      />
    </SmoothScroll>
  );
}
