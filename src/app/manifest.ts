import type { MetadataRoute } from "next";
import { getSiteContent, DEFAULT_SITE_CONTENT } from "@/lib/site-content";

export const dynamic = "force-dynamic";

/**
 * Web application manifest providing Android browsers and PWAs
 * with canonical RAWIN brand icons and application metadata.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const content = (await getSiteContent().catch(() => null)) ?? DEFAULT_SITE_CONTENT;
  const brandName = content.global?.brandName?.trim() || "RAWIN";
  const siteTitle = content.global?.siteTitle?.trim() || "Independent Developer";
  const shortBio =
    content.global?.shortBio?.trim() ||
    "Independent developer, system designer & visual builder";

  return {
    name: `${brandName} · ${siteTitle}`,
    short_name: brandName,
    description: shortBio,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    icons: [
      {
        src: "/brand/favicon-dark-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/favicon-dark-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/favicon-dark-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
