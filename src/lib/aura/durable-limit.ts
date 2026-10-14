import { createHash } from "node:crypto";
import { getDatabase } from "../mongodb";
import { checkAuraRateLimit } from "./rate-limit";

/**
 * Shared (cross-instance) fixed-window rate limiting for Orbit's public endpoints.
 *
 * Counters live in `rate_limits` (one row per key and window, `_id` = key:window:index), are
 * incremented with a single atomic upsert, and are purged by a TTL index on `expiresAt`. The
 * per-instance limiter in rate-limit.ts is only a cheap burst guard in front of it.
 *
 * Client identity: only Netlify's edge-supplied client address (x-nf-client-connection-ip) is
 * used, and only as a truncated hash, so no address is stored. Forwarding headers that a client
 * can set (X-Forwarded-For, X-Real-IP) are never trusted: without the edge header every request
 * shares one strict bucket ("unidentified"), which fails safe on any other host.
 *
 * Database outage policy (the shared counter cannot be read):
 *   - "closed":  refuse with 503 (owner verification, attachment uploads)
 *   - "degrade": a stricter per-instance limit (half the normal one) plus a per-instance ceiling
 *                for all clients together (chat, transcription). Weaker than the shared limit,
 *                which the result reports (`shared: false`); never unlimited.
 */

export interface CounterStore {
  /** Atomically add one to the counter `id` (created with `expiresAt` if new); returns the new count. */
  increment(id: string, expiresAt: Date): Promise<number>;
}

const COLLECTION = "rate_limits";
let indexReady: Promise<void> | null = null;

/** MongoDB-backed counters (the production store). Throws when the database is unavailable. */
export const mongoCounterStore: CounterStore = {
  async increment(id, expiresAt) {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    const col = db.collection<{ _id: string; count: number; expiresAt: Date }>(COLLECTION);
    if (!indexReady) {
      indexReady = col
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
        .then(() => undefined)
        .catch(() => {
          indexReady = null; // retried on a later request
        });
    }
    const bump = () =>
      col.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, returnDocument: "after", projection: { count: 1 } });
    let doc;
    try {
      doc = await bump();
    } catch (err) {
      // Two first requests racing to create the same row: one upsert loses with E11000 and
      // the retry increments the row the other one created
      if ((err as { code?: number })?.code !== 11000) throw err;
      doc = await bump();
    }
    if (!doc) throw new Error("Counter update returned no document.");
    return Number(doc.count) || 1;
  },
};

/** The window a timestamp falls in, and the seconds until that window ends. */
export function windowFor(now: number, windowMs: number): { index: number; resetInSeconds: number; endsAt: number } {
  const index = Math.floor(now / windowMs);
  const endsAt = (index + 1) * windowMs;
  return { index, endsAt, resetInSeconds: Math.max(1, Math.ceil((endsAt - now) / 1000)) };
}

export interface LimitResult {
  allowed: boolean;
  resetInSeconds: number;
  /** false when the shared store could not be used (the decision is per-instance or a refusal) */
  shared: boolean;
}

/** One shared fixed-window check. Never throws: `shared: false` reports an unavailable store. */
export async function checkDurableRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  store: CounterStore = mongoCounterStore,
  now = Date.now()
): Promise<LimitResult> {
  const w = windowFor(now, windowMs);
  try {
    const count = await store.increment(`${key.slice(0, 120)}:${windowMs}:${w.index}`, new Date(w.endsAt + 60_000));
    return { allowed: count <= limit, resetInSeconds: w.resetInSeconds, shared: true };
  } catch {
    return { allowed: false, resetInSeconds: w.resetInSeconds, shared: false };
  }
}

/**
 * The rate-limit identity of a request: a hash of Netlify's edge-supplied client address, or
 * one shared "unidentified" bucket. Client-settable forwarding headers are ignored.
 */
export function orbitClientKey(headers: { get(name: string): string | null }): string {
  const edge = headers.get("x-nf-client-connection-ip")?.trim();
  if (!edge) return "unidentified";
  return `ip:${createHash("sha256").update(edge).digest("hex").slice(0, 16)}`;
}

export type OutagePolicy = "closed" | "degrade";

export async function limitOrbitRequest(
  headers: { get(name: string): string | null },
  scope: string,
  limit: number,
  windowMs: number,
  policy: OutagePolicy,
  store: CounterStore = mongoCounterStore
): Promise<LimitResult & { clientKey: string; unavailable: boolean }> {
  const clientKey = orbitClientKey(headers);
  const key = `${scope}:${clientKey}`;
  const local = checkAuraRateLimit(key, limit, windowMs);
  if (!local.allowed) return { allowed: false, resetInSeconds: local.resetInSeconds, shared: true, clientKey, unavailable: false };

  const shared = await checkDurableRateLimit(key, limit, windowMs, store);
  if (shared.shared) return { ...shared, clientKey, unavailable: false };

  // Shared store unavailable
  if (policy === "closed") return { allowed: false, resetInSeconds: 30, shared: false, clientKey, unavailable: true };
  const strict = checkAuraRateLimit(`degraded:${key}`, Math.max(1, Math.ceil(limit / 2)), windowMs);
  const ceiling = checkAuraRateLimit(`degraded:${scope}:all`, limit * 4, windowMs);
  return { allowed: strict.allowed && ceiling.allowed, resetInSeconds: Math.max(strict.resetInSeconds, ceiling.resetInSeconds), shared: false, clientKey, unavailable: false };
}

/**
 * Owner-verification guessing limits, all shared and all fail-closed:
 *   - per client: 8 a minute and 30 an hour;
 *   - everyone together: 60 an hour. Past that, each client still gets one attempt a day
 *     ("grace"), so a flood of wrong codes cannot lock the owner out completely, while the
 *     total number of guesses stays bounded by the number of distinct clients.
 * Returns "unavailable" when the shared store cannot be used: verification is then refused.
 */
export async function ownerVerificationAllowed(clientKey: string, store: CounterStore = mongoCounterStore, now = Date.now()): Promise<"allowed" | "limited" | "unavailable"> {
  const checks: [string, number, number][] = [
    [`owner-verify:${clientKey}`, 8, 60 * 1000],
    [`owner-verify-hour:${clientKey}`, 30, 60 * 60 * 1000],
  ];
  for (const [key, limit, windowMs] of checks) {
    const r = await checkDurableRateLimit(key, limit, windowMs, store, now);
    if (!r.shared) return "unavailable";
    if (!r.allowed) return "limited";
  }
  const global = await checkDurableRateLimit("owner-verify:all", 60, 60 * 60 * 1000, store, now);
  if (!global.shared) return "unavailable";
  if (global.allowed) return "allowed";
  const grace = await checkDurableRateLimit(`owner-verify-grace:${clientKey}`, 1, 24 * 60 * 60 * 1000, store, now);
  if (!grace.shared) return "unavailable";
  return grace.allowed ? "allowed" : "limited";
}
