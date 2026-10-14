/**
 * RAWIN Analytics: pure model (no I/O). Reporting windows, the Launch Mode simulation, and the
 * combination of recorded and simulated figures. Everything here is deterministic for given
 * inputs, so it is unit-tested with an injected clock.
 *
 * Definitions
 *  - Page view: an accepted page-view event (validated, deduplicated per visitor, path and 10 s).
 *  - Visitor: a distinct daily pseudonymous code (it rotates every day, so a multi-day total is
 *    the sum of daily unique visitors; nobody is followed across days).
 *  - Days and hours follow India Standard Time (UTC+05:30, the site's timezone).
 *
 * Launch Mode (illustrative traffic, always disclosed on the page)
 *  - The selected preset P is a ceiling: the simulated 30-day visitor total is P × u × m(t) with
 *    u ∈ [0.62, 0.90) fixed by the seed and m(t) ∈ [0.965, 1.035] a slow, smooth fluctuation, so
 *    it always stays below P. Shorter windows are shares of the same hourly series.
 *  - All values derive from (preset, seed, time): every server instance computes the same figures,
 *    nothing is written as they move, and nothing simulated ever enters the recorded events.
 */

import { normalizeCountryCode } from "./countries";

export const ANALYTICS_RANGES = ["24h", "7d", "30d"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const LAUNCH_PRESETS = [500, 1000, 1500, 2000, 2500, 3000] as const;
export type LaunchPreset = (typeof LAUNCH_PRESETS)[number];

export function isLaunchPreset(v: unknown): v is LaunchPreset {
  return typeof v === "number" && (LAUNCH_PRESETS as readonly number[]).includes(v);
}

export interface LaunchConfig {
  enabled: boolean;
  preset: LaunchPreset;
  /** fixes the simulated baseline and country mix; renewed when Launch Mode starts or the preset changes */
  seed: number;
  startedAt: string | null;
}

export const LAUNCH_OFF: LaunchConfig = { enabled: false, preset: 500, seed: 1, startedAt: null };

export function normalizeLaunchConfig(raw: unknown): LaunchConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const preset = isLaunchPreset(r.preset) ? r.preset : 500;
  const seed = typeof r.seed === "number" && Number.isFinite(r.seed) ? Math.abs(Math.floor(r.seed)) % 2147483647 || 1 : 1;
  return { enabled: r.enabled === true, preset, seed, startedAt: typeof r.startedAt === "string" ? r.startedAt : null };
}

/* ------------------------------------------------------------------ time */

export const IST_OFFSET_MS = 330 * 60 * 1000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** "YYYY-MM-DD" of the IST calendar day containing `ms`. */
export function istDay(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}
/** Start (UTC ms) of the IST day containing `ms`. */
export function istDayStart(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / DAY) * DAY - IST_OFFSET_MS;
}
/** Start of the hour containing `ms` (IST hours share UTC's hour boundaries except for the :30 offset). */
export function istHourStart(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / HOUR) * HOUR - IST_OFFSET_MS;
}

export interface Bucket {
  /** bucket start (UTC ms) */
  start: number;
  /** bucket end (exclusive) */
  end: number;
}

/** 24h → the 24 hours ending with the current one; 7d / 30d → IST days ending with today. */
export function bucketsFor(range: AnalyticsRange, now: number): Bucket[] {
  if (range === "24h") {
    const cur = istHourStart(now);
    return Array.from({ length: 24 }, (_, i) => ({ start: cur - (23 - i) * HOUR, end: cur - (22 - i) * HOUR }));
  }
  const days = range === "7d" ? 7 : 30;
  const today = istDayStart(now);
  return Array.from({ length: days }, (_, i) => ({ start: today - (days - 1 - i) * DAY, end: today - (days - 2 - i) * DAY }));
}

export function rangeStart(range: AnalyticsRange, now: number): number {
  return bucketsFor(range, now)[0].start;
}

/* ------------------------------------------------------------------ deterministic noise */

/** 32-bit integer hash → [0, 1). */
export function hash01(...parts: number[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    let x = Math.floor(p) | 0;
    for (let i = 0; i < 4; i++) {
      h ^= x & 0xff;
      h = Math.imul(h, 16777619) >>> 0;
      x >>>= 8;
    }
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Smooth value noise in [-1, 1]: hashed values every `period` ms, cosine-interpolated. */
function smoothNoise(seed: number, salt: number, t: number, period: number): number {
  const k = Math.floor(t / period);
  const f = t / period - k;
  const a = hash01(seed, salt, k) * 2 - 1;
  const b = hash01(seed, salt, k + 1) * 2 - 1;
  const w = (1 - Math.cos(Math.PI * f)) / 2;
  return a + (b - a) * w;
}

/** The slow fluctuation m(t) ∈ [0.965, 1.035]: two incommensurate periods, so it never repeats visibly. */
export function fluctuation(seed: number, t: number): number {
  const n = 0.65 * smoothNoise(seed, 11, t, 47 * 60_000) + 0.35 * smoothNoise(seed, 23, t, 13 * 60_000);
  return 1 + 0.035 * n;
}

/** Share of the 30-day visitor ceiling this seed settles on: [0.62, 0.90). */
export function baselineShare(seed: number): number {
  return 0.62 + 0.28 * hash01(seed, 3);
}

/** Relative weight of one hour of simulated traffic: IST daily rhythm × day character × noise. */
function hourWeight(seed: number, hourStart: number): number {
  const istHour = new Date(hourStart + IST_OFFSET_MS).getUTCHours();
  // quiet nights, a morning rise, a long evening peak (IST)
  const rhythm = 0.25 + 0.75 * Math.max(0, Math.sin(((istHour - 6) / 24) * Math.PI * 2 * 0.55 + 0.15)) + (istHour >= 19 && istHour <= 23 ? 0.35 : 0);
  const dayIdx = Math.floor((hourStart + IST_OFFSET_MS) / DAY);
  const weekday = new Date(hourStart + IST_OFFSET_MS).getUTCDay();
  const dayChar = (weekday === 0 || weekday === 6 ? 0.82 : 1) * (0.78 + 0.44 * hash01(seed, 5, dayIdx));
  const noise = 0.8 + 0.4 * hash01(seed, 7, Math.floor(hourStart / HOUR));
  return rhythm * dayChar * noise;
}

/** Page views per visitor for one hour of simulated traffic: [1.45, 2.6). */
function viewsPerVisitor(seed: number, hourStart: number): number {
  return 1.45 + 1.15 * hash01(seed, 9, Math.floor(hourStart / HOUR));
}

/* ------------------------------------------------------------------ simulated countries */

/** Countries the illustrative mix may use besides India (Pakistan is deliberately not included). */
export const SIM_COUNTRY_POOL = [
  "US", "GB", "DE", "CA", "AE", "SG", "AU", "NL", "FR", "JP", "BD", "NP", "LK", "SA", "QA", "ID", "MY", "IE",
  "SE", "CH", "IT", "ES", "BR", "ZA", "KR", "NZ", "PL", "FI", "NO", "DK", "PT", "TR", "KE", "NG", "MX", "PH",
  "VN", "TH", "EG", "IL", "BE", "AT", "CZ", "RO", "AR",
] as const;

export interface CountryShare {
  code: string;
  share: number;
}

/** The seed's country mix: India first (36–46 %), then 16–24 countries with a long-tail decline. */
export function simulatedCountryMix(seed: number): CountryShare[] {
  const india = 0.36 + 0.1 * hash01(seed, 101);
  // (defensive: neither India, placed first, nor Pakistan can enter the generated tail)
  const pool: string[] = [...SIM_COUNTRY_POOL].filter((c: string) => c !== "PK" && c !== "IN");
  // deterministic shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(hash01(seed, 103, i) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = 16 + Math.floor(hash01(seed, 107) * 9);
  const picked = pool.slice(0, count);
  const raw = picked.map((_, i) => (1 / Math.pow(i + 1.6, 1.05)) * (0.85 + 0.3 * hash01(seed, 109, i)));
  const sum = raw.reduce((a, b) => a + b, 0);
  const rest = 1 - india;
  // keep every other country below India
  const shares = raw.map((r) => Math.min((r / sum) * rest, india * 0.6));
  const norm = shares.reduce((a, b) => a + b, 0);
  return [{ code: "IN", share: india }, ...picked.map((code, i) => ({ code, share: (shares[i] / norm) * rest }))];
}

/* ------------------------------------------------------------------ reports */

export interface SeriesPoint {
  start: number;
  visitors: number;
  pageViews: number;
}

export interface CountryCount {
  code: string;
  visitors: number;
}

export interface Report {
  range: AnalyticsRange;
  visitors: number;
  pageViews: number;
  series: SeriesPoint[];
  /** known countries, descending by visitors */
  countries: CountryCount[];
  /** visitors whose country could not be determined */
  unknownVisitors: number;
}

export function emptyReport(range: AnalyticsRange, now: number): Report {
  return { range, visitors: 0, pageViews: 0, series: bucketsFor(range, now).map((b) => ({ start: b.start, visitors: 0, pageViews: 0 })), countries: [], unknownVisitors: 0 };
}

/** Integers summing to round(Σ values), by largest remainder. */
function apportion(values: number[]): number[] {
  const total = Math.round(values.reduce((a, b) => a + b, 0));
  const floors = values.map(Math.floor);
  let left = total - floors.reduce((a, b) => a + b, 0);
  const order = values.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

/**
 * The simulated report for a range at time `now`. The 30-day visitor total is
 * preset × baselineShare(seed) × fluctuation(now), spread over the last 30 IST days by the hourly
 * weights (the current hour counts in proportion to the minutes elapsed).
 */
export function simulateReport(config: Pick<LaunchConfig, "preset" | "seed">, range: AnalyticsRange, now: number): Report {
  const { preset, seed } = config;
  const windowStart = rangeStart("30d", now);
  const curHour = istHourStart(now);
  const elapsed = (now - curHour) / HOUR;
  // hourly weights over the 30-day window
  const hours: { start: number; w: number }[] = [];
  let total = 0;
  for (let h = windowStart; h <= curHour; h += HOUR) {
    const w = hourWeight(seed, h) * (h === curHour ? elapsed : 1);
    hours.push({ start: h, w });
    total += w;
  }
  const visitors30 = preset * baselineShare(seed) * fluctuation(seed, now);
  const perWeight = total > 0 ? visitors30 / total : 0;

  const buckets = bucketsFor(range, now);
  const rawV = buckets.map(() => 0);
  const rawP = buckets.map(() => 0);
  let bi = 0;
  for (const h of hours) {
    while (bi < buckets.length && h.start >= buckets[bi].end) bi++;
    if (bi >= buckets.length) break;
    if (h.start < buckets[bi].start) continue;
    const v = h.w * perWeight;
    rawV[bi] += v;
    rawP[bi] += v * viewsPerVisitor(seed, h.start);
  }
  const vs = apportion(rawV);
  const ps = apportion(rawP).map((p, i) => Math.max(p, vs[i]));
  const visitors = vs.reduce((a, b) => a + b, 0);
  const pageViews = ps.reduce((a, b) => a + b, 0);
  const mix = simulatedCountryMix(seed);
  const perCountry = apportion(mix.map((m) => m.share * visitors));
  const countries = mix.map((m, i) => ({ code: m.code, visitors: perCountry[i] })).filter((c) => c.visitors > 0);
  countries.sort((a, b) => b.visitors - a.visitors || (a.code === "IN" ? -1 : b.code === "IN" ? 1 : a.code.localeCompare(b.code)));
  return { range, visitors, pageViews, series: buckets.map((b, i) => ({ start: b.start, visitors: vs[i], pageViews: ps[i] })), countries, unknownVisitors: 0 };
}

/** Recorded + simulated, bucket by bucket and country by country (nothing is counted twice). */
export function combineReports(recorded: Report, simulated: Report | null): Report {
  if (!simulated) return recorded;
  const byCode = new Map<string, number>();
  for (const c of [...recorded.countries, ...simulated.countries]) byCode.set(c.code, (byCode.get(c.code) || 0) + c.visitors);
  const countries = [...byCode.entries()].map(([code, visitors]) => ({ code, visitors })).sort((a, b) => b.visitors - a.visitors || a.code.localeCompare(b.code));
  return {
    range: recorded.range,
    visitors: recorded.visitors + simulated.visitors,
    pageViews: recorded.pageViews + simulated.pageViews,
    series: recorded.series.map((p, i) => ({ start: p.start, visitors: p.visitors + (simulated.series[i]?.visitors || 0), pageViews: p.pageViews + (simulated.series[i]?.pageViews || 0) })),
    countries,
    unknownVisitors: recorded.unknownVisitors,
  };
}

/* ------------------------------------------------------------------ recorded aggregation */

/** One aggregated row from the event store: a visitor's page views in one hour. */
export interface VisitRow {
  /** hour start (UTC ms) */
  hour: number;
  /** IST day of the visit */
  day: string;
  visitor: string;
  country: string | null;
  views: number;
}

/** The recorded report for a range from visit rows (visitors = distinct (day, visitor) pairs). */
export function recordedReport(rows: VisitRow[], range: AnalyticsRange, now: number): Report {
  const buckets = bucketsFor(range, now);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const bucketVisitors = buckets.map(() => new Set<string>());
  const bucketViews = buckets.map(() => 0);
  const all = new Set<string>();
  const byCountry = new Map<string, Set<string>>();
  const unknown = new Set<string>();
  let views = 0;
  for (const r of rows) {
    if (r.hour < start || r.hour >= end) continue;
    const i = buckets.findIndex((b) => r.hour >= b.start && r.hour < b.end);
    if (i < 0) continue;
    const id = `${r.day}|${r.visitor}`;
    bucketVisitors[i].add(id);
    bucketViews[i] += r.views;
    views += r.views;
    all.add(id);
    if (r.country) {
      if (!byCountry.has(r.country)) byCountry.set(r.country, new Set());
      byCountry.get(r.country)!.add(id);
    } else unknown.add(id);
  }
  return {
    range,
    visitors: all.size,
    pageViews: views,
    series: buckets.map((b, i) => ({ start: b.start, visitors: bucketVisitors[i].size, pageViews: bucketViews[i] })),
    countries: [...byCountry.entries()].map(([code, s]) => ({ code, visitors: s.size })).sort((a, b) => b.visitors - a.visitors || a.code.localeCompare(b.code)),
    unknownVisitors: unknown.size,
  };
}

/* ------------------------------------------------------------------ event validation */

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|okhttp|phantom|puppeteer|playwright|selenium/i;

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 12) return true;
  return BOT_UA.test(userAgent);
}

/** A trackable public path: absolute, short, no query or fragment, not Studio, API or framework. */
export function cleanTrackPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 200) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0];
  if (!/^\/[A-Za-z0-9\-._~/%]*$/.test(path)) return null;
  if (/^\/(saint-denis|admin|api|_next|maintenance|__rawin)/.test(path)) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : "/";
}

/**
 * ISO 3166-1 alpha-2 from Netlify's geo header value, or null. The format is the platform's own:
 * base64 of UTF-8 JSON, `{ country: { code, name }, city, … }`, decoded the way Netlify's function
 * runtime builds `context.geo`. Placeholder or unknown codes give null (never a guess).
 */
export function countryFromGeoHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    const text = typeof Buffer !== "undefined" ? Buffer.from(value, "base64").toString("utf8") : new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)));
    return normalizeCountryCode(JSON.parse(text)?.country?.code);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ the current visitor */

/**
 * The person viewing the public page, as the hosting platform reports them. `code` is today's
 * visitor code, present only when this visit is one the collector will record (edge request, not
 * a bot, not the signed-in owner); it is compared with the stored codes and never leaves the server.
 */
export interface Viewer {
  country: string;
  code: string | null;
  /** a development-only test country (ANALYTICS_DEV_COUNTRY), not a detected location */
  test?: true;
}

/**
 * Counts the viewer's own visit in the recorded report exactly once. The visitors in a report are
 * distinct (IST day, visitor code) pairs, so:
 *  - today's code is already stored: nothing is added (the visit is counted under the stored
 *    country, which is "you" only if it matches);
 *  - not stored yet but this visit will be recorded (the tracker posts just after the page loads,
 *    and stored figures are read through a one-minute cache): it is added once, as the collector
 *    will add it (one visitor, one page view, the current bucket, the viewer's country);
 *  - otherwise (owner, bot) the visit never counts and nothing is added.
 * Applied to recorded figures only, before any Launch Mode simulation is combined in.
 */
export function includeViewer(recorded: Report, rows: VisitRow[], viewer: Viewer | null, now: number): { report: Report; included: boolean } {
  if (!viewer?.code) return { report: recorded, included: false };
  const today = istDay(now);
  const mine = rows.filter((r) => r.day === today && r.visitor === viewer.code);
  if (mine.length > 0) return { report: recorded, included: mine.some((r) => r.country === viewer.country) };
  const last = recorded.series.length - 1;
  const countries = recorded.countries.some((c) => c.code === viewer.country)
    ? recorded.countries.map((c) => (c.code === viewer.country ? { ...c, visitors: c.visitors + 1 } : c))
    : [...recorded.countries, { code: viewer.country, visitors: 1 }];
  countries.sort((a, b) => b.visitors - a.visitors || a.code.localeCompare(b.code));
  return {
    report: {
      ...recorded,
      visitors: recorded.visitors + 1,
      pageViews: recorded.pageViews + 1,
      series: recorded.series.map((p, i) => (i === last ? { ...p, visitors: p.visitors + 1, pageViews: p.pageViews + 1 } : p)),
      countries,
    },
    included: true,
  };
}

/** The personal line beside the map: the count is the map's and the ranking's own figure. */
export function youLine(count: number, included: boolean): string {
  if (count <= 0) return "No visitors came from there in this period.";
  if (included && count === 1) return "You’re the only visitor from there in this period.";
  return `${count.toLocaleString("en-IN")} ${count === 1 ? "visitor" : "visitors"} came from there too.`;
}
