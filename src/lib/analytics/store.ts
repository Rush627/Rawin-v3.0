import { createHmac } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getDatabase } from "../mongodb";
import { istDay, istHourStart, LAUNCH_OFF, normalizeLaunchConfig, type LaunchConfig, type VisitRow } from "./model";

/**
 * Recorded analytics (server only). One document per accepted page view in `analytics_events`:
 *   { _id: dedupe key, ts, h: IST hour start, d: IST day, p: path, v: daily visitor code, c: country|null }
 * No IP address, user agent, cookie or other identifier is stored; documents expire after 90 days.
 * Launch Mode settings live in site_content.analytics; simulated traffic is computed, never stored.
 */

const EVENTS = "analytics_events";
const RETENTION_DAYS = 90;
export const ANALYTICS_EVENTS_TAG = "analytics-events";
export const ANALYTICS_CONFIG_TAG = "analytics-config";

let indexesReady: Promise<void> | null = null;
async function ensureIndexes() {
  const db = await getDatabase();
  if (!db) return;
  if (!indexesReady) {
    const col = db.collection(EVENTS);
    indexesReady = Promise.all([
      col.createIndex({ ts: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86400 }),
      col.createIndex({ h: 1 }),
    ])
      .then(() => undefined)
      .catch(() => {
        indexesReady = null;
      });
  }
  return indexesReady;
}

/**
 * The daily pseudonymous visitor code: HMAC of (client address, user agent) under a key that
 * changes every IST day and derives from the server secret. It cannot be reversed to an address
 * and does not link a visitor across days.
 */
export function visitorCode(clientAddress: string, userAgent: string, now: number, secret = process.env.SESSION_SECRET || ""): string {
  const dayKey = createHmac("sha256", `${secret}|rawin-analytics`).update(istDay(now)).digest();
  return createHmac("sha256", dayKey).update(`${clientAddress}|${userAgent}`).digest("hex").slice(0, 20);
}

/** Server-side dedupe key: the same visitor, path and 10-second window is one page view. */
export function eventKey(visitor: string, path: string, now: number): string {
  return createHmac("sha256", "rawin-pv").update(`${visitor}|${path}|${Math.floor(now / 10_000)}`).digest("hex").slice(0, 24);
}

/** Records one page view. Returns "recorded", "duplicate", or throws when the store is unavailable. */
export async function recordPageView(input: { path: string; visitor: string; country: string | null; now?: number }): Promise<"recorded" | "duplicate"> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  void ensureIndexes();
  const now = input.now ?? Date.now();
  try {
    await db.collection<{ _id: string }>(EVENTS).insertOne({
      _id: eventKey(input.visitor, input.path, now),
      ts: new Date(now),
      h: new Date(istHourStart(now)),
      d: istDay(now),
      p: input.path,
      v: input.visitor,
      c: input.country,
    } as never);
    return "recorded";
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) return "duplicate";
    throw err;
  }
}

/** Visit rows for the last 31 days: page views grouped per hour, day, visitor and country. */
async function fetchVisitRows(): Promise<VisitRow[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const since = new Date(Date.now() - 31 * 86400_000);
  const rows = await db
    .collection(EVENTS)
    .aggregate<{ _id: { h: Date; d: string; v: string; c: string | null }; n: number }>([
      { $match: { ts: { $gte: since } } },
      { $group: { _id: { h: "$h", d: "$d", v: "$v", c: "$c" }, n: { $sum: 1 } } },
    ])
    .toArray();
  return rows.map((r) => ({ hour: new Date(r._id.h).getTime(), day: r._id.d, visitor: r._id.v, country: r._id.c ?? null, views: r.n }));
}

// Cached for a minute; a failed read throws and is never cached as an empty dataset
const cachedVisitRows = unstable_cache(fetchVisitRows, ["analytics-visit-rows"], { tags: [ANALYTICS_EVENTS_TAG], revalidate: 60 });
export function getVisitRows(): Promise<VisitRow[]> {
  return cachedVisitRows();
}

/** Collection health for Studio: total stored events, newest event, share with a known country. */
export async function getCollectionHealth(): Promise<{ stored: number; last24h: number; newest: string | null; withCountry: number }> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const col = db.collection(EVENTS);
  const [stored, last24h, newest, withCountry] = await Promise.all([
    col.estimatedDocumentCount(),
    col.countDocuments({ ts: { $gte: new Date(Date.now() - 86400_000) } }),
    col.find({}, { projection: { ts: 1 } }).sort({ ts: -1 }).limit(1).next(),
    col.countDocuments({ c: { $ne: null } }),
  ]);
  return { stored, last24h, newest: newest?.ts ? new Date(newest.ts).toISOString() : null, withCountry };
}

/* ------------------------------------------------------------------ Launch Mode settings */

async function fetchLaunchConfig(): Promise<LaunchConfig> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const doc = await db.collection("site_content").findOne({ key: "main" }, { projection: { "analytics.launchMode": 1 } });
  return doc?.analytics?.launchMode ? normalizeLaunchConfig(doc.analytics.launchMode) : LAUNCH_OFF;
}

const cachedLaunchConfig = unstable_cache(fetchLaunchConfig, ["analytics-launch-config"], { tags: [ANALYTICS_CONFIG_TAG], revalidate: 300 });

/** Launch Mode settings (cached; Studio changes invalidate them). Throws when unreadable. */
export function getLaunchConfig(): Promise<LaunchConfig> {
  return cachedLaunchConfig();
}

/** Uncached read for Studio. */
export function getLaunchConfigFresh(): Promise<LaunchConfig> {
  return fetchLaunchConfig();
}
