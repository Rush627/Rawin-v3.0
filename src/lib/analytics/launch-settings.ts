import { randomInt } from "node:crypto";
import { getDatabase } from "../mongodb";
import { isLaunchPreset, normalizeLaunchConfig, type LaunchConfig } from "./model";

/**
 * Launch Mode settings: how a Studio change is decided and persisted. They live in the canonical
 * site_content document (key "main") at analytics.launchMode, with a short change history at
 * analytics.launchHistory; nothing else in that document is written. Recorded analytics events
 * are never touched.
 *
 * The decision is separate from the database so it can be tested with a fake store:
 *  - a new seed is drawn only when Launch Mode starts or its preset changes (the public figures
 *    keep their continuity otherwise);
 *  - saving what is already saved writes nothing and succeeds;
 *  - the write is conditional on the settings read just before it (their updatedAt), so two
 *    overlapping saves can never silently overwrite each other: the later one re-reads and
 *    decides again once, then reports a conflict instead of guessing;
 *  - success is reported only when the write matched the content document.
 */

export interface LaunchChange {
  enabled: boolean;
  preset: number;
}

export type StoredLaunch = { config: LaunchConfig; version: string | null };

export interface LaunchStore {
  read(): Promise<StoredLaunch>;
  /** applies `next` only if the stored version is still `expected`; "missing" when there is no content document */
  write(next: LaunchConfig & { updatedAt: string }, expected: string | null): Promise<"ok" | "conflict" | "missing">;
}

export type LaunchSaveResult =
  | { ok: true; config: LaunchConfig; changed: boolean }
  | { ok: false; reason: "invalid" | "unavailable" | "conflict" | "missing"; message: string };

const MESSAGES = {
  invalid: "Choose one of the six presets.",
  unavailable: "The database is unavailable. Nothing was changed.",
  conflict: "Launch Mode was changed elsewhere at the same time. Reload to see the current setting, then try again.",
  missing: "The site content record was not found. Nothing was changed.",
} as const;

const fail = (reason: keyof typeof MESSAGES): LaunchSaveResult => ({ ok: false, reason, message: MESSAGES[reason] });

export function validLaunchChange(input: unknown): input is LaunchChange {
  const i = input as LaunchChange | null;
  return !!i && typeof i.enabled === "boolean" && isLaunchPreset(i.preset);
}

/** The settings that `change` leads to from `current` (pure). */
export function nextLaunchConfig(current: LaunchConfig, change: LaunchChange, now: string, drawSeed: () => number): LaunchConfig {
  const restart = change.enabled && (!current.enabled || current.preset !== change.preset);
  return {
    enabled: change.enabled,
    preset: change.preset as LaunchConfig["preset"],
    seed: restart ? drawSeed() : current.seed,
    startedAt: change.enabled ? (restart ? now : current.startedAt) : current.startedAt,
  };
}

const same = (a: LaunchConfig, b: LaunchConfig) => a.enabled === b.enabled && a.preset === b.preset && a.seed === b.seed && a.startedAt === b.startedAt;

export async function applyLaunchChange(
  store: LaunchStore,
  input: unknown,
  { now = () => new Date().toISOString(), drawSeed = () => randomInt(1, 2147483646) }: { now?: () => string; drawSeed?: () => number } = {},
): Promise<LaunchSaveResult> {
  if (!validLaunchChange(input)) return fail("invalid");
  for (let attempt = 0; attempt < 2; attempt++) {
    let stored: StoredLaunch;
    try {
      stored = await store.read();
    } catch {
      return fail("unavailable");
    }
    const at = now();
    const next = nextLaunchConfig(stored.config, input, at, drawSeed);
    if (same(next, stored.config)) return { ok: true, config: stored.config, changed: false };
    let written: "ok" | "conflict" | "missing";
    try {
      written = await store.write({ ...next, updatedAt: at }, stored.version);
    } catch {
      return fail("unavailable");
    }
    if (written === "ok") return { ok: true, config: next, changed: true };
    if (written === "missing") return fail("missing");
    // another save landed between the read and the write: decide again from what it stored
  }
  return fail("conflict");
}

/** The MongoDB store over site_content (key "main"). Throws when the database is unreachable. */
export function mongoLaunchStore(): LaunchStore {
  const collection = async () => {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    return db.collection("site_content");
  };
  return {
    async read() {
      const doc = await (await collection()).findOne({ key: "main" }, { projection: { "analytics.launchMode": 1 } });
      const raw = doc?.analytics?.launchMode;
      return { config: normalizeLaunchConfig(raw), version: typeof raw?.updatedAt === "string" ? raw.updatedAt : null };
    },
    async write(next, expected) {
      const col = await collection();
      const res = await col.updateOne(
        { key: "main", "analytics.launchMode.updatedAt": expected === null ? { $exists: false } : expected },
        {
          $set: { "analytics.launchMode": next },
          $push: { "analytics.launchHistory": { $each: [{ at: next.updatedAt, enabled: next.enabled, preset: next.preset }], $slice: -20 } } as never,
        },
      );
      if (res.matchedCount === 1) return "ok";
      return (await col.countDocuments({ key: "main" }, { limit: 1 })) ? "conflict" : "missing";
    },
  };
}
