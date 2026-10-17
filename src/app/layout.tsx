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
import StartupStage from "@/components/startup/StartupStage";
import AvailabilityWatcher from "@/components/AvailabilityWatcher";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { GlassProvider } from "@/components/glass/GlassProvider";
import { buildThemeBootScript, THEME_COLOR } from "@/components/theme/theme-script";
import { buildStartupBootScript } from "@/lib/startup/boot-script";
import { bootLaunch, launchState } from "@/lib/startup/launch";
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
    // The one declaration of the site icons (no hand-written <link> tags duplicate it). Before
    // paint the theme boot script replaces the rel="icon" links with the active theme's icon;
    // crawlers and no-JS clients read these. Google Search needs a multiple of 48 px (the 192 px
    // PNG; /favicon.ico also carries 48 px). The CMS icon may be an upload of any image type, so
    // no type is declared for it. The touch icon URL is versioned (?v=3) to retire the copies iOS
    // keeps of the previous artwork; the bare /apple-touch-icon.png also exists for clients that
    // probe the conventional path.
    icons: {
      icon: [
        { url: content.assets.faviconDark.url, sizes: "32x32" },
        { url: BUNDLED.faviconDarkLarge, sizes: "192x192", type: "image/png" },
        { url: BUNDLED.faviconIco },
      ],
      apple: [{ url: `${BUNDLED.appleTouchIcon}?v=3`, sizes: "180x180", type: "image/png" }],
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
  // the launch event as the startup boot script sees it; the window itself is compared with the
  // visitor's clock in the browser, so a cached page still stops showing it on time
  const launch = content.launchExperience;
  const launchView = launchState(launch, 0);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      data-favicon-light={content.assets.faviconLight.url}
      data-favicon-dark={content.assets.faviconDark.url}
    >
      <head>
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
        {/* the startup decision (Supernova, Signal Awakening or none), before first paint;
            nothing plays over the maintenance screen */}
        <script
          dangerouslySetInnerHTML={{
            __html: buildStartupBootScript(bootLaunch(launch), launchView.duration, !showMaintenance),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-viewport text-fg antialiased flex flex-col font-sans relative"
      >
        <ThemeProvider>
          <GlassProvider>
            {/* Rendered in the root shell so it covers the first paint (incl. streaming) and
                survives client navigation; it only plays what the boot script chose. */}
            <StartupStage
              title={launchView.title}
              subtitle={launch?.secondaryMessage ?? ""}
              durationS={launchView.duration}
              logo={content.global?.headerBrand === "logo" && content.assets.logoDark?.url ? { url: content.assets.logoDark.url, alt: content.assets.logoDark.alt } : null}
            />
            <OfflineDetector />
            <AvailabilityWatcher
              initialStatus={initialStatus}
              isServerFallback={showMaintenance}
              brandMode={content.global?.headerBrand === "logo" ? "logo" : "wordmark"}
              logos={{ light: content.assets.logoLight, dark: content.assets.logoDark }}
            />
            {children}
          </GlassProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

