import { revalidateTag, updateTag } from "next/cache";

/**
 * Immediately purges cached entries associated with the specified cache tag.
 *
 * In Next.js 16:
 * - updateTag(tag) provides immediate invalidation when invoked inside Server Actions.
 * - Outside Server Actions (e.g. Route Handlers or internal scripts), updateTag throws error E872,
 *   so we gracefully fall back to revalidateTag(tag, { expire: 0 }) or revalidateTag(tag).
 *
 * Never passes "max" as the profile, because "max" in Next.js 16 assigns a 1-year stale-while-revalidate
 * duration instead of purging immediately.
 */
export function invalidateCacheTag(tag: string): void {
  try {
    updateTag(tag);
  } catch {
    // Expected outside of Server Actions
  }
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    // Suppress outside of active Next.js request context
  }
}
