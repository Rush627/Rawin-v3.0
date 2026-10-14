import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * Everything public may be crawled. Private pages are protected by sign-in and marked noindex
 * themselves; they are deliberately not listed here, since robots.txt is public.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
