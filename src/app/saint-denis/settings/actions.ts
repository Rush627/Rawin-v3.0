"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "@/lib/cache";
import { getAdminSession, verifyAdminCredentials, destroyAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import {
  updateSiteSection,
  type MaintenanceContent,
  type LaunchExperienceContent,
} from "@/lib/site-content";
import { parseKolkataDateTimeInput } from "@/lib/dateUtils";
import { newLaunchEventId, validateLaunchInput } from "@/lib/startup/launch";

export interface PasswordChangeState {
  success?: boolean;
  error?: string;
  message?: string;
  requiresLogin?: boolean;
}

export async function changePasswordAction(
  prevState: PasswordChangeState | null,
  formData: FormData
): Promise<PasswordChangeState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: "All password fields are required." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  if (currentPassword === newPassword) {
    return { error: "New password must be different from the current password." };
  }

  // Verify current password against database / credential fallback
  const verifyResult = await verifyAdminCredentials(session.email, currentPassword);
  if (!verifyResult.success) {
    return { error: "Incorrect current password." };
  }

  // Hash new password using bcrypt (cost factor 12)
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update MongoDB admins collection
  try {
    const db = await getDatabase();
    if (!db) {
      return { error: "Database connection unavailable. Password not changed." };
    }

    const adminsCol = db.collection("admins");
    const updateResult = await adminsCol.updateOne(
      { email: session.email },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
        // every session issued before the change (on any device) stops working
        $inc: { sessionVersion: 1 },
        $setOnInsert: {
          email: session.email,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (!updateResult.acknowledged) {
      return { error: "Failed to persist updated password. Please try again." };
    }

    // Invalidate active session to enforce fresh authentication
    await destroyAdminSession();

    return {
      success: true,
      message: "Password updated. Every session, on every device, has been signed out. Please sign in with your new password.",
      requiresLogin: true,
    };
  } catch (err) {
    console.error("[Settings] Password update error:", err);
    return { error: "An unexpected error occurred while updating password. Please try again." };
  }
}

/** Public pages to refresh after an availability change (the layout revalidation covers the rest). */
const PUBLIC_PATHS = ["/", "/about", "/projects", "/blog", "/uses", "/resume", "/contact", "/ai", "/analytics", "/saint-denis/settings"];

export interface MaintenanceActionState {
  success?: boolean;
  error?: string;
  message?: string;
  maintenance?: MaintenanceContent;
}

export async function saveAvailabilityAction({
  mode,
  durationMinutes,
  message: rawMessage,
}: {
  mode: "offline" | "maintenance" | "off";
  durationMinutes?: number | null;
  message?: string;
}): Promise<MaintenanceActionState> {
  // getAdminSession() also reads the account record and returns null when it cannot, so an
  // unreachable database is checked first instead of being reported as "Unauthorized"
  if (!(await getDatabase())) {
    return { error: "The database is unavailable. The site's availability was not changed." };
  }
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  let enabled = false;
  let showMessage = false;
  let endsAt: string | null = null;

  if (mode === "offline") {
    enabled = true;
    showMessage = false;
    endsAt = null; // Site Offline is strictly indefinite (no duration, no countdown)
  } else if (mode === "maintenance") {
    enabled = true;
    showMessage = true;
    const minutes = typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : 15;
    const clampedMinutes = Math.min(Math.max(5, minutes), 1440);
    endsAt = new Date(Date.now() + clampedMinutes * 60 * 1000).toISOString();
  } else {
    // "off" -> Reset to Live
    enabled = false;
    showMessage = false;
    endsAt = null;
  }

  if (message.length > 300) {
    return { error: "Maintenance message must not exceed 300 characters." };
  }

  // 1. persist, and succeed only when the write reached the content document
  let stored: boolean;
  try {
    stored = await updateSiteSection("maintenance", {
      enabled,
      showMessage,
      message: message || "We'll be back shortly.",
      endsAt,
    });
  } catch {
    // updateSiteSection logs the cause (without connection details)
    return { error: "The database could not save the change. The site's availability was not changed." };
  }
  if (!stored) {
    return { error: "The change was not confirmed by the database. The site's availability was not changed." };
  }

  // 2. the change is stored: make the public pages pick it up. A failure here does not undo
  // the change and is not reported as one: open tabs follow the stored setting through
  // /api/availability (one-minute cache, also purged here), and pages rendered while
  // maintenance is on live for MAINTENANCE_PAGE_TTL seconds only.
  const failed: string[] = [];
  try {
    invalidateCacheTag("site-content");
  } catch {
    failed.push("site-content");
  }
  for (const p of PUBLIC_PATHS) {
    try {
      revalidatePath(p);
    } catch {
      failed.push(p);
    }
  }
  try {
    revalidatePath("/", "layout");
  } catch {
    failed.push("layout");
  }
  if (failed.length) {
    console.error(`[Settings] Availability saved; cache refresh failed for: ${failed.join(", ")}`);
  }

  return {
    success: true,
    message: (enabled
      ? (showMessage ? "Maintenance mode activated." : "Site offline mode activated.")
      : "Website is live and fully accessible.") +
      (failed.length ? " The public cache could not be refreshed, so some pages may take longer to follow; open pages update within a minute." : ""),
    maintenance: {
      enabled,
      showMessage,
      message: message || "We'll be back shortly.",
      endsAt,
    },
  };
}

export async function updateMaintenanceAction(
  prevState: MaintenanceActionState | null,
  formData: FormData
): Promise<MaintenanceActionState> {
  const rawMode = formData.get("mode");
  const mode = (typeof rawMode === "string" ? rawMode : "off") as "offline" | "maintenance" | "off";
  const rawMessage = formData.get("message");
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const rawDuration = formData.get("durationMinutes");
  const durationMinutes = rawDuration ? parseInt(rawDuration as string, 10) : null;

  return saveAvailabilityAction({
    mode,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
    message,
  });
}

export interface LaunchExperienceActionState {
  success?: boolean;
  error?: string;
  message?: string;
  launchExperience?: LaunchExperienceContent;
}

/** Studio datetime-local values are IST wall time; legacy date-only values are kept as written. */
function launchInstantInput(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(t)) return parseKolkataDateTimeInput(t) ?? "invalid";
  return t;
}

async function persistLaunch(payload: Partial<LaunchExperienceContent>): Promise<boolean> {
  const success = await updateSiteSection("launchExperience", payload);
  if (!success) return false;
  try {
    invalidateCacheTag("site-content");
  } catch {}
  // every page embeds the launch event in its startup boot script (root layout)
  revalidatePath("/", "layout");
  revalidatePath("/saint-denis/settings");
  return true;
}

/**
 * Saves the Supernova launch settings (Studio → Settings → Launch). Validation is shared with
 * the Studio's status panel (lib/startup/launch.ts): a trimmed title, a preset length, schedule
 * instants (IST input converted to UTC), an end after the start, a plain event id. The effective
 * status (armed / active / expired) is never stored: it is derived from these and the clock.
 * The legacy `animation` and `showFrequency` fields are kept as they are.
 */
export async function saveLaunchExperienceAction(
  data: Partial<LaunchExperienceContent>
): Promise<LaunchExperienceActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const checked = validateLaunchInput({
    ...data,
    startDate: launchInstantInput(data.startDate),
    endDate: launchInstantInput(data.endDate),
  });
  if (!checked.ok) return { error: checked.error };

  const payload: LaunchExperienceContent = {
    ...checked.value,
    animation: "signal-wake",
    showFrequency: ["once", "session", "visit"].includes(String(data.showFrequency))
      ? (data.showFrequency as "once" | "session" | "visit")
      : "once",
  };

  try {
    if (!(await persistLaunch(payload))) {
      return { error: "Failed to persist launch experience settings. Please try again." };
    }
    return {
      success: true,
      message: payload.enabled ? "Supernova launch saved and switched on." : "Supernova launch saved (switched off).",
      launchExperience: payload,
    };
  } catch (err) {
    console.error("[Settings] Launch Experience update error:", err);
    return { error: "An unexpected error occurred while saving Launch Experience settings." };
  }
}

/**
 * Starts a new launch event: a fresh event id, so every visitor (including those who already
 * watched the previous launch) becomes eligible again. Only the id changes.
 */
export async function startNewLaunchEventAction(): Promise<LaunchExperienceActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }
  const launchVersion = newLaunchEventId(Date.now());
  try {
    if (!(await persistLaunch({ launchVersion }))) {
      return { error: "The new launch event could not be saved. Please try again." };
    }
    return { success: true, message: `New launch event ${launchVersion} issued.`, launchExperience: { launchVersion } as LaunchExperienceContent };
  } catch (err) {
    console.error("[Settings] New launch event error:", err);
    return { error: "An unexpected error occurred while issuing a new launch event." };
  }
}

