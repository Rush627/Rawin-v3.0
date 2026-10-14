import { getDatabase } from "./mongodb";
import { LOGIN_LIMITS, recordFailure, throttleWait, type ThrottleRecord } from "./admin-credentials";

/**
 * Durable sign-in throttling in the existing `login_attempts` collection (TTL index on
 * `lastAttemptAt` already purges stale rows after a day). Two independent buckets:
 *   - per client  (5 failures / 15 min): see clientIdentity() for how the client is identified
 *   - per account (10 failures / 15 min): keyed by the submitted email, so changing request
 *     headers cannot buy more guesses against the real account.
 * Rows are shared by every server instance, unlike the old in-memory map.
 * Trade-off: someone who knows the admin email can pause sign-in for that email for up to
 * 15 minutes; that is accepted in exchange for a hard cap on password guessing.
 */

const COLLECTION = "login_attempts";

type Bucket = { filter: { ip: string | null; email: string | null }; limit: number };

function buckets(clientKey: string, email: string): Bucket[] {
  return [
    { filter: { ip: clientKey, email: null }, limit: LOGIN_LIMITS.perClient },
    { filter: { ip: null, email: email.trim().toLowerCase().slice(0, 200) }, limit: LOGIN_LIMITS.perAccount },
  ];
}

/** Seconds until sign-in may be attempted again (0 = allowed). Throws if the store is down. */
export async function loginWaitSeconds(clientKey: string, email: string): Promise<number> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const col = db.collection(COLLECTION);
  const now = Date.now();
  let wait = 0;
  for (const b of buckets(clientKey, email)) {
    const doc = await col.findOne(b.filter, { projection: { count: 1, windowStart: 1 } });
    const rec: ThrottleRecord | null = doc ? { count: Number(doc.count) || 0, windowStart: Number(doc.windowStart) || 0 } : null;
    wait = Math.max(wait, throttleWait(rec, b.limit, now));
  }
  return wait;
}

export async function noteLoginFailure(clientKey: string, email: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  const col = db.collection(COLLECTION);
  const now = Date.now();
  for (const b of buckets(clientKey, email)) {
    const doc = await col.findOne(b.filter, { projection: { count: 1, windowStart: 1 } });
    const prev: ThrottleRecord | null = doc ? { count: Number(doc.count) || 0, windowStart: Number(doc.windowStart) || 0 } : null;
    const next = recordFailure(prev, now);
    await col.updateOne(b.filter, { $set: { ...next, lastAttemptAt: new Date(now) } }, { upsert: true });
  }
}

/** A successful sign-in clears the account bucket and this client's bucket. */
export async function clearLoginFailures(clientKey: string, email: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  const col = db.collection(COLLECTION);
  for (const b of buckets(clientKey, email)) await col.deleteOne(b.filter).catch(() => {});
}
