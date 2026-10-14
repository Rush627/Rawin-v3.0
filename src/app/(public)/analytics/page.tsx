import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import PageIntro from "@/components/system/PageIntro";
import AnalyticsView from "@/components/analytics/AnalyticsView";
import ContributionHeatmap from "@/components/analytics/ContributionHeatmap";
import HeroInstrument from "@/components/analytics/HeroInstrument";
import { getPublicAnalytics } from "@/lib/analytics/report";
import { getGithubActivity } from "@/lib/analytics/github";
import { viewerFromRequest } from "@/lib/analytics/viewer";
import { SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Analytics · Visitors and Activity on RAWIN",
  description: "Visitors, page views and the countries they come from, plus a year of GitHub activity, published openly for RAWIN.",
  alternates: { canonical: "/analytics" },
};

// The visitor's own country comes from this request's headers, so the page renders per request
export const dynamic = "force-dynamic";

async function GithubSection({ profileUrl }: { profileUrl: string }) {
  const activity = await getGithubActivity(profileUrl);
  return (
    <div className="an-root">
      <ContributionHeatmap activity={activity} />
    </div>
  );
}

export default async function AnalyticsPage() {
  const [h, jar] = await Promise.all([headers(), cookies()]);
  // the visitor's own country, from Netlify's edge headers only (none: no country is shown)
  const viewer = viewerFromRequest(h, jar.get(SESSION_COOKIE_NAME)?.value);
  const [initial, content] = await Promise.all([getPublicAnalytics("7d", viewer), getSiteContent()]);

  return (
    <div className="flex flex-col">
      <PageIntro
        index="07"
        eyebrow="Analytics"
        title={[<span key="l0">Traffic,</span>, <em key="e" className="italic text-accent">in the open</em>]}
        oneLineOnPhone="Traffic, in the open"
        lede="Who visits RAWIN and from where, counted without cookies, alongside the work that keeps it moving."
        aside={<HeroInstrument />}
      />
      <section aria-label="Site analytics" className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 mt-12 sm:mt-16">
        <AnalyticsView initial={initial} />
        <Suspense
          fallback={
            <div className="mt-5 rounded-[22px] border border-line p-6 text-[14px] text-fg-muted" aria-busy="true">
              Loading GitHub activity…
            </div>
          }
        >
          <GithubSection profileUrl={content.contact?.socials?.github || ""} />
        </Suspense>
        {/* every claim matches the code: the tracker sets no cookie, no address or user agent is
            stored (store.ts), the country comes only from Netlify's geo header, and a TTL index
            removes records after 90 days */}
        <p className="mt-6 mb-4 max-w-[80ch] text-[12.5px] leading-relaxed text-fg-subtle">
          Privacy-conscious analytics: no tracking cookies and no stored IP addresses. Countries come from hosting metadata; records are kept for 90 days.
        </p>
      </section>
    </div>
  );
}
