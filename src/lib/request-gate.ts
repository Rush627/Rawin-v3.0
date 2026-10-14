import { getDatabase } from "./mongodb";

/**
 * Lightweight checks the proxy runs before a public page starts streaming (once a response
 * streams, its status is fixed at 200). Read-only, cached briefly in memory per server process.
 */

type Entry<T> = { value: T; until: number };
// On globalThis: the proxy and the server actions are separate bundles in one server process,
// and an action must be able to clear what the proxy cached (see forgetPublicSlugs)
const globalStore = globalThis as typeof globalThis & {
  __rawinRequestGate?: Map<string, Entry<unknown>>;
  __rawinRequestGateInflight?: Map<string, Promise<unknown>>;
};
const cache = (globalStore.__rawinRequestGate ??= new Map<string, Entry<unknown>>());
// concurrent first requests (a cold start) share one lookup instead of each starting its own
const inflight = (globalStore.__rawinRequestGateInflight ??= new Map<string, Promise<unknown>>());

export function remember<T>(key: string, ttlMs: (value: T) => number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && hit.until > Date.now()) return Promise.resolve(hit.value);
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const p = load()
    .then((value) => {
      const now = Date.now();
      cache.set(key, { value, until: now + ttlMs(value) });
      if (cache.size > 2000) {
        for (const [k, e] of cache) if (e.until <= now) cache.delete(k);
      }
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/**
 * Waits at most `ms` for a gate answer. The proxy runs before every page; on a cold server
 * instance the first answer needs a fresh MongoDB connection (about 2.6 s measured, up to the
 * driver's 5 s selection timeout when the network is slow), which would otherwise delay every
 * cold request by that much, close to the hosting platform's function time limit. Past the
 * deadline the request continues (exactly as when the check fails) and the lookup keeps running
 * in the background, so the next request gets the cached answer.
 */
export async function withinDeadline<T>(p: Promise<T>, ms: number): Promise<{ ok: true; value: T } | { ok: false; reason: "timeout" | "error" }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<{ ok: false; reason: "timeout" }>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, reason: "timeout" }), ms);
  });
  try {
    return await Promise.race([p.then((value) => ({ ok: true as const, value })), deadline]);
  } catch {
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}

export interface MaintenanceGate {
  active: boolean;
  /** true = "maintenance" (message + countdown), false = plain "offline" */
  showMessage: boolean;
  endsAt: string | null;
}

/** Current maintenance state (cached 10 s). Throws when the database is unreachable. */
export function maintenanceGate(): Promise<MaintenanceGate> {
  return remember<MaintenanceGate>("maintenance", () => 10_000, async () => {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    const doc = await db.collection("site_content").findOne({ key: "main" }, { projection: { maintenance: 1 } });
    const m = doc?.maintenance ?? {};
    const endsAt = m.endsAt instanceof Date ? m.endsAt.toISOString() : typeof m.endsAt === "string" ? m.endsAt : null;
    const expired = endsAt ? new Date(endsAt).getTime() <= Date.now() : false;
    return { active: Boolean(m.enabled) && !expired, showMessage: Boolean(m.showMessage), endsAt: expired ? null : endsAt };
  });
}

/**
 * Whether a public project / published article exists for a slug. Positive answers are kept
 * 60 s, negative ones 15 s (so a newly published item appears quickly). Throws on database errors.
 */
export function publicSlugExists(kind: "project" | "post", slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  return remember<boolean>(`${kind}:${normalized}`, (v) => (v ? 60_000 : 15_000), async () => {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    const doc =
      kind === "project"
        ? await db.collection("projects").findOne({ slug: normalized }, { projection: { _id: 1 } })
        : await db.collection("blogPosts").findOne({ slug: normalized, status: "published" }, { projection: { _id: 1 } });
    return Boolean(doc);
  });
}

/**
 * Forget every cached slug answer. Called after a successful project or article change, so this
 * server instance reflects it on the next request (other instances catch up within the TTLs).
 */
export function forgetPublicSlugs(): void {
  for (const key of cache.keys()) if (key.startsWith("project:") || key.startsWith("post:")) cache.delete(key);
}
