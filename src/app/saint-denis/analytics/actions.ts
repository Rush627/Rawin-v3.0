"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { invalidateCacheTag } from "@/lib/cache";
import { isLaunchPreset, type LaunchConfig } from "@/lib/analytics/model";
import { ANALYTICS_CONFIG_TAG, getLaunchConfigFresh } from "@/lib/analytics/store";

export interface LaunchModeResult {
  success?: boolean;
  error?: string;
  config?: LaunchConfig;
}

/**
 * Turns Launch Mode on or off and sets its preset (admin only). A new seed is drawn only when
 * Launch Mode starts or the preset changes, so the public figures keep their continuity
 * otherwise. Writes site_content.analytics.launchMode and appends to a short change history;
 * recorded analytics events are never touched.
 */
export async function saveLaunchModeAction(input: { enabled: boolean; preset: number }): Promise<LaunchModeResult> {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized. Administrator session required." };
  if (typeof input?.enabled !== "boolean" || !isLaunchPreset(input.preset)) return { error: "Choose one of the six presets." };

  let current: LaunchConfig;
  try {
    current = await getLaunchConfigFresh();
  } catch {
    return { error: "The database is unavailable. Nothing was changed." };
  }
  const restart = input.enabled && (!current.enabled || current.preset !== input.preset);
  const now = new Date().toISOString();
  const next: LaunchConfig = {
    enabled: input.enabled,
    preset: input.preset,
    seed: restart ? randomInt(1, 2147483646) : current.seed,
    startedAt: input.enabled ? (restart ? now : current.startedAt) : current.startedAt,
  };

  try {
    const db = await getDatabase();
    if (!db) return { error: "The database is unavailable. Nothing was changed." };
    await db.collection("site_content").updateOne(
      { key: "main" },
      {
        $set: { "analytics.launchMode": { ...next, updatedAt: now } },
        $push: { "analytics.launchHistory": { $each: [{ at: now, enabled: next.enabled, preset: next.preset }], $slice: -20 } } as never,
      }
    );
  } catch {
    return { error: "The change could not be saved. Nothing was changed." };
  }

  // narrow invalidation: only the Launch Mode settings and the analytics page
  invalidateCacheTag(ANALYTICS_CONFIG_TAG);
  revalidatePath("/analytics");
  revalidatePath("/saint-denis/analytics");
  return { success: true, config: next };
}
