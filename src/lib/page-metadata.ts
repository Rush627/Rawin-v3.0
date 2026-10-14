import type { Metadata } from "next";
import { getSiteContent } from "./site-content";
import { seoFor, type SeoPageKey } from "./cms/fields";

/**
 * Metadata for a public page: the CMS SEO override (Site Content → SEO) or the page's shipped
 * wording, a canonical URL for the page itself and matching Open Graph fields.
 */
export async function pageMetadata(key: SeoPageKey, path: string): Promise<Metadata> {
  const content = await getSiteContent();
  const { title, description } = seoFor(content.seo, key);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: content.global.brandName },
  };
}
