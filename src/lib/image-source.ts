/**
 * Whether next/image may optimize a CMS image source: same-origin paths only (the GridFS routes
 * under /api, bundled files under /public). Those are resized to the rendered width and served
 * as WebP/AVIF (on Netlify by its Image CDN, billed as bandwidth only): a project preview stored
 * as a 1.98 MB PNG is served as a 24 KB WebP at 1080 px. Any other source (a pasted external
 * URL) is passed through unoptimized, as before, since it is not in images.remotePatterns.
 * The CMS accepts PNG, JPEG and WebP only (lib/brand-assets.ts), never SVG.
 */
export function optimizableImage(src: string | null | undefined): boolean {
  return typeof src === "string" && src.startsWith("/") && !src.startsWith("//");
}

/** Quality for interface screenshots (fine UI text); next.config.ts images.qualities lists it. */
export const SCREENSHOT_QUALITY = 85;
