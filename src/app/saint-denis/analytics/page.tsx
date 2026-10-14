import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import StudioHeader from "@/components/studio/StudioHeader";
import { Group, StatusLine } from "@/components/studio/fields";
import LaunchModeCard from "@/components/studio/LaunchModeCard";
import { LAUNCH_OFF, type LaunchConfig, type Report } from "@/lib/analytics/model";
import { getCollectionHealth, getLaunchConfigFresh } from "@/lib/analytics/store";
import { getRecordedAnalytics } from "@/lib/analytics/report";
import { countryName } from "@/lib/analytics/countries";

export const metadata = { title: "Analytics | RAWIN Studio" };
export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("en-IN");
const F_TIME = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export default async function StudioAnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/saint-denis/login?redirect=/saint-denis/analytics");

  let config: LaunchConfig = LAUNCH_OFF;
  let unreadable = false;
  try {
    config = await getLaunchConfigFresh();
  } catch {
    unreadable = true;
  }
  const [d1, d7, d30, health] = await Promise.all([
    getRecordedAnalytics("24h").catch(() => null),
    getRecordedAnalytics("7d").catch(() => null),
    getRecordedAnalytics("30d").catch(() => null),
    getCollectionHealth().catch(() => null),
  ]);
  const rows: [string, Report | null][] = [
    ["24 hours", d1],
    ["7 days", d7],
    ["30 days", d30],
  ];

  return (
    <div className="flex flex-col gap-4">
      <StudioHeader
        eyebrow="Analytics"
        title="Traffic and Launch Mode"
        actions={
          <Link href="/analytics" target="_blank" className="inline-flex items-center min-h-11 px-3.5 rounded-xl border border-line text-[14px] text-fg hover:border-line-strong">
            View public page
          </Link>
        }
      />

      <LaunchModeCard initial={config} unreadable={unreadable} />

      <Group title="Recorded traffic" description="Real visits only.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {rows.map(([label, r]) => (
            <div key={label} className="bg-surface p-4">
              <p className="label-mono text-fg-subtle">{label}</p>
              {r ? (
                <>
                  <p className="mt-2 font-display text-[2rem] leading-none tabular-nums text-fg">{n(r.visitors)}</p>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    visitors · {n(r.pageViews)} page views · {r.countries.length} countries
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[13.5px] text-danger">Could not be read.</p>
              )}
            </div>
          ))}
        </div>
        {d30 && d30.countries.length > 0 && (
          <p className="text-[13px] text-fg-muted">
            Top countries (30 days): {d30.countries.slice(0, 6).map((c) => `${countryName(c.code)} ${n(c.visitors)}`).join(" · ")}
          </p>
        )}
      </Group>

      <Group title="Collection health" defaultOpen={false}>
        {health ? (
          <ul className="flex flex-col divide-y divide-line text-[14px]">
            <li className="flex justify-between gap-3 py-2.5">
              <span>Stored page views (kept 90 days)</span>
              <span className="text-fg-muted tabular-nums">{n(health.stored)}</span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Received in the last 24 hours</span>
              <span className="text-fg-muted tabular-nums">{n(health.last24h)}</span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>Most recent</span>
              <span className="text-fg-muted">{health.newest ? `${F_TIME.format(new Date(health.newest))} IST` : "None yet"}</span>
            </li>
            <li className="flex justify-between gap-3 py-2.5">
              <span>With a known country</span>
              <span className="text-fg-muted tabular-nums">{health.stored ? `${Math.round((health.withCountry / health.stored) * 100)}%` : "—"}</span>
            </li>
          </ul>
        ) : (
          <StatusLine tone="error">The event store could not be read.</StatusLine>
        )}
      </Group>
    </div>
  );
}
