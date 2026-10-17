import RawinErrorView from "@/components/RawinErrorView";
import SystemScreenBoot from "@/components/system/SystemScreenBoot";
import { shortenPageLifetimeForUnavailable } from "@/lib/site-content";

/**
 * Shown in place of a public page (or the whole public shell) when its content cannot be read:
 * the database is unreachable and nothing is cached. A static page cannot answer with an error
 * (Next.js replies to a failed static render with a bare HTTP 500), and it must not be rendered
 * from empty data (that would be cached as if it were the real page), so it renders this screen
 * instead, cached for UNAVAILABLE_PAGE_TTL seconds only.
 */
export default async function ContentUnavailable() {
  await shortenPageLifetimeForUnavailable();
  return (
    <>
      <SystemScreenBoot />
      <RawinErrorView
        code="503"
        title="Site temporarily unavailable"
        message="RAWIN cannot load its content right now. Please try again in a moment."
        actionLabel="Refresh"
      />
    </>
  );
}
