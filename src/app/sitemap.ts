import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getProjects } from "@/lib/projects";
import { getPublishedPosts } from "@/lib/blog";

// Regenerated at most hourly from the same cached reads the pages use (and refreshed sooner
// when a project or article save invalidates them). Read-only.
export const revalidate = 3600;

const STATIC_ROUTES = ["/", "/about", "/projects", "/blog", "/uses", "/resume", "/contact", "/analytics", "/ai"];

/**
 * Canonical public URLs only: the static pages, every project (all of them are listed on
 * /projects) and the published articles. Drafts, archived articles, admin, API and internal
 * routes are never included. If the records cannot be read this throws (an error response),
 * so an incomplete list is never served or cached as the sitemap. No lastModified: the record
 * mappers substitute "now" for a missing timestamp, so the dates could not be trusted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPublishedPosts()]);
  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` })),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${encodeURIComponent(p.slug)}` })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}` })),
  ];
}
