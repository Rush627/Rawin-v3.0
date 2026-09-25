import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};
import PublicCustomCursor from "@/components/PublicCustomCursor";
import OfflineDetector from "@/components/OfflineDetector";
import AvailabilityWatcher from "@/components/AvailabilityWatcher";
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
  const rawFaviconUrl = content.assets?.favicon?.url;
  const isCmsFavicon = Boolean(
    rawFaviconUrl &&
    rawFaviconUrl.startsWith("/api/assets/favicon/")
  );
  const faviconUrl = isCmsFavicon ? rawFaviconUrl! : "/favicon.png";
  const profilePhotoUrl = content.assets?.profilePhoto?.url || "/images/profile.png";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://rawin.world";
  const siteTitle = content.global?.siteTitle?.trim() || DEFAULT_SITE_CONTENT.global.siteTitle;
  const siteDescription =
    content.global?.shortBio?.trim() ||
    DEFAULT_SITE_CONTENT.global.shortBio;
  const brandName = content.global?.brandName?.trim() || DEFAULT_SITE_CONTENT.global.brandName;

  return {
    metadataBase: new URL(siteUrl),
    title: siteTitle,
    description: siteDescription,
    alternates: {
      canonical: "/",
    },
    icons: isCmsFavicon
      ? {
          icon: [{ url: faviconUrl }],
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : {
          icon: [
            { url: "/favicon.png", type: "image/png" },
            { url: "/favicon.ico", sizes: "any" },
          ],
          shortcut: "/favicon.png",
          apple: "/favicon.png",
        },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: brandName,
      images: [
        {
          url: profilePhotoUrl,
          width: 800,
          height: 800,
          alt: brandName,
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

  const now = Date.now();
  const endsAtTime = content.maintenance?.endsAt ? new Date(content.maintenance.endsAt).getTime() : null;
  const isMaintenanceExpired = Boolean(endsAtTime && endsAtTime <= now);
  const isMaintenanceActive = Boolean(content.maintenance?.enabled && !isMaintenanceExpired);
  const initialStatus = isMaintenanceActive
    ? (content.maintenance?.showMessage ? "maintenance" : "offline")
    : "live";

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
        <OfflineDetector />
        <AvailabilityWatcher initialStatus={initialStatus} isServerFallback={isMaintenanceActive} />
        {children}
        <PublicCustomCursor />
      </body>
    </html>
  );
}

