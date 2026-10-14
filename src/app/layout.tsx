import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};
import OfflineDetector from "@/components/OfflineDetector";
import EntranceIntro from "@/components/launch/EntranceIntro";
import AvailabilityWatcher from "@/components/AvailabilityWatcher";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { GlassProvider } from "@/components/glass/GlassProvider";
import { buildThemeBootScript, THEME_COLOR } from "@/components/theme/theme-script";
import { seoFor } from "@/lib/cms/fields";
import { BUNDLED } from "@/lib/brand-assets";
import { getSiteContent, DEFAULT_SITE_CONTENT, maintenanceActiveNow } from "@/lib/site-content";
import { SITE_URL } from "@/lib/site-url";

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

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const siteTitle = content.global?.siteTitle?.trim() || DEFAULT_SITE_CONTENT.global.siteTitle;
  const siteDescription = content.global?.shortBio?.trim() || DEFAULT_SITE_CONTENT.global.shortBio;
  const brandName = content.global?.brandName?.trim() || DEFAULT_SITE_CONTENT.global.brandName;
  // The homepage SEO override (Site Content → SEO) falls back to the site title and short bio
  const home = seoFor(content.seo, "home", { title: siteTitle, description: siteDescription });

  return {
    metadataBase: new URL(SITE_URL),
    title: home.title,
    description: home.description,
    // Favicons are rendered in <head> below (they follow the active theme); each page sets its
    // own canonical URL, so none is declared here.
    openGraph: {
      title: home.title,
      description: home.description,
      url: SITE_URL,
      siteName: brandName,
      images: [
        {
          url: content.assets.profilePhoto.url,
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

  // content may be cached for a while: the end of a timed window is checked at request time
  const isMaintenanceActive = maintenanceActiveNow(content.maintenance);
  const initialStatus = isMaintenanceActive
    ? (content.maintenance?.showMessage ? "maintenance" : "offline")
    : "live";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      data-favicon-light={content.assets.faviconLight.url}
      data-favicon-dark={content.assets.faviconDark.url}
    >
      <head>
        {/* Theme-aware identity: the boot script creates the favicon link for the active theme
            (the visitor's own choice included, not only the OS preference) from the
            data-favicon-* URLs on <html>, and every theme change swaps it. Light theme = dark-ink
            mark on a light tile, and vice versa. Without JavaScript the dark tile is used. */}
        <noscript>
          <link rel="icon" href={content.assets.faviconDark.url} />
        </noscript>
        <link rel="apple-touch-icon" href={BUNDLED.appleTouchIcon} />
        <meta
          id="rawin-theme-color"
          suppressHydrationWarning
          name="theme-color"
          content={THEME_COLOR.dark}
          data-light={THEME_COLOR.light}
          data-dark={THEME_COLOR.dark}
        />
        {/* CMS defaults (global.themeDefault*) are inlined so a first visit paints in the right theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: buildThemeBootScript({
              desktop: content.global?.themeDefaultDesktop === "light" ? "light" : "dark",
              mobile: content.global?.themeDefaultMobile === "dark" ? "dark" : "light",
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen min-h-dvh text-fg antialiased flex flex-col font-sans relative"
      >
        <ThemeProvider>
          <GlassProvider>
            {/* Rendered in the root shell so it covers the first paint (incl. streaming); it
                only activates when the pre-paint script flags html[data-intro] on "/". */}
            <EntranceIntro />
            <OfflineDetector />
            <AvailabilityWatcher initialStatus={initialStatus} isServerFallback={isMaintenanceActive} />
            {children}
          </GlassProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

