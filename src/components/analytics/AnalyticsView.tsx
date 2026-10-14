"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { youLine, type AnalyticsRange, type Report } from "@/lib/analytics/model";
import type { PublicAnalytics } from "@/lib/analytics/report";
import { countryName } from "@/lib/analytics/countries";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import WorldMap, { visitorsText } from "./WorldMap";
import TrafficChart from "./TrafficChart";
import "./analytics.css";

const RANGES: { id: AnalyticsRange; label: string; long: string }[] = [
  { id: "24h", label: "24H", long: "the last 24 hours" },
  { id: "7d", label: "7D", long: "the last 7 days" },
  { id: "30d", label: "30D", long: "the last 30 days" },
];
const REFRESH_MS = 90_000;
const STALE_MS = 60_000;
/** wall clock for event handlers and effects (never read during render) */
const clock = () => Date.now();
const n = (v: number) => v.toLocaleString("en-IN");

/** A number that eases to its new value (instant with reduced motion). */
function Figure({ value, digits = 0 }: { value: number; digits?: number }) {
  const reduced = useReducedMotionSafe();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <>{digits ? shown.toFixed(digits) : n(Math.round(shown))}</>;
}

export default function AnalyticsView({ initial }: { initial: PublicAnalytics }) {
  const [range, setRange] = useState<AnalyticsRange>(initial.range);
  const [data, setData] = useState<Partial<Record<AnalyticsRange, PublicAnalytics>>>({ [initial.range]: initial });
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const current = data[range];
  const launch = Boolean(current?.launch ?? initial.launch);

  // One request per period at a time. Each response replaces that period's whole report (one
  // snapshot for the figures, map, ranking and chart), and only the newest request for a period
  // may land: an older one still in flight is aborted, and a late answer is dropped by its number.
  // A period seen more than a minute ago is fetched again.
  const inflight = useRef(new Map<AnalyticsRange, { seq: number; ctrl: AbortController }>());
  const seq = useRef(0);
  const fetchedAt = useRef<Partial<Record<AnalyticsRange, number>>>({});
  useEffect(() => {
    fetchedAt.current[initial.range] ??= clock();
  }, [initial.range]);

  /** "ok", "skipped" (a request for that period is already running), "superseded" or an error. */
  const load = async (r: AnalyticsRange, { fresh = false } = {}): Promise<"ok" | "skipped" | "superseded" | "busy" | "failed"> => {
    const running = inflight.current.get(r);
    if (running && !fresh) return "skipped";
    running?.ctrl.abort();
    const mine = { seq: ++seq.current, ctrl: new AbortController() };
    inflight.current.set(r, mine);
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/summary?range=${r}${fresh ? "&fresh=1" : ""}`, { cache: "no-store", signal: mine.ctrl.signal });
      if (res.status === 429) return "busy";
      const json = (await res.json()) as PublicAnalytics;
      if (inflight.current.get(r)?.seq !== mine.seq) return "superseded";
      if (!json || typeof json.available !== "boolean") return "failed";
      fetchedAt.current[r] = clock();
      setData((d) => ({ ...d, [r]: json }));
      return json.available ? "ok" : "failed";
    } catch {
      // aborted by a newer request, or the network failed: keep what is shown
      return inflight.current.get(r)?.seq === mine.seq ? "failed" : "superseded";
    } finally {
      if (inflight.current.get(r)?.seq === mine.seq) inflight.current.delete(r);
      setLoading(inflight.current.size > 0);
    }
  };

  // Refresh traffic: a fresh read of the selected period (recorded figures read now; in Launch
  // Mode the simulation is recomputed for this moment from its preset and seed). A read only:
  // it never records a visit. One refresh at a time; the result or the error is announced.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  // a ref, not the state: clicks in the same tick all see it at once
  const refreshBusy = useRef(false);
  const refresh = async () => {
    if (refreshBusy.current) return;
    refreshBusy.current = true;
    setRefreshing(true);
    setRefreshNote(null);
    const outcome = await load(range, { fresh: true });
    refreshBusy.current = false;
    setRefreshing(false);
    if (outcome === "ok") setRefreshNote({ tone: "ok", text: `Updated ${new Date(clock()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` });
    else if (outcome === "busy") setRefreshNote({ tone: "error", text: "Refreshed a lot just now. Try again in a few seconds." });
    else if (outcome === "failed") setRefreshNote({ tone: "error", text: "Could not refresh. Try again." });
  };

  const choose = (r: AnalyticsRange) => {
    if (r === range) return;
    setRange(r);
    if (!data[r] || clock() - (fetchedAt.current[r] ?? 0) > STALE_MS) void load(r);
  };

  // While Launch Mode figures are moving: refresh about every 90 s (jittered), only while visible
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);
  useEffect(() => {
    if (!launch) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(async () => {
        if (document.visibilityState === "visible") await load(rangeRef.current);
        schedule();
      }, REFRESH_MS * (0.85 + Math.random() * 0.3));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [launch]);

  const report: Report | null = current?.report ?? null;
  const counts = useMemo(() => new Map((report?.countries ?? []).map((c) => [c.code, c.visitors])), [report]);
  const ranked = report?.countries ?? [];
  const top = ranked[0]?.visitors || 0;
  const visible = showAll ? ranked : ranked.slice(0, 7);
  const longRange = RANGES.find((r) => r.id === range)!.long;

  // phones: the wider map opens centred on South Asia
  const mapScroll = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = mapScroll.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth * 0.71 - el.clientWidth / 2;
  }, [report]);
  // the visitor's own country, carried by the shown dataset itself (the same report as the map,
  // the ranking and the figures, Launch Mode or not), so all three always agree
  const viewer = current?.you ?? null;
  const you = viewer?.country ?? null;
  const youName = you ? countryName(you) : null;
  // the country's own figure (the map's and the ranking's, unchanged); youLine counts the others
  const youCount = you ? counts.get(you) || 0 : 0;

  return (
    <div className="an-root">
      {/* ---------------------------------------------------------------- period + context
          One group: on phones the selector comes first with the period label right under it; on
          desktop the label sits left and the selector right (row-reverse keeps the DOM order). */}
      <div className="flex flex-col lg:flex-row-reverse lg:items-end lg:justify-between gap-2.5 lg:gap-10">
        <div role="radiogroup" aria-label="Reporting period" className="an-periods">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={range === r.id}
              aria-label={`Show ${r.long}`}
              onClick={() => choose(r.id)}
              className="an-period"
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="an-context min-w-0" aria-live="polite">
          Reporting {longRange}
          {loading && <span className="ml-2 text-fg-subtle">Updating…</span>}
        </p>
      </div>

      {!current || !current.available || !report ? (
        <div className="an-panel mt-8 p-8 text-center">
          <p className="text-fg">{current && !current.available ? "Analytics are unavailable right now." : "Loading…"}</p>
          {current && !current.available && <p className="mt-1 text-[14px] text-fg-muted">The figures could not be read. Try again in a moment.</p>}
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------------------- figures */}
          <dl className="an-metrics mt-8">
            <div>
              <dt>Visitors</dt>
              <dd>
                <Figure value={report.visitors} />
              </dd>
              <span className="an-note">Unique per day</span>
            </div>
            <div>
              <dt>Page views</dt>
              <dd>
                <Figure value={report.pageViews} />
              </dd>
              <span className="an-note">Pages opened</span>
            </div>
            <div>
              <dt>Views per visitor</dt>
              <dd>{report.visitors ? <Figure value={report.pageViews / report.visitors} digits={1} /> : "—"}</dd>
              <span className="an-note">Page views ÷ visitors</span>
            </div>
            <div>
              <dt>Countries</dt>
              <dd>
                <Figure value={ranked.length} />
              </dd>
              <span className="an-note">{report.unknownVisitors ? `+ ${n(report.unknownVisitors)} visitors, location unknown` : "With at least one visitor"}</span>
            </div>
          </dl>

          {/* ---------------------------------------------------------------- map + ranking */}
          <section aria-labelledby="an-geo" className="an-panel mt-5 grid lg:grid-cols-12">
            <div className="lg:col-span-8 p-4 sm:p-6 lg:border-r border-line min-w-0 flex flex-col">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id="an-geo" className="an-h2">
                  Where visitors come from
                </h2>
                {youName && (
                  <p className="an-you-note">
                    <span className="an-you-dot" aria-hidden="true" />
                    <span>
                      You&rsquo;re in <span className="an-you-place">{youName}</span>. {youLine(youCount, Boolean(viewer?.included))}
                      {viewer?.test && <span className="an-you-test">Dev test country, not detected</span>}
                    </span>
                  </p>
                )}
              </div>
              <div ref={mapScroll} className="an-map-scroll mt-5" tabIndex={-1}>
                <WorldMap
                  counts={counts}
                  you={you}
                  focus={focus}
                  picked={picked}
                  onPick={setPicked}
                  label={`World map of visitors over ${longRange}: ${ranked.length} countries. ${ranked.slice(0, 3).map((c) => `${countryName(c.code)} ${n(c.visitors)}`).join(", ")}. The country list beside it has every value.`}
                />
              </div>
              {/* under the map: a tapped or clicked country (works without hover), and Refresh traffic */}
              <div className="an-map-foot">
              <p className="an-pick" role="status">
                {picked ? (
                  <>
                    <span className="text-fg">{countryName(picked)}</span>
                    <span className="tabular-nums">{visitorsText(counts.get(picked) || 0)}</span>
                    <button type="button" onClick={() => setPicked(null)} className="an-pick-clear" aria-label={`Clear ${countryName(picked)}`}>
                      Clear
                    </button>
                  </>
                ) : (
                  <span className="text-fg-subtle">Tap or click a country for its visitors.</span>
                )}
              </p>
              <div className="an-refresh-row">
                <span className="an-refresh-note" role="status" data-tone={refreshNote?.tone}>
                  {refreshNote?.text}
                </span>
                <button type="button" onClick={refresh} className="an-refresh" aria-busy={refreshing} aria-disabled={refreshing} data-busy={refreshing || undefined}>
                  <RefreshCw className="an-refresh-icon" aria-hidden="true" />
                  {refreshing ? "Refreshing" : "Refresh traffic"}
                </button>
              </div>
              </div>
              <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-fg-subtle">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  Fewer visitors
                  {[1, 2, 3, 4, 5].map((l) => (
                    <i key={l} className="an-swatch" data-level={l} />
                  ))}
                  More visitors
                </span>
                {youName && (
                  <span className="flex items-center gap-1.5">
                    <i className="an-swatch an-swatch-you" aria-hidden="true" /> Your country
                  </span>
                )}
              </div>
            </div>
            <div className="lg:col-span-4 p-4 sm:p-6 border-t lg:border-t-0 border-line">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="an-h2">Countries</h2>
                <span className="label-mono text-fg-subtle">{ranked.length} total</span>
              </div>
              {ranked.length === 0 ? (
                <p className="mt-4 text-[14px] text-fg-muted">No located visits in this window.</p>
              ) : (
                <ol className="mt-4 flex flex-col">
                  {visible.map((c, i) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        className="an-rank"
                        onMouseEnter={() => setFocus(c.code)}
                        onMouseLeave={() => setFocus(null)}
                        onFocus={() => setFocus(c.code)}
                        onBlur={() => setFocus(null)}
                        onClick={() => setPicked(c.code)}
                        aria-label={`${countryName(c.code)}: ${n(c.visitors)} visitors${c.code === you ? " (your country)" : ""}`}
                      >
                        <span className="an-rank-i">{String(i + 1).padStart(2, "0")}</span>
                        <span className="an-rank-name">
                          {countryName(c.code)}
                          {c.code === you && <span className="an-you-tag">You</span>}
                        </span>
                        <span className="an-rank-n">{n(c.visitors)}</span>
                        <span className="an-rank-bar" style={{ transform: `scaleX(${top ? c.visitors / top : 0})` }} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {report.unknownVisitors > 0 && <p className="mt-3 text-[12.5px] text-fg-subtle">Location unknown: {n(report.unknownVisitors)} visitors</p>}
              {ranked.length > 7 && (
                <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-3 min-h-11 text-[13.5px] text-fg-muted hover:text-fg underline underline-offset-4">
                  {showAll ? "Show top 7" : `Show all ${ranked.length}`}
                </button>
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------- traffic */}
          <section aria-labelledby="an-traffic" className="an-panel mt-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="an-traffic" className="an-h2">
                Traffic
              </h2>
              <div className="flex items-center gap-4 text-[12.5px] text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <i className="an-key an-key-visitors" aria-hidden="true" /> Visitors
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="an-key an-key-views" aria-hidden="true" /> Page views
                </span>
              </div>
            </div>
            <div className="mt-4">
              <TrafficChart range={range} series={report.series} />
            </div>
            <p className="sr-only">
              Over {longRange}: {n(report.visitors)} visitors and {n(report.pageViews)} page views. Busiest{" "}
              {range === "24h" ? "hour" : "day"} had{" "}
              {n(Math.max(0, ...report.series.map((p) => p.visitors)))} visitors.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
