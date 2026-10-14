"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AnalyticsRange, SeriesPoint } from "@/lib/analytics/model";

const IST = "Asia/Kolkata";
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...o });
const F_HOUR = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const F_DAY = fmt({ day: "numeric", month: "short" });
const F_WEEKDAY = fmt({ weekday: "short", day: "numeric" });
const F_FULL_HOUR = fmt({ weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const F_FULL_DAY = fmt({ weekday: "long", day: "numeric", month: "long" });

export function bucketLabel(range: AnalyticsRange, start: number, full = false): string {
  if (range === "24h") return full ? `${F_FULL_HOUR.format(start)} IST` : F_HOUR.format(start);
  if (full) return F_FULL_DAY.format(start);
  return range === "7d" ? F_WEEKDAY.format(start) : F_DAY.format(start);
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

/**
 * Visitors (ivory area) and page views (lavender line) per bucket. Pointer or arrow keys pick a
 * bucket; the reading is announced. A plain-text summary follows for assistive technology.
 */
export default function TrafficChart({ range, series }: { range: AnalyticsRange; series: SeriesPoint[] }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = width < 520 ? 200 : 250;
  const pad = { l: 34, r: 8, t: 12, b: 26 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = useMemo(() => niceMax(Math.max(0, ...series.map((p) => Math.max(p.visitors, p.pageViews)))), [series]);
  const x = (i: number) => pad.l + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const line = (key: "visitors" | "pageViews") => series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join("");
  const area = `${line("visitors")}L${x(series.length - 1).toFixed(1)} ${y(0)}L${x(0).toFixed(1)} ${y(0)}Z`;
  const empty = series.every((p) => p.visitors === 0 && p.pageViews === 0);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const every = range === "24h" ? (width < 520 ? 6 : 4) : range === "7d" ? 1 : width < 520 ? 7 : 5;

  const pick = (clientX: number) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r || !series.length) return;
    const rel = clientX - r.left - pad.l;
    setActive(Math.max(0, Math.min(series.length - 1, Math.round((rel / innerW) * (series.length - 1)))));
  };
  const a = active !== null ? series[active] : null;

  return (
    <div className="an-chart">
      <div
        ref={wrap}
        className="relative w-full outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-accent"
        tabIndex={0}
        role="group"
        aria-label="Traffic chart. Use the left and right arrow keys to read each point."
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setActive((i) => Math.max(0, Math.min(series.length - 1, (i ?? series.length) + (e.key === "ArrowRight" ? 1 : -1))));
          }
        }}
      >
        <svg width={width} height={height} className="block" aria-hidden="true">
          <defs>
            <linearGradient id={`${gid}-v`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--fg)", stopOpacity: 0.16 }} />
              <stop offset="1" style={{ stopColor: "var(--fg)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="an-grid" />
              <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" className="an-axis">
                {t.toLocaleString("en-IN")}
              </text>
            </g>
          ))}
          {series.map((p, i) =>
            i % every === (series.length - 1) % every ? (
              <text key={p.start} x={x(i)} y={height - 8} textAnchor="middle" className="an-axis">
                {bucketLabel(range, p.start)}
              </text>
            ) : null
          )}
          {!empty && (
            <>
              <path d={area} fill={`url(#${gid}-v)`} />
              <path d={line("pageViews")} className="an-line-views" />
              <path d={line("visitors")} className="an-line-visitors" />
            </>
          )}
          {a && active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + innerH} className="an-rule" />
              <circle cx={x(active)} cy={y(a.pageViews)} r="3.5" className="an-dot-views" />
              <circle cx={x(active)} cy={y(a.visitors)} r="3.5" className="an-dot-visitors" />
            </g>
          )}
        </svg>
        {empty && (
          <p className="absolute inset-0 flex items-center justify-center text-[13.5px] text-fg-muted pointer-events-none">No visits recorded in this window yet.</p>
        )}
        {a && active !== null && (
          <div
            className="an-tip pointer-events-none absolute"
            style={{ left: Math.min(Math.max(x(active) - 80, 0), width - 170), top: 0 }}
            aria-live="polite"
          >
            <span className="text-fg">{bucketLabel(range, a.start, true)}</span>
            <span className="tabular-nums">
              <i className="an-key an-key-visitors" /> {a.visitors.toLocaleString("en-IN")} visitors
            </span>
            <span className="tabular-nums">
              <i className="an-key an-key-views" /> {a.pageViews.toLocaleString("en-IN")} page views
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
