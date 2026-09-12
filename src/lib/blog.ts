import { ObjectId } from "mongodb";
import { GridFSBucket } from "mongodb";
import type { Readable } from "stream";
import { getDatabase } from "./mongodb";

export type BlogPostStatus = "draft" | "published" | "archived";

export interface BlogPost {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  readTime: string;
  status: BlogPostStatus;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBlogPostInput = Omit<BlogPost, "_id" | "createdAt" | "updatedAt">;
export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

const COLLECTION_NAME = "blogPosts";

let indexesEnsured = false;

/**
 * Ensures unique and search indexes exist on the blog collection.
 * Idempotent and called automatically on initial access.
 */
export async function ensureBlogIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION_NAME);
    await col.createIndex({ slug: 1 }, { unique: true });
    await col.createIndex({ status: 1, publishedAt: -1 });
    indexesEnsured = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blog] Error ensuring blog indexes:", msg);
  }
}

/**
 * Normalizes MongoDB document into a typed BlogPost object.
 */
function mapBlogDoc(doc: any): BlogPost {
  return {
    _id: doc._id ? doc._id.toString() : undefined,
    slug: doc.slug || "",
    title: doc.title || "",
    excerpt: doc.excerpt || "",
    content: doc.content || "",
    coverImage: doc.coverImage && doc.coverImage.trim() ? doc.coverImage.trim() : undefined,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    readTime: doc.readTime || "5 min read",
    status: (doc.status as BlogPostStatus) || "draft",
    featured: Boolean(doc.featured),
    publishedAt: doc.publishedAt instanceof Date
      ? doc.publishedAt.toISOString()
      : doc.publishedAt || undefined,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : doc.updatedAt || new Date().toISOString(),
  };
}

/**
 * Retrieves all published posts for the public website, sorted by published date descending.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    await ensureBlogIndexes();
    const db = await getDatabase();
    if (!db) return [];

    const docs = await db
      .collection(COLLECTION_NAME)
      .find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();

    return docs.map(mapBlogDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blog] Error fetching published posts:", msg);
    return [];
  }
}

/**
 * Retrieves published posts marked as featured.
 */
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  try {
    await ensureBlogIndexes();
    const db = await getDatabase();
    if (!db) return [];

    const docs = await db
      .collection(COLLECTION_NAME)
      .find({ status: "published", featured: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();

    return docs.map(mapBlogDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blog] Error fetching featured posts:", msg);
    return [];
  }
}

/**
 * Retrieves a single post by unique slug.
 * By default (includeUnpublished = false), only returns the post if its status is "published".
 */
export async function getPostBySlug(slug: string, includeUnpublished = false): Promise<BlogPost | null> {
  try {
    await ensureBlogIndexes();
    const db = await getDatabase();
    if (!db) return null;

    const normalizedSlug = slug.trim().toLowerCase();
    const query: Record<string, any> = { slug: normalizedSlug };

    if (!includeUnpublished) {
      query.status = "published";
    }

    const doc = await db.collection(COLLECTION_NAME).findOne(query);
    return doc ? mapBlogDoc(doc) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Blog] Error fetching post by slug (${slug}):`, msg);
    return null;
  }
}

/**
 * Retrieves a single post by MongoDB ObjectId (used by the admin editor).
 */
export async function getPostById(id: string): Promise<BlogPost | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;
    if (!ObjectId.isValid(id)) return null;

    const doc = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
    return doc ? mapBlogDoc(doc) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Blog] Error fetching post by id (${id}):`, msg);
    return null;
  }
}

/**
 * Retrieves all posts regardless of status (draft, published, archived) for the admin dashboard.
 */
export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  try {
    await ensureBlogIndexes();
    const db = await getDatabase();
    if (!db) return [];

    const docs = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map(mapBlogDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blog] Error fetching admin posts:", msg);
    return [];
  }
}

/**
 * Creates a new blog post in MongoDB.
 */
export async function createPost(data: CreateBlogPostInput): Promise<BlogPost | null> {
  try {
    await ensureBlogIndexes();
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");

    const now = new Date();
    const normalizedSlug = data.slug.trim().toLowerCase();

    let publishedDate = data.publishedAt ? new Date(data.publishedAt) : undefined;
    if (data.status === "published" && !publishedDate) {
      publishedDate = now;
    }

    const docToInsert = {
      ...data,
      slug: normalizedSlug,
      publishedAt: publishedDate,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(docToInsert);
    return {
      _id: result.insertedId.toString(),
      ...data,
      slug: normalizedSlug,
      publishedAt: publishedDate ? publishedDate.toISOString() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Blog] Error creating post:", msg);
    throw new Error(msg);
  }
}

/**
 * Updates an existing blog post by its MongoDB ObjectId.
 */
export async function updatePost(id: string, data: UpdateBlogPostInput): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    if (!ObjectId.isValid(id)) throw new Error("Invalid post ID format.");

    const now = new Date();
    const updateFields: Record<string, any> = {
      ...data,
      updatedAt: now,
    };

    if (data.slug) {
      updateFields.slug = data.slug.trim().toLowerCase();
    }

    if (data.status === "published") {
      if (data.publishedAt) {
        updateFields.publishedAt = new Date(data.publishedAt);
      } else {
        // If transitioning to published and no date set, check existing or assign now
        const existing = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
        if (!existing?.publishedAt) {
          updateFields.publishedAt = now;
        }
      }
    } else if (data.status === "draft" || data.status === "archived") {
      if (data.publishedAt) {
        updateFields.publishedAt = new Date(data.publishedAt);
      }
    }

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return result.matchedCount > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Blog] Error updating post (${id}):`, msg);
    throw new Error(msg);
  }
}

/**
 * Deletes a blog post permanently by its MongoDB ObjectId.
 * NOTE: Callers should also call deleteBlogCoverForPost(id) before calling this
 * to ensure associated GridFS covers are cleaned up.
 */
export async function deletePost(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db) throw new Error("Database connection unavailable.");
    if (!ObjectId.isValid(id)) throw new Error("Invalid post ID format.");

    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Blog] Error deleting post (${id}):`, msg);
    throw new Error(msg);
  }
}

// ─────────────────────────────────────────────
// Blog Cover Image : GridFS functions
// ─────────────────────────────────────────────

const BLOG_ASSET_BUCKET = "site_assets";
const BLOG_COVER_ASSET_TYPE = "blogCover";

/**
 * Stores a blog post cover image in GridFS, replacing any prior cover for the same post.
 * Updates the post document's coverImage field with a cache-busted URL reference.
 */
export async function storeBlogCoverFile(
  postId: string,
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  if (!ObjectId.isValid(postId)) throw new Error("Invalid post ID.");

  const bucket = new GridFSBucket(db, { bucketName: BLOG_ASSET_BUCKET });

  // Remove any prior GridFS files for this post's cover
  try {
    const existing = await bucket
      .find({ "metadata.assetType": BLOG_COVER_ASSET_TYPE, "metadata.postId": postId })
      .toArray();
    for (const f of existing) {
      await bucket.delete(f._id).catch(() => {});
    }
  } catch (cleanErr) {
    console.warn("[Blog] Cover cleanup notice:", cleanErr);
  }

  // Upload new binary
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const uploadStream = bucket.openUploadStream(safeFilename, {
    metadata: {
      contentType: mimeType,
      assetType: BLOG_COVER_ASSET_TYPE,
      postId,
      uploadedAt: new Date(),
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (err) => reject(err));
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });

  const url = `/api/blog/cover/${postId}?v=${Date.now()}`;

  // Update the blog post document with the new URL reference
  await db.collection(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(postId) },
    { $set: { coverImage: url, updatedAt: new Date() } }
  );

  return url;
}

/**
 * Retrieves the cover image stream for a blog post from GridFS.
 */
export async function getBlogCoverStream(
  postId: string
): Promise<{ stream: Readable; contentType: string; filename: string } | null> {
  const db = await getDatabase();
  if (!db) return null;
  if (!ObjectId.isValid(postId)) return null;

  const bucket = new GridFSBucket(db, { bucketName: BLOG_ASSET_BUCKET });
  const files = await bucket
    .find({ "metadata.assetType": BLOG_COVER_ASSET_TYPE, "metadata.postId": postId })
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray();

  if (!files || files.length === 0) return null;

  const file = files[0];
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
 * Deletes all GridFS cover images associated with a blog post.
 * Call this before deletePost() to avoid orphaned GridFS files.
 */
export async function deleteBlogCoverForPost(postId: string): Promise<void> {
  if (!ObjectId.isValid(postId)) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const bucket = new GridFSBucket(db, { bucketName: BLOG_ASSET_BUCKET });
    const files = await bucket
      .find({ "metadata.assetType": BLOG_COVER_ASSET_TYPE, "metadata.postId": postId })
      .toArray();
    for (const f of files) {
      await bucket.delete(f._id).catch(() => {});
    }
  } catch (err) {
    console.warn(`[Blog] Cover delete notice for post ${postId}:`, err);
  }
}
