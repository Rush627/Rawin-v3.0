import SmoothScroll from "@/components/SmoothScroll";
import SiteHeader from "@/components/shell/SiteHeader";
import SiteFooter from "@/components/shell/SiteFooter";
import RawinErrorView from "@/components/RawinErrorView";
import CustomCursor from "@/components/system/CustomCursor";
import CursorField from "@/components/system/CursorField";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import { getSiteContent, DEFAULT_SITE_CONTENT, maintenanceActiveNow } from "@/lib/site-content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();

  // content may be cached for a while: the end of a timed window is checked at request time
  const isMaintenanceActive = maintenanceActiveNow(content.maintenance);

  if (isMaintenanceActive) {
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
        {/* The proxy normally answers maintenance requests itself (HTTP 503, /maintenance). This
            branch only covers the few seconds its cache may lag: page content is not rendered. */}
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
