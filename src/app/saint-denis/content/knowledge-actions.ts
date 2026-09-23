"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import {
  createOrbitKnowledge,
  updateOrbitKnowledge,
  deleteOrbitKnowledge,
  toggleOrbitKnowledgeEnabled,
  type OrbitKnowledgeCategory,
  type OrbitKnowledgePriority,
  type OrbitKnowledgeStatus,
  type OrbitKnowledgeItem,
} from "@/lib/orbit-knowledge";
import { invalidateAuraKnowledgeCache } from "@/lib/aura/knowledge";

export interface KnowledgeActionState {
  success?: boolean;
  error?: string;
  message?: string;
  item?: OrbitKnowledgeItem;
}

const VALID_CATEGORIES: OrbitKnowledgeCategory[] = [
  "profile",
  "education",
  "skills",
  "rawin",
  "orbit",
  "custom",
];

const VALID_PRIORITIES: OrbitKnowledgePriority[] = ["high", "normal", "low"];
const VALID_STATUSES: OrbitKnowledgeStatus[] = ["current", "historical"];

/**
 * Server action to create an Orbit knowledge entry.
 */
export async function createKnowledgeAction(
  prevState: KnowledgeActionState | null,
  formData: FormData
): Promise<KnowledgeActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const category = (formData.get("category") as string || "").trim() as OrbitKnowledgeCategory;
  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const priority = (formData.get("priority") as string || "normal").trim() as OrbitKnowledgePriority;
  const status = (formData.get("status") as string || "current").trim() as OrbitKnowledgeStatus;
  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";

  if (!VALID_CATEGORIES.includes(category)) {
    return { error: "Invalid category selected." };
  }

  if (!title) {
    return { error: "Title cannot be empty." };
  }

  if (title.length > 200) {
    return { error: "Title cannot exceed 200 characters." };
  }

  if (!content) {
    return { error: "Content cannot be empty." };
  }

  if (content.length > 20000) {
    return { error: "Content cannot exceed 20,000 characters." };
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return { error: "Invalid priority level." };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: "Invalid status value." };
  }

  try {
    const newItem = await createOrbitKnowledge({
      category,
      title,
      content,
      priority,
      status,
      enabled,
    });

    invalidateAuraKnowledgeCache();
    try {
      revalidateTag("orbit-knowledge", "max");
    } catch {}

    return {
      success: true,
      message: `Knowledge entry "${title}" created successfully.`,
      item: newItem,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[KnowledgeAction] Error creating knowledge:", msg);
    return { error: "Failed to create knowledge entry." };
  }
}

/**
 * Server action to update an existing Orbit knowledge entry.
 */
export async function updateKnowledgeAction(
  id: string,
  prevState: KnowledgeActionState | null,
  formData: FormData
): Promise<KnowledgeActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  if (!id || typeof id !== "string") {
    return { error: "Invalid knowledge ID." };
  }

  const category = (formData.get("category") as string || "").trim() as OrbitKnowledgeCategory;
  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const priority = (formData.get("priority") as string || "normal").trim() as OrbitKnowledgePriority;
  const status = (formData.get("status") as string || "current").trim() as OrbitKnowledgeStatus;
  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";

  if (!VALID_CATEGORIES.includes(category)) {
    return { error: "Invalid category selected." };
  }

  if (!title) {
    return { error: "Title cannot be empty." };
  }

  if (title.length > 200) {
    return { error: "Title cannot exceed 200 characters." };
  }

  if (!content) {
    return { error: "Content cannot be empty." };
  }

  if (content.length > 20000) {
    return { error: "Content cannot exceed 20,000 characters." };
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return { error: "Invalid priority level." };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: "Invalid status value." };
  }

  try {
    const updated = await updateOrbitKnowledge(id, {
      category,
      title,
      content,
      priority,
      status,
      enabled,
    });

    if (!updated) {
      return { error: "Knowledge entry not found or update failed." };
    }

    invalidateAuraKnowledgeCache();
    try {
      revalidateTag("orbit-knowledge", "max");
    } catch {}

    return {
      success: true,
      message: `Knowledge entry "${title}" updated successfully.`,
      item: updated,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[KnowledgeAction] Error updating knowledge:", msg);
    return { error: "Failed to update knowledge entry." };
  }
}

/**
 * Server action to delete an Orbit knowledge entry.
 */
export async function deleteKnowledgeAction(id: string): Promise<KnowledgeActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  if (!id || typeof id !== "string") {
    return { error: "Invalid knowledge ID." };
  }

  try {
    const deleted = await deleteOrbitKnowledge(id);
    if (!deleted) {
      return { error: "Failed to delete knowledge entry." };
    }

    invalidateAuraKnowledgeCache();
    try {
      revalidateTag("orbit-knowledge", "max");
    } catch {}

    return {
      success: true,
      message: "Knowledge entry deleted successfully.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[KnowledgeAction] Error deleting knowledge:", msg);
    return { error: "Failed to delete knowledge entry." };
  }
}

/**
 * Server action to toggle the enabled state of an Orbit knowledge entry.
 */
export async function toggleKnowledgeAction(
  id: string,
  enabled: boolean
): Promise<KnowledgeActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  if (!id || typeof id !== "string") {
    return { error: "Invalid knowledge ID." };
  }

  try {
    const updated = await toggleOrbitKnowledgeEnabled(id, enabled);
    if (!updated) {
      return { error: "Failed to toggle status." };
    }

    invalidateAuraKnowledgeCache();
    try {
      revalidateTag("orbit-knowledge", "max");
    } catch {}

    return {
      success: true,
      message: `Knowledge entry ${enabled ? "enabled" : "disabled"}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[KnowledgeAction] Error toggling knowledge status:", msg);
    return { error: "Failed to toggle knowledge status." };
  }
}
