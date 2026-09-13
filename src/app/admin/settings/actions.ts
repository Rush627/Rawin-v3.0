"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getAdminSession, verifyAdminCredentials, destroyAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { updateSiteSection, type MaintenanceContent } from "@/lib/site-content";

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
      message: "Password updated successfully. Session terminated for security. Please sign in with your new password.",
      requiresLogin: true,
    };
  } catch (err) {
    console.error("[Settings] Password update error:", err);
    return { error: "An unexpected error occurred while updating password. Please try again." };
  }
}

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

  try {
    const success = await updateSiteSection("maintenance", {
      enabled,
      showMessage,
      message: message || "We'll be back shortly.",
      endsAt,
    });

    if (!success) {
      return { error: "Failed to persist maintenance settings. Please try again." };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return {
      success: true,
      message: enabled
        ? (showMessage ? "Maintenance mode activated." : "Site offline mode activated.")
        : "Website is live and fully accessible.",
      maintenance: {
        enabled,
        showMessage,
        message: message || "We'll be back shortly.",
        endsAt,
      },
    };
  } catch (err) {
    console.error("[Settings] Maintenance update error:", err);
    return { error: "An unexpected error occurred while updating maintenance settings." };
  }
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
