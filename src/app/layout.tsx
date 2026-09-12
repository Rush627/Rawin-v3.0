import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TorchSpotlight from "@/components/TorchSpotlight";
import ParticleField from "@/components/ParticleField";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const faviconUrl = content.assets?.favicon?.url || "/favicon.png";
  const profilePhotoUrl = content.assets?.profilePhoto?.url || "/images/profile.png";

  return {
    metadataBase: new URL("https://rushan-siddiqui.com"),
    title: "RAWIN | Rushan Siddiqui : Full Stack Developer",
    description:
      "Portfolio of Rushan Siddiqui, Full Stack Developer crafting modern, minimal, high-performance web applications and digital experiences.",
    icons: {
      icon: [
        { url: faviconUrl },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      title: "RAWIN | Rushan Siddiqui : Full Stack Developer",
      description:
        "Full Stack Developer specializing in high-performance web applications, fluid interfaces, and scalable architectures.",
      url: "https://rushan-siddiqui.com",
      siteName: "RAWIN",
      images: [
        {
          url: profilePhotoUrl,
          width: 800,
          height: 800,
          alt: "Rushan Siddiqui",
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function RootLayout({
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark`}
    >
      <body className="min-h-screen bg-ink-black text-foreground antialiased selection:bg-pacific-cyan/30 selection:text-foreground flex flex-col font-sans relative">
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
      </body>
    </html>
  );
}

