import SmoothScroll from "@/components/SmoothScroll";
import ParticleField from "@/components/ParticleField";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TorchSpotlight from "@/components/TorchSpotlight";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();
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
