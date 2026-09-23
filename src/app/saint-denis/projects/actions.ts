"use server";

import { revalidatePath } from "next/cache";
import { invalidateCacheTag } from "@/lib/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  storeProjectPreviewFile,
  deleteProjectPreviewForProject,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectStatus,
} from "@/lib/projects";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Server action to create a new project.
 */
export async function createProjectAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const title = (formData.get("title") as string || "").trim();
  const shortName = (formData.get("shortName") as string || title).trim();
  let slug = (formData.get("slug") as string || "").trim();
  const tagline = (formData.get("tagline") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const category = (formData.get("category") as string || "Full Stack").trim();
  const rawTech = (formData.get("technologies") as string || "").trim();
  const status = (formData.get("status") as ProjectStatus) || "completed";
  const featured = formData.get("featured") === "on" || formData.get("featured") === "true";
  const displayOrder = parseInt(formData.get("displayOrder") as string, 10) || 999;
  const previewImage = (formData.get("previewImage") as string || "").trim();
  const liveUrl = (formData.get("liveUrl") as string || "").trim();
  const githubUrl = (formData.get("githubUrl") as string || "").trim();
  const caseStudyAvailable = formData.get("caseStudyAvailable") === "on" || formData.get("caseStudyAvailable") === "true";
  const problem = (formData.get("problem") as string || "").trim();
  const solution = (formData.get("solution") as string || "").trim();
  const role = (formData.get("role") as string || "").trim();
  const outcome = (formData.get("outcome") as string || "").trim();
  const year = (formData.get("year") as string || new Date().getFullYear().toString()).trim();
  const rawFocus = (formData.get("engineeringFocus") as string || "").trim();

  if (!title) {
    return { error: "Project title is required." };
  }
  if (title.length > 150) {
    return { error: "Project title must not exceed 150 characters." };
  }
  if (shortName.length > 100) {
    return { error: "Project short name must not exceed 100 characters." };
  }

  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  if (!slug) {
    return { error: "A valid URL slug is required." };
  }
  if (slug.length > 100) {
    return { error: "Project slug must not exceed 100 characters." };
  }

  if (tagline.length > 250) {
    return { error: "Project tagline must not exceed 250 characters." };
  }

  if (!description) {
    return { error: "Project description is required." };
  }
  if (description.length > 2500) {
    return { error: "Project description must not exceed 2500 characters." };
  }

  if (category.length > 50) {
    return { error: "Category must not exceed 50 characters." };
  }
  if (previewImage.length > 500) {
    return { error: "Preview image URL must not exceed 500 characters." };
  }
  if (liveUrl.length > 500) {
    return { error: "Live demo URL must not exceed 500 characters." };
  }
  if (githubUrl.length > 500) {
    return { error: "GitHub repository URL must not exceed 500 characters." };
  }
  if (problem.length > 3000) {
    return { error: "Problem statement must not exceed 3000 characters." };
  }
  if (solution.length > 3000) {
    return { error: "Solution statement must not exceed 3000 characters." };
  }
  if (role.length > 500) {
    return { error: "Role description must not exceed 500 characters." };
  }
  if (outcome.length > 3000) {
    return { error: "Outcome summary must not exceed 3000 characters." };
  }
  if (year.length > 20) {
    return { error: "Year string must not exceed 20 characters." };
  }

  const technologies = rawTech
    ? rawTech.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (technologies.length > 30) {
    return { error: "Technologies list must not exceed 30 items." };
  }
  for (const tech of technologies) {
    if (tech.length > 50) {
      return { error: `Technology "${tech.slice(0, 20)}..." exceeds 50 characters.` };
    }
  }

  const engineeringFocus = rawFocus
    ? rawFocus.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  if (engineeringFocus.length > 20) {
    return { error: "Engineering focus list must not exceed 20 items." };
  }
  for (const focus of engineeringFocus) {
    if (focus.length > 100) {
      return { error: `Engineering focus item exceeds 100 characters.` };
    }
  }

  const input: CreateProjectInput = {
    slug,
    title,
    shortName,
    tagline,
    description,
    category,
    technologies,
    engineeringFocus,
    status,
    featured,
    displayOrder,
    previewImage,
    liveUrl,
    githubUrl,
    caseStudyAvailable,
    problem,
    solution,
    role,
    outcome,
    year,
  };

  try {
    const createdProject = await createProject(input);
    if (createdProject?._id) {
      const previewFile = (formData.get("preview") || formData.get("previewFile")) as File | null;
      if (
        previewFile &&
        previewFile.size > 0 &&
        ALLOWED_PREVIEW_MIME_TYPES.includes(previewFile.type) &&
        previewFile.size <= MAX_PREVIEW_SIZE_BYTES
      ) {
        const buffer = Buffer.from(await previewFile.arrayBuffer());
        if (buffer.length <= MAX_PREVIEW_SIZE_BYTES) {
          await storeProjectPreviewFile(createdProject._id, buffer, previewFile.type, previewFile.name);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      return { error: `A project with the slug "${slug}" already exists. Please choose a unique slug.` };
    }
    console.error("[Projects Action Error] Unexpected createProject failure:", err);
    return { error: "An unexpected error occurred while saving the project. Please try again." };
  }

  try {
    invalidateCacheTag("projects");
  } catch {}
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/saint-denis/projects");
  redirect("/saint-denis/projects");
}

/**
 * Server action to update an existing project.
 */
export async function updateProjectAction(
  id: string,
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const title = (formData.get("title") as string || "").trim();
  const shortName = (formData.get("shortName") as string || title).trim();
  let slug = (formData.get("slug") as string || "").trim();
  const tagline = (formData.get("tagline") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const category = (formData.get("category") as string || "Full Stack").trim();
  const rawTech = (formData.get("technologies") as string || "").trim();
  const status = (formData.get("status") as ProjectStatus) || "completed";
  const featured = formData.get("featured") === "on" || formData.get("featured") === "true";
  const displayOrder = parseInt(formData.get("displayOrder") as string, 10) || 999;
  const previewImage = (formData.get("previewImage") as string || "").trim();
  const liveUrl = (formData.get("liveUrl") as string || "").trim();
  const githubUrl = (formData.get("githubUrl") as string || "").trim();
  const caseStudyAvailable = formData.get("caseStudyAvailable") === "on" || formData.get("caseStudyAvailable") === "true";
  const problem = (formData.get("problem") as string || "").trim();
  const solution = (formData.get("solution") as string || "").trim();
  const role = (formData.get("role") as string || "").trim();
  const outcome = (formData.get("outcome") as string || "").trim();
  const year = (formData.get("year") as string || new Date().getFullYear().toString()).trim();
  const rawFocus = (formData.get("engineeringFocus") as string || "").trim();

  if (!title) {
    return { error: "Project title is required." };
  }
  if (title.length > 150) {
    return { error: "Project title must not exceed 150 characters." };
  }
  if (shortName.length > 100) {
    return { error: "Project short name must not exceed 100 characters." };
  }

  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  if (!slug) {
    return { error: "A valid URL slug is required." };
  }
  if (slug.length > 100) {
    return { error: "Project slug must not exceed 100 characters." };
  }

  if (tagline.length > 250) {
    return { error: "Project tagline must not exceed 250 characters." };
  }

  if (!description) {
    return { error: "Project description is required." };
  }
  if (description.length > 2500) {
    return { error: "Project description must not exceed 2500 characters." };
  }

  if (category.length > 50) {
    return { error: "Category must not exceed 50 characters." };
  }
  if (previewImage.length > 500) {
    return { error: "Preview image URL must not exceed 500 characters." };
  }
  if (liveUrl.length > 500) {
    return { error: "Live demo URL must not exceed 500 characters." };
  }
  if (githubUrl.length > 500) {
    return { error: "GitHub repository URL must not exceed 500 characters." };
  }
  if (problem.length > 3000) {
    return { error: "Problem statement must not exceed 3000 characters." };
  }
  if (solution.length > 3000) {
    return { error: "Solution statement must not exceed 3000 characters." };
  }
  if (role.length > 500) {
    return { error: "Role description must not exceed 500 characters." };
  }
  if (outcome.length > 3000) {
    return { error: "Outcome summary must not exceed 3000 characters." };
  }
  if (year.length > 20) {
    return { error: "Year string must not exceed 20 characters." };
  }

  const technologies = rawTech
    ? rawTech.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (technologies.length > 30) {
    return { error: "Technologies list must not exceed 30 items." };
  }
  for (const tech of technologies) {
    if (tech.length > 50) {
      return { error: `Technology "${tech.slice(0, 20)}..." exceeds 50 characters.` };
    }
  }

  const engineeringFocus = rawFocus
    ? rawFocus.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  if (engineeringFocus.length > 20) {
    return { error: "Engineering focus list must not exceed 20 items." };
  }
  for (const focus of engineeringFocus) {
    if (focus.length > 100) {
      return { error: `Engineering focus item exceeds 100 characters.` };
    }
  }

  const input: UpdateProjectInput = {
    slug,
    title,
    shortName,
    tagline,
    description,
    category,
    technologies,
    engineeringFocus,
    status,
    featured,
    displayOrder,
    previewImage,
    liveUrl,
    githubUrl,
    caseStudyAvailable,
    problem,
    solution,
    role,
    outcome,
    year,
  };

  try {
    await updateProject(id, input);
    const previewFile = (formData.get("preview") || formData.get("previewFile")) as File | null;
    if (
      previewFile &&
      previewFile.size > 0 &&
      ALLOWED_PREVIEW_MIME_TYPES.includes(previewFile.type) &&
      previewFile.size <= MAX_PREVIEW_SIZE_BYTES
    ) {
      const buffer = Buffer.from(await previewFile.arrayBuffer());
      if (buffer.length <= MAX_PREVIEW_SIZE_BYTES) {
        await storeProjectPreviewFile(id, buffer, previewFile.type, previewFile.name);
      }
    } else if (formData.get("removePreview") === "true") {
      await deleteProjectPreviewForProject(id);
      const { getDatabase } = await import("@/lib/mongodb");
      const { ObjectId } = await import("mongodb");
      const db = await getDatabase();
      if (db) {
        await db.collection("projects").updateOne(
          { _id: new ObjectId(id) },
          { $unset: { previewImage: "" }, $set: { updatedAt: new Date() } }
        );
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      return { error: `A project with the slug "${slug}" already exists. Please choose a unique slug.` };
    }
    console.error("[Projects Action Error] Unexpected updateProject failure:", err);
    return { error: "An unexpected error occurred while updating the project. Please try again." };
  }

  try {
    invalidateCacheTag("projects");
  } catch {}
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/saint-denis/projects");
  redirect("/saint-denis/projects");
}

/**
 * Server action to toggle the featured flag for a project.
 */
export async function toggleFeaturedAction(id: string, currentFeatured: boolean): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  await updateProject(id, { featured: !currentFeatured });
  try {
    invalidateCacheTag("projects");
  } catch {}
  revalidatePath("/");
  revalidatePath("/projects");
}

/**
 * Server action to delete a project.
 */
export async function deleteProjectAction(id: string): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  // Clean up GridFS preview before deleting the document
  await deleteProjectPreviewForProject(id);

  await deleteProject(id);
  try {
    invalidateCacheTag("projects");
  } catch {}
  revalidatePath("/");
  revalidatePath("/projects");
}

// ─────────────────────────────────────────────
// Project Preview Image Upload / Remove Actions
// ─────────────────────────────────────────────

const ALLOWED_PREVIEW_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PREVIEW_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Server action to upload or replace a project preview image.
 * Validates session, file type, and file size server-side before writing to GridFS.
 */
export async function uploadProjectPreviewAction(
  projectId: string,
  formDataOrPrevState: FormData | { error?: string; url?: string } | null,
  maybeFormData?: FormData
): Promise<{ error?: string; url?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  let formData: FormData;
  if (formDataOrPrevState instanceof FormData) {
    formData = formDataOrPrevState;
  } else if (maybeFormData instanceof FormData) {
    formData = maybeFormData;
  } else {
    return { error: "No form data received." };
  }

  const file = formData.get("preview") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file received." };
  }

  // Server-side MIME type validation
  if (!ALLOWED_PREVIEW_MIME_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Only JPEG, PNG, and WebP images are accepted." };
  }

  // Server-side size validation
  if (file.size > MAX_PREVIEW_SIZE_BYTES) {
    return { error: "File exceeds the 5 MB size limit." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Double-check size after reading
    if (buffer.length > MAX_PREVIEW_SIZE_BYTES) {
      return { error: "File exceeds the 5 MB size limit." };
    }

    const url = await storeProjectPreviewFile(projectId, buffer, file.type, file.name);

    try {
      invalidateCacheTag("projects");
    } catch {}
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/saint-denis/projects");
    revalidatePath(`/saint-denis/projects/${projectId}`);

    return { url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ProjectPreview] Upload error for project ${projectId}:`, msg);
    return { error: "Upload failed. Please try again." };
  }
}

/**
 * Server action to remove a project preview image.
 * Deletes the GridFS file and clears the previewImage field on the project document.
 */
export async function removeProjectPreviewAction(
  projectId: string
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  try {
    await deleteProjectPreviewForProject(projectId);

    // Clear the previewImage field on the project document
    const { getDatabase } = await import("@/lib/mongodb");
    const { ObjectId } = await import("mongodb");
    const db = await getDatabase();
    if (db) {
      await db.collection("projects").updateOne(
        { _id: new ObjectId(projectId) },
        { $unset: { previewImage: "" }, $set: { updatedAt: new Date() } }
      );
    }

    try {
      invalidateCacheTag("projects");
    } catch {}
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/saint-denis/projects");
    revalidatePath(`/saint-denis/projects/${projectId}`);

    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ProjectPreview] Remove error for project ${projectId}:`, msg);
    return { error: "Failed to remove preview image. Please try again." };
  }
}

