"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "@/lib/cache";
import { getAdminSession } from "@/lib/auth";
import { buildSectionPayload, SECTION_ALLOWED_KEYS, type EditableSection } from "@/lib/cms/section-payload";
import { updateSiteSection, storeMilestoneImage } from "@/lib/site-content";
import { IMAGE_UPLOAD_RULES, checkImageUpload } from "@/lib/brand-assets";
import { storeUploadedResume } from "@/lib/resume-upload";

const EDITABLE_SECTIONS = Object.keys(SECTION_ALLOWED_KEYS) as EditableSection[];

export interface ContentActionState {
  error?: string;
  /** the submitted key the error belongs to, for inline field errors */
  field?: string;
  success?: boolean;
  message?: string;
  url?: string;
  fileId?: string;
}

/**
 * Server action to update a specific section of site content.
 */
export async function updateSectionAction(
  section: EditableSection,
  prevState: ContentActionState | null,
  formData: FormData
): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  if (!EDITABLE_SECTIONS.includes(section)) {
    return { error: `Invalid content section: "${section}".` };
  }

  const built = buildSectionPayload(section, (key) => formData.get(key));
  if (!built.ok) return { error: built.error, field: built.field || undefined };
  const payload = built.payload;
  if (Object.keys(payload).length === 0) {
    return { success: true, message: "Nothing to save." };
  }

  try {
    await updateSiteSection(section, payload as never);

  } catch (err: unknown) {
    console.error(`[SiteContent Action Error] Unexpected failure updating section "${section}":`, err);
    return { error: "An unexpected error occurred while saving content. Please try again." };
  }

  // Invalidate public site content cache tag on-demand immediately
  try {
    invalidateCacheTag("site-content");
  } catch {}

  // Every public page reads site content through the tagged cache, so the tag above is what
  // makes edits visible; the layout path additionally refreshes statically rendered routes.
  try {
    revalidatePath("/", "layout");
  } catch {}

  return { success: true, message: "Saved." };
}

/** Identity assets editable from Media & Identity (the legacy single logo/favicon are retired). */
const IDENTITY_ASSETS = ["profilePhoto", "logoLight", "logoDark", "faviconLight", "faviconDark"] as const;
type IdentityAsset = (typeof IDENTITY_ASSETS)[number];

function revalidateAllAssetPaths() {
  try {
    invalidateCacheTag("site-content");
  } catch {}
  try {
    revalidatePath("/", "layout");
  } catch {}
}

/**
 * Upload, reset or relabel an identity asset. Uploads are validated by their bytes (the browser's
 * declared type is ignored) and stored through the existing GridFS replacement sequence:
 * new file first, then the reference, then removal of the previous file.
 */
export async function updateAssetAction(formData: FormData): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const assetType = String(formData.get("assetType") || "") as IdentityAsset;
  const action = String(formData.get("action") || "");
  if (!IDENTITY_ASSETS.includes(assetType)) {
    return { error: "Invalid asset category specified." };
  }
  const label = IMAGE_UPLOAD_RULES[assetType].label;
  const { storeAssetFile, updateSiteAssetMeta, resetAssetToDefault } = await import("@/lib/site-content");

  if (action === "reset") {
    try {
      await resetAssetToDefault(assetType);
      revalidateAllAssetPaths();
      return { success: true, message: `${label} now uses the built-in default.` };
    } catch (err: unknown) {
      console.error(`[Assets] Reset failed for "${assetType}":`, err instanceof Error ? err.message : String(err));
      return { error: `${label} could not be reset. Nothing was changed.` };
    }
  }

  if (action === "alt") {
    const alt = String(formData.get("alt") || "").trim();
    if (alt.length > 200) return { error: "Alt text cannot exceed 200 characters.", field: "alt" };
    try {
      await updateSiteAssetMeta(assetType, { alt });
      revalidateAllAssetPaths();
      return { success: true, message: "Description saved." };
    } catch (err: unknown) {
      console.error(`[Assets] Alt text save failed for "${assetType}":`, err instanceof Error ? err.message : String(err));
      return { error: "The description could not be saved." };
    }
  }

  if (action === "upload") {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose an image to upload.", field: "file" };
    }
    if (file.size > IMAGE_UPLOAD_RULES[assetType].maxBytes) {
      return { error: `${label} must be ${Math.round(IMAGE_UPLOAD_RULES[assetType].maxBytes / 1024 / 1024)} MB or smaller.`, field: "file" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const check = checkImageUpload(assetType, buffer);
    if (!check.ok) return { error: check.error, field: "file" };
    const alt = String(formData.get("alt") || "").trim().slice(0, 200) || undefined;
    try {
      const result = await storeAssetFile(assetType, buffer, check.type, file.name || assetType, alt);
      revalidateAllAssetPaths();
      return { success: true, message: `${label} updated.`, url: result.url, fileId: result.fileId };
    } catch (err: unknown) {
      console.error(`[Assets] Upload failed for "${assetType}":`, err instanceof Error ? err.message : String(err));
      return { error: `${label} could not be stored. The previous image is still in place.` };
    }
  }

  return { error: "Invalid asset operation." };
}

/** Uploads a new resume PDF (shared validation with POST /api/resume/upload). */
export async function uploadResumePdfAction(formData: FormData): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }
  const result = await storeUploadedResume(formData.get("file"));
  if ("error" in result) return { error: result.error, field: "file" };
  return { success: true, message: `${result.filename} is now the published resume.`, url: result.url };
}

/** Removes the published resume PDF (the download buttons disappear). */
export async function removeResumePdfAction(): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }
  try {
    const { removeResumePdfFile } = await import("@/lib/site-content");
    await removeResumePdfFile();
    revalidateAllAssetPaths();
    return { success: true, message: "Resume PDF removed. The download buttons are hidden until a new one is uploaded." };
  } catch (err: unknown) {
    console.error("[Resume PDF] Remove failed:", err instanceof Error ? err.message : String(err));
    return { error: "The resume PDF could not be removed. Please try again." };
  }
}

/**
 * Uploads a milestone preview. When the milestone is already saved, its stored preview is
 * switched to the new file in the same step and the previous file is removed only afterwards;
 * for a milestone that is not saved yet, the returned URL is kept in the About editor until
 * the About section is saved.
 */
export async function uploadMilestoneImageAction(
  formData: FormData
): Promise<{ success?: boolean; url?: string; error?: string; linked?: boolean }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const milestoneId = String(formData.get("milestoneId") || "").trim().slice(0, 40);
  const file = formData.get("file");
  if (!milestoneId || !/^[A-Za-z0-9_-]+$/.test(milestoneId)) {
    return { error: "Milestone ID is required." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > IMAGE_UPLOAD_RULES.milestone.maxBytes) {
    return { error: "Milestone images must be 5 MB or smaller." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const check = checkImageUpload("milestone", buffer);
  if (!check.ok) return { error: check.error };

  try {
    const { url, linked } = await storeMilestoneImage(milestoneId, buffer, check.type, file.name || `milestone-${milestoneId}`);
    revalidateAllAssetPaths();
    return { success: true, url, linked };
  } catch (err: unknown) {
    console.error("[Milestone image] Upload failed:", err instanceof Error ? err.message : String(err));
    return { error: "The image could not be stored. The previous image is still in place." };
  }
}

/** Returns a saved milestone to its bundled screenshot (admin only). */
export async function resetMilestoneImageAction(milestoneId: string): Promise<{ success?: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized. Administrator session required." };
  const id = String(milestoneId || "").trim().slice(0, 40);
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return { error: "Milestone ID is required." };
  try {
    const { resetMilestoneImage } = await import("@/lib/site-content");
    const done = await resetMilestoneImage(id);
    if (!done) return { error: "Save the About section first, then switch this milestone to its built-in screenshot." };
    revalidateAllAssetPaths();
    return { success: true };
  } catch (err: unknown) {
    console.error("[Milestone image] Reset failed:", err instanceof Error ? err.message : String(err));
    return { error: "The screenshot could not be reset. Nothing was changed." };
  }
}

/**
 * Updates the private Rushan identity verification code.
 * Validates admin session, verifies matching inputs, validates length (4-32 chars),
 * hashes via bcrypt, and updates MongoDB orbit_security collection.
 */
export async function updateOrbitVerificationCodeAction(
  _prevState: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in as an administrator." };
  }

  const newCode = (formData.get("newCode") as string) || "";
  const confirmCode = (formData.get("confirmCode") as string) || "";

  const trimmedNew = newCode.trim();
  const trimmedConfirm = confirmCode.trim();

  if (!trimmedNew) {
    return { error: "Verification code cannot be empty." };
  }

  if (trimmedNew !== trimmedConfirm) {
    return { error: "New verification codes do not match." };
  }

  if (trimmedNew.length < 4 || trimmedNew.length > 32) {
    return { error: "Verification code must be between 4 and 32 characters." };
  }

  const { updateOwnerVerificationCode } = await import("@/lib/orbit-security");
  const result = await updateOwnerVerificationCode(trimmedNew);

  if (!result.success) {
    return { error: result.error || "Failed to update verification code." };
  }

  return { success: true, message: "Verification code changed. The previous code no longer works." };
}

