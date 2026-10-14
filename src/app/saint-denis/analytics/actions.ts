"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { invalidateCacheTag } from "@/lib/cache";
import type { LaunchConfig } from "@/lib/analytics/model";
import { ANALYTICS_CONFIG_TAG, getLaunchConfigFresh } from "@/lib/analytics/store";
import { applyLaunchChange, mongoLaunchStore } from "@/lib/analytics/launch-settings";

export interface LaunchModeResult {
  success?: boolean;
  error?: string;
  config?: LaunchConfig;
}

/**
 * The administrator check, telling an unreachable database apart from a missing session:
 * getAdminSession() also reads the account record and returns null when it cannot, which would
 * otherwise be reported as "Unauthorized" during a database interruption.
 */
async function adminCheck(): Promise<string | null> {
  if (!(await getDatabase())) return "The database is unavailable. Nothing was changed.";
  if (!(await getAdminSession())) return "Unauthorized. Administrator session required.";
  return null;
}

/**
 * Turns Launch Mode on or off and sets its preset (admin only). The decision and the conditional
 * write live in lib/analytics/launch-settings.ts. Success is returned only after the write is
 * confirmed. The response stays small: cache invalidation is narrow (the settings tag and the
 * public page) and failures there never turn a persisted change into an error, and the Studio
 * page is not re-rendered inside the action (the card shows the returned settings).
 */
export async function saveLaunchModeAction(input: { enabled: boolean; preset: number }): Promise<LaunchModeResult> {
  const denied = await adminCheck();
  if (denied) return { error: denied };

  const result = await applyLaunchChange(mongoLaunchStore(), input);
  if (!result.ok) {
    if (result.reason !== "invalid") console.error(`[studio/analytics] Launch Mode not saved: ${result.reason}`);
    return { error: result.message };
  }
  if (result.changed) {
    try {
      invalidateCacheTag(ANALYTICS_CONFIG_TAG);
      revalidatePath("/analytics");
    } catch (err) {
      // the change is stored; the public page still picks it up within its one-minute window
      console.error("[studio/analytics] Launch Mode saved; cache invalidation failed:", err instanceof Error ? err.name : "unknown");
    }
  }
  return { success: true, config: result.config };
}

/** The stored Launch Mode settings (admin only), to confirm what a save left behind. */
export async function readLaunchModeAction(): Promise<LaunchModeResult> {
  const denied = await adminCheck();
  if (denied) return { error: denied };
  try {
    return { success: true, config: await getLaunchConfigFresh() };
  } catch {
    return { error: "The database is unavailable." };
  }
}
