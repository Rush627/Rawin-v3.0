import SmoothScroll from "@/components/SmoothScroll";
import ParticleField from "@/components/ParticleField";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TorchSpotlight from "@/components/TorchSpotlight";
import RawinErrorView from "@/components/RawinErrorView";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();

  const now = Date.now();
  const endsAtTime = content.maintenance?.endsAt ? new Date(content.maintenance.endsAt).getTime() : null;
  const isMaintenanceExpired = Boolean(endsAtTime && endsAtTime <= now);
  const isMaintenanceActive = Boolean(content.maintenance?.enabled && !isMaintenanceExpired);

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
        {/* Render children in a hidden container so Next.js nested layout slot invariant is always satisfied */}
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </main>
    );
  }

  const footerCopyright =
    content.global?.footerCopyright ||
    DEFAULT_SITE_CONTENT.global.footerCopyright;
  const currentYear = new Date().getFullYear();

  return (
    <SmoothScroll>
      <ParticleField />
      <Navbar logo={content.assets?.logo} />
      <div className="flex-1 flex flex-col relative z-10">
        {children}
      </div>
      <Footer
        content={content.global}
        contact={{
          ...content.contact,
          phone: content.contact?.showPhoneNumber ? content.contact.phone : "",
        }}
        logo={content.assets?.logo}
        footerCopyright={footerCopyright}
        currentYear={currentYear}
      />
      <TorchSpotlight />
    </SmoothScroll>
  );
}
