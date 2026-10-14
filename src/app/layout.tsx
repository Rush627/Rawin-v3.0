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
import { getSiteContent, DEFAULT_SITE_CONTENT, maintenanceActiveNow, type SiteContent } from "@/lib/site-content";
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

/**
 * The root shell wraps Studio as well as the public pages, and uses site content only for
 * presentation (favicons, first-visit theme, default metadata) and the availability watcher's
 * starting state. It must render even when the content cannot be read (the Studio sign-in page
 * reports that itself), so it falls back to the built-in presentation here. Public pages never
 * render from that fallback: the public layout and the pages read the content themselves and
 * stop when it is unavailable. Like the public layout, it never reads the request (see there).
 */
async function shellContent(): Promise<SiteContent | null> {
  return getSiteContent().catch(() => null);
}

export async function generateMetadata(): Promise<Metadata> {
  const content = (await shellContent()) ?? DEFAULT_SITE_CONTENT;
  const siteTitle = content.global?.siteTitle?.trim() || DEFAULT_SITE_CONTENT.global.siteTitle;
  const siteDescription = content.global?.shortBio?.trim() || DEFAULT_SITE_CONTENT.global.shortBio;
  const brandName = content.global?.brandName?.trim() || DEFAULT_SITE_CONTENT.global.brandName;
  // The homepage SEO override (Site Content → SEO) falls back to the site title and short bio
  const home = seoFor(content.seo, "home", { title: siteTitle, description: siteDescription });

  return {
    metadataBase: new URL(SITE_URL),
    title: home.title,
    description: home.description,
    icons: {
      icon: [
        { url: content.assets.faviconDark.url, sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-dark-192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        { url: `${BUNDLED.appleTouchIcon}?v=3`, sizes: "180x180", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
    },
    manifest: "/manifest.webmanifest",
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
  const stored = await shellContent();
  const content = stored ?? DEFAULT_SITE_CONTENT;

  // the same decision as the public layout (stored setting only, end of a timed window checked
  // at render time). Unreadable content is treated as closed, as the public layout does: the
  // watcher then polls quickly and refreshes once the site answers as live.
  const showMaintenance = stored === null || maintenanceActiveNow(stored.maintenance);
  const initialStatus = showMaintenance
    ? (stored?.maintenance?.showMessage ? "maintenance" : "offline")
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
        {/* Canonical icon declarations: static links for search crawlers and mobile browsers,
            with id="rawin-favicon" for theme-aware dynamic switching by the inline boot script. */}
        <link id="rawin-favicon" rel="icon" href={content.assets.faviconDark.url} sizes="32x32" type="image/png" />
        <link rel="icon" href="/brand/favicon-dark-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href={`${BUNDLED.appleTouchIcon}?v=3`} sizes="180x180" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <noscript>
          <link rel="icon" href={content.assets.faviconDark.url} />
        </noscript>
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
            <AvailabilityWatcher initialStatus={initialStatus} isServerFallback={showMaintenance} />
            {children}
          </GlassProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

