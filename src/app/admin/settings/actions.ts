"use server";

import bcrypt from "bcryptjs";
import { getAdminSession, verifyAdminCredentials, destroyAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

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
