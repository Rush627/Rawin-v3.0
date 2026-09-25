import { cache } from "react";
import { unstable_cache } from "next/cache";
import { invalidateCacheTag } from "./cache";
import { ObjectId, GridFSBucket } from "mongodb";
import type { Readable } from "stream";
import { getDatabase } from "./mongodb";

export type ProjectStatus = "planned" | "in-progress" | "completed";

export interface Project {
  _id?: string;
  slug: string;
  title: string;
  shortName: string;
  tagline: string;
  description: string;
  category: "Full Stack" | "Frontend" | "AI & Cloud" | "Web App" | string;
  technologies: string[];
  status: ProjectStatus;
  featured: boolean;
  displayOrder: number;
  previewImage?: string;
  liveUrl?: string;
  githubUrl?: string;
  caseStudyAvailable: boolean;
  engineeringFocus?: string[];
  problem?: string;
  solution?: string;
  role?: string;
  outcome?: string;
  year?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProjectInput = Omit<Project, "_id" | "createdAt" | "updatedAt">;
export type UpdateProjectInput = Partial<CreateProjectInput>;

const COLLECTION_NAME = "projects";

let projectIndexesEnsured = false;

/**
 * Ensures unique and query performance indexes exist on the projects collection.
 * Idempotent, executes only once in-memory per application instance.
 */
export async function ensureProjectIndexes(): Promise<void> {
  if (projectIndexesEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION_NAME);
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ displayOrder: 1, createdAt: -1 });
    await col.createIndex({ featured: 1, displayOrder: 1 });
    projectIndexesEnsured = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Projects] Error ensuring project indexes:", msg);
  }
}

/**
 * Normalizes MongoDB document into a plain Project object.
 */
function mapProjectDoc(doc: any): Project {
  return {
    _id: doc._id ? doc._id.toString() : undefined,
    slug: doc.slug || "",
    title: doc.title || "",
    shortName: doc.shortName || doc.title || "",
    tagline: doc.tagline || "",
    description: doc.description || "",
    category: doc.category || "Full Stack",
    technologies: Array.isArray(doc.technologies) ? doc.technologies : [],
    status: (doc.status as ProjectStatus) || "completed",
    featured: Boolean(doc.featured),
    displayOrder: typeof doc.displayOrder === "number" ? doc.displayOrder : 999,
    previewImage: doc.previewImage || "",
    liveUrl: doc.liveUrl || "",
    githubUrl: doc.githubUrl || "",
    caseStudyAvailable: Boolean(doc.caseStudyAvailable),
    engineeringFocus: Array.isArray(doc.engineeringFocus) ? doc.engineeringFocus : [],
    problem: doc.problem || "",
    solution: doc.solution || "",
    role: doc.role || "",
    outcome: doc.outcome || "",
    year: doc.year || new Date().getFullYear().toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt || new Date().toISOString(),
  };
}

/**
 * Retrieves all projects sorted by displayOrder ascending, then createdAt descending.
 */
async function fetchProjectsFromDb(): Promise<Project[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];
    const docs = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();
    return docs.map(mapProjectDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Projects] Error fetching projects:", msg);
    return [];
  }
}

const getCachedProjects = unstable_cache(
  async () => fetchProjectsFromDb(),
  ["projects-all"],
  {
    tags: ["projects"],
    revalidate: 3600,
  }
);

export const getProjects = cache(async (): Promise<Project[]> => {
  return getCachedProjects();
});

/**
 * Retrieves only featured projects sorted by displayOrder ascending.
 */
async function fetchFeaturedProjectsFromDb(): Promise<Project[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];
    const docs = await db
      .collection(COLLECTION_NAME)
      .find({ featured: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();
    return docs.map(mapProjectDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Projects] Error fetching featured projects:", msg);
    return [];
  }
}

const getCachedFeaturedProjects = unstable_cache(
  async () => fetchFeaturedProjectsFromDb(),
  ["projects-featured"],
  {
    tags: ["projects"],
    revalidate: 3600,
  }
);

export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  return getCachedFeaturedProjects();
});

/**
 * Retrieves a single project by unique slug.
 */
async function fetchProjectBySlugFromDb(slug: string): Promise<Project | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;
    const doc = await db.collection(COLLECTION_NAME).findOne({ slug: slug.trim().toLowerCase() });
    return doc ? mapProjectDoc(doc) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Projects] Error fetching project by slug (${slug}):`, msg);
    return null;
  }
}

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const fetcher = unstable_cache(
    async () => fetchProjectBySlugFromDb(slug),
    [`project-slug-${slug.trim().toLowerCase()}`],
    {
      tags: ["projects"],
      revalidate: 3600,
    }
  );
  return fetcher();
});

/**
 * Retrieves a single project by MongoDB ObjectId.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;
    if (!ObjectId.isValid(id)) return null;
    const doc = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
    return doc ? mapProjectDoc(doc) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Projects] Error fetching project by id (${id}):`, msg);
    return null;
  }
}

/**
 * Inserts a new project into the database.
 */
export async function createProject(data: CreateProjectInput): Promise<Project | null> {
  await ensureProjectIndexes();
  try {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");

    const now = new Date();
    const docToInsert = {
      ...data,
      slug: data.slug.trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(docToInsert);

    try {
      invalidateCacheTag("projects");
    } catch {
      // Ignore outside request context
    }

    return {
      _id: result.insertedId.toString(),
      ...docToInsert,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Projects] Error creating project:", msg);
    throw new Error(msg);
  }
}

/**
 * Updates an existing project by its MongoDB ObjectId.
 */
export async function updateProject(id: string, data: UpdateProjectInput): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    if (!ObjectId.isValid(id)) throw new Error("Invalid project ID format.");

    const updateFields: Record<string, any> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.slug) {
      updateFields.slug = data.slug.trim().toLowerCase();
    }

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    try {
      invalidateCacheTag("projects");
    } catch {
      // Ignore outside request context
    }

    return result.matchedCount > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Projects] Error updating project (${id}):`, msg);
    throw new Error(msg);
  }
}

/**
 * Deletes a project by its MongoDB ObjectId.
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    if (!ObjectId.isValid(id)) throw new Error("Invalid project ID format.");

    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    try {
      invalidateCacheTag("projects");
    } catch {
      // Ignore outside request context
    }

    return result.deletedCount > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Projects] Error deleting project (${id}):`, msg);
    throw new Error(msg);
  }
}

// ─────────────────────────────────────────────
// Project Preview Image : GridFS functions
// ─────────────────────────────────────────────

const PROJECT_ASSET_BUCKET = "site_assets";
const PROJECT_PREVIEW_ASSET_TYPE = "projectPreview";

/**
 * Stores a project preview image in GridFS using atomic replacement.
 * 1. Uploads new binary stream first to obtain new GridFS ObjectId.
 * 2. Updates the project document's previewImage with the immutable path-based URL (/api/projects/preview/${projectId}/${fileId}).
 * 3. Deletes prior preview files ONLY after MongoDB update succeeds.
 * 4. If MongoDB update fails, rolls back newly uploaded GridFS file.
 */
export async function storeProjectPreviewFile(
  projectId: string,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  if (!ObjectId.isValid(projectId)) throw new Error("Invalid project ID.");

  const bucket = new GridFSBucket(db, { bucketName: PROJECT_ASSET_BUCKET });

  // 1. Upload new binary FIRST
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const uploadStream = bucket.openUploadStream(safeFilename, {
    metadata: {
      contentType: mimeType,
      assetType: PROJECT_PREVIEW_ASSET_TYPE,
      projectId,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });

  const fileId = uploadStream.id.toString();
  const url = `/api/projects/preview/${projectId}/${fileId}`;

  // 2. Update the project document with the new path-based URL reference
  try {
    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { previewImage: url, updatedAt: new Date() } }
    );
  } catch (dbErr) {
    // Rollback: delete newly uploaded file if DB update fails so we don't leave orphaned files
    await bucket.delete(uploadStream.id).catch(() => {});
    throw dbErr;
  }

  // 3. Delete prior GridFS files for this project ONLY after successful DB update
  try {
    const existing = await bucket
      .find({
        "metadata.assetType": PROJECT_PREVIEW_ASSET_TYPE,
        "metadata.projectId": projectId,
        _id: { $ne: uploadStream.id },
      })
      .toArray();
    for (const f of existing) {
      await bucket.delete(f._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[Projects] Prior preview cleanup notice:", cleanErr);
  }

  try {
    invalidateCacheTag("projects");
  } catch {
    // Ignore outside request context
  }

  return url;
}

/**
 * Retrieves the preview image stream for a project from GridFS.
 * When fileId is supplied, retrieves the exact file by its GridFS ObjectId.
 * When fileId is omitted, falls back to the most recent preview file for the project (legacy compatibility).
 */
export async function getProjectPreviewStream(
  projectId: string,
  fileId?: string
): Promise<{ stream: Readable; contentType: string; filename: string } | null> {
  const db = await getDatabase();
  if (!db) return null;
  if (!ObjectId.isValid(projectId)) return null;

  const bucket = new GridFSBucket(db, { bucketName: PROJECT_ASSET_BUCKET });

  let file: any = null;

  if (fileId) {
    if (!ObjectId.isValid(fileId)) return null;
    const files = await bucket
      .find({ _id: new ObjectId(fileId) })
      .limit(1)
      .toArray();
    if (files && files.length > 0) {
      file = files[0];
    }
  } else {
    // Legacy fallback: retrieve newest preview for project
    const files = await bucket
      .find({ "metadata.assetType": PROJECT_PREVIEW_ASSET_TYPE, "metadata.projectId": projectId })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();
    if (files && files.length > 0) {
      file = files[0];
    }
  }

  if (!file) return null;

  const stream = bucket.openDownloadStream(file._id);
  const contentType =
    (file.metadata as any)?.contentType ||
    (file as any).contentType ||
    "application/octet-stream";

  return {
    stream: stream as unknown as Readable,
    contentType,
    filename: file.filename,
  };
}

/**
 * Deletes all GridFS preview images associated with a project.
 * Call this before deleteProject() to avoid orphaned GridFS files.
 */
export async function deleteProjectPreviewForProject(projectId: string): Promise<void> {
  if (!ObjectId.isValid(projectId)) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const bucket = new GridFSBucket(db, { bucketName: PROJECT_ASSET_BUCKET });
    const files = await bucket
      .find({ "metadata.assetType": PROJECT_PREVIEW_ASSET_TYPE, "metadata.projectId": projectId })
      .toArray();
    for (const f of files) {
      await bucket.delete(f._id).catch(() => {});
    }
  } catch (err) {
    console.warn(`[Projects] Preview delete notice for project ${projectId}:`, err);
  }
}

