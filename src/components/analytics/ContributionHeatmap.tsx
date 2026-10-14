"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ContributionDay, GithubActivity, UnavailableReason } from "@/lib/analytics/github";

const F_MONTH = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });
const F_DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const REASON: Record<UnavailableReason, string> = {
  "not-configured": "The contribution history isn't connected yet.",
  "rate-limited": "GitHub is limiting requests right now. The history will return shortly.",
  timeout: "GitHub didn't respond in time. The history will return shortly.",
  upstream: "GitHub couldn't be reached right now.",
  "not-found": "GitHub has no profile at the linked address.",
  "no-profile": "No GitHub profile is set.",
  "invalid-profile": "The GitHub profile link isn't a profile address.",
};

const contributions = (n: number) => `${n.toLocaleString("en-IN")} contribution${n === 1 ? "" : "s"}`;
const dayText = (d: ContributionDay) => `${contributions(d.count)} on ${F_DAY.format(new Date(d.date))}`;

/** GitHub's real contribution calendar (the profile's last year), or an honest unavailable state. */
export default function ContributionHeatmap({ activity }: { activity: GithubActivity }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [day, setDay] = useState<ContributionDay | null>(null);
  // narrow screens scroll inside the panel; start at the most recent weeks
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const days = useMemo(() => (activity.status === "ok" ? activity.weeks.flat() : []), [activity]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const summary = useMemo(() => {
    if (!days.length) return "";
    const active = days.filter((d) => d.count > 0).length;
    const busiest = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]);
    const span = `${F_DAY.format(new Date(days[0].date))} to ${F_DAY.format(new Date(days[days.length - 1].date))}`;
    return `${active} active days from ${span}.${busiest.count ? ` Busiest: ${dayText(busiest)}.` : ""}`;
  }, [days]);

  const profile = activity.profileUrl;
  const name = activity.username;
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const date = (e.target as HTMLElement).dataset?.date;
    if (date) setDay(byDate.get(date) ?? null);
  };

  return (
    <section aria-labelledby="an-github" className="an-panel mt-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="an-github" className="an-h2">
          Building in public
        </h2>
        {profile && name && (
          <a href={profile} target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-fg-muted hover:text-fg link-draw">
            github.com/{name}
          </a>
        )}
      </div>

      {activity.status !== "ok" ? (
        <p className="mt-4 text-[14px] text-fg-muted">{REASON[activity.reason] || "The contribution history is unavailable right now."}</p>
      ) : days.length === 0 ? (
        <p className="mt-4 text-[14px] text-fg-muted">GitHub returned no contribution days for the last year.</p>
      ) : (
        <>
          <p className="mt-1 text-[14px] text-fg-muted">{contributions(activity.total)} in the last year, as counted on the GitHub profile</p>
          <p className="sr-only">{summary}</p>
          <div ref={scroller} className="an-heat-scroll mt-5 overflow-x-auto overscroll-x-contain pb-2" tabIndex={0} aria-label="Contribution calendar, scrollable">
            <div className="an-heat" aria-hidden="true">
              <div className="an-heat-months">
                {activity.weeks.map((w, i) => {
                  const first = w[0];
                  const show = first && (i === 0 || new Date(first.date).getUTCDate() <= 7);
                  return <span key={i}>{show ? F_MONTH.format(new Date(first.date)) : ""}</span>;
                })}
              </div>
              <div className="an-heat-grid" onPointerOver={pick} onPointerDown={pick} onPointerLeave={(e) => e.pointerType !== "touch" && setDay(null)}>
                {activity.weeks.map((w, i) => (
                  <div key={i} className="an-heat-week">
                    {w.map((d) => (
                      <i key={d.date} data-date={d.date} data-level={d.level} data-on={day?.date === d.date || undefined} title={dayText(d)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[12px] text-fg-subtle">
            <p className="min-h-5 tabular-nums" aria-hidden="true">
              {day ? <span className="text-fg-muted">{dayText(day)}</span> : "Point at or tap a day for its count."}
            </p>
            <p className="flex items-center gap-1.5" aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <i key={l} className="an-heat-key" data-level={l} />
              ))}
              More
            </p>
          </div>
        </>
      )}
    </section>
  );
}
