import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};
import SmoothScroll from "@/components/SmoothScroll";
import PublicCustomCursor from "@/components/PublicCustomCursor";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TorchSpotlight from "@/components/TorchSpotlight";
import ParticleField from "@/components/ParticleField";
import RawinErrorView from "@/components/RawinErrorView";
import OfflineDetector from "@/components/OfflineDetector";
import AvailabilityWatcher from "@/components/AvailabilityWatcher";
import VConsole from "@/components/VConsole";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
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
  const [content, headerList] = await Promise.all([
    getSiteContent(),
    headers(),
  ]);

  const pathname = headerList.get("x-pathname") || "";

  const now = Date.now();
  const endsAtTime = content.maintenance?.endsAt ? new Date(content.maintenance.endsAt).getTime() : null;
  const isMaintenanceExpired = Boolean(endsAtTime && endsAtTime <= now);
  const isMaintenanceActive = Boolean(content.maintenance?.enabled && !isMaintenanceExpired);

  // Server-Side Maintenance Gate:
  // If maintenance is active (enabled and not expired) AND route is public, serve dedicated 503 screen
  if (
    isMaintenanceActive &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/auth")
  ) {
    const isMaintenanceMessage = content.maintenance.showMessage;
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark`}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `if (typeof window !== "undefined") { if ("scrollRestoration" in window.history) { window.history.scrollRestoration = "manual"; } window.scrollTo(0, 0); }`,
            }}
          />
        </head>
        <body
          suppressHydrationWarning
          className="min-h-screen min-h-dvh bg-ink-black text-foreground antialiased selection:bg-pacific-cyan/30 selection:text-foreground flex flex-col font-sans"
        >
          <VConsole />
          <PublicCustomCursor />
          <AvailabilityWatcher
            initialStatus={isMaintenanceMessage ? "maintenance" : "offline"}
            isServerFallback={true}
          />
          <RawinErrorView
            code="503"
            title={isMaintenanceMessage ? "We'll be back soon." : "Site temporarily unavailable"}
            message={
              isMaintenanceMessage
                ? "The site is undergoing scheduled maintenance."
                : "The site is currently offline for updates."
            }
            maintenanceMessage={
              isMaintenanceMessage ? content.maintenance.message : undefined
            }
            endsAt={
              isMaintenanceMessage ? content.maintenance?.endsAt || undefined : undefined
            }
            actionLabel="Refresh"
          />
        </body>
      </html>
    );
  }

  const footerCopyright =
    content.global?.footerCopyright ||
    DEFAULT_SITE_CONTENT.global.footerCopyright;
  const currentYear = new Date().getFullYear();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== "undefined") { if ("scrollRestoration" in window.history) { window.history.scrollRestoration = "manual"; } window.scrollTo(0, 0); }`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen min-h-dvh bg-ink-black text-foreground antialiased selection:bg-pacific-cyan/30 selection:text-foreground flex flex-col font-sans relative"
      >
        <VConsole />
        <PublicCustomCursor />
        <OfflineDetector />
        <AvailabilityWatcher />
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

