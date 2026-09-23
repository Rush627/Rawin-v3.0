"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  storeBlogCoverFile,
  deleteBlogCoverForPost,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type BlogPostStatus,
} from "@/lib/blog";
import { parseKolkataDateTimeInput } from "@/lib/dateUtils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Server action to create a new blog post.
 */
export async function createPostAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const title = (formData.get("title") as string || "").trim();
  let slug = (formData.get("slug") as string || "").trim();
  const author = (formData.get("author") as string || "").trim();
  const excerpt = (formData.get("excerpt") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const coverImage = (formData.get("coverImage") as string || "").trim();
  const rawTags = (formData.get("tags") as string || "").trim();
  const readTime = (formData.get("readTime") as string || "5 min read").trim();
  const status = (formData.get("status") as BlogPostStatus) || "draft";
  const featured = formData.get("featured") === "on" || formData.get("featured") === "true";
  const rawPublishedAt = (formData.get("publishedAt") as string || "").trim();

  if (!title) {
    return { error: "Post title is required." };
  }
  if (title.length > 200) {
    return { error: "Post title must not exceed 200 characters." };
  }

  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  if (!slug) {
    return { error: "A valid URL slug is required." };
  }
  if (slug.length > 120) {
    return { error: "Post slug must not exceed 120 characters." };
  }

  if (excerpt.length > 500) {
    return { error: "Post excerpt must not exceed 500 characters." };
  }

  if (!content) {
    return { error: "Post Markdown content cannot be empty." };
  }
  if (content.length > 100000) {
    return { error: "Post Markdown content exceeds maximum length of 100,000 characters." };
  }

  if (coverImage.length > 500) {
    return { error: "Cover image URL must not exceed 500 characters." };
  }
  if (readTime.length > 30) {
    return { error: "Read time text must not exceed 30 characters." };
  }

  const tags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (tags.length > 15) {
    return { error: "Tags list must not exceed 15 items." };
  }
  for (const tag of tags) {
    if (tag.length > 40) {
      return { error: `Tag "${tag.slice(0, 20)}..." exceeds 40 characters.` };
    }
  }

  if (author.length > 100) {
    return { error: "Author name must not exceed 100 characters." };
  }

  const input: CreateBlogPostInput = {
    slug,
    title,
    author: author || undefined,
    excerpt,
    content,
    tags,
    readTime,
    status,
    featured,
    publishedAt: rawPublishedAt ? parseKolkataDateTimeInput(rawPublishedAt) : undefined,
  };

  try {
    const createdPost = await createPost(input);
    if (createdPost?._id) {
      const coverFile = formData.get("cover") as File | null;
      if (
        coverFile &&
        coverFile.size > 0 &&
        ALLOWED_COVER_MIME_TYPES.includes(coverFile.type) &&
        coverFile.size <= MAX_COVER_SIZE_BYTES
      ) {
        const buffer = Buffer.from(await coverFile.arrayBuffer());
        if (buffer.length <= MAX_COVER_SIZE_BYTES) {
          await storeBlogCoverFile(createdPost._id, buffer, coverFile.type, coverFile.name);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      return { error: `An article with the slug "${slug}" already exists. Please choose a unique slug.` };
    }
    console.error("[Blog Action Error] Unexpected createPost failure:", err);
    return { error: "An unexpected error occurred while saving the post. Please try again." };
  }

  try {
    revalidateTag("blog", "max");
  } catch {}
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/saint-denis/blog");
  redirect("/saint-denis/blog");
}

/**
 * Server action to update an existing blog post.
 */
export async function updatePostAction(
  id: string,
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  const title = (formData.get("title") as string || "").trim();
  let slug = (formData.get("slug") as string || "").trim();
  const author = (formData.get("author") as string || "").trim();
  const excerpt = (formData.get("excerpt") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const coverImage = (formData.get("coverImage") as string || "").trim();
  const rawTags = (formData.get("tags") as string || "").trim();
  const readTime = (formData.get("readTime") as string || "5 min read").trim();
  const status = (formData.get("status") as BlogPostStatus) || "draft";
  const featured = formData.get("featured") === "on" || formData.get("featured") === "true";
  const rawPublishedAt = (formData.get("publishedAt") as string || "").trim();

  if (!title) {
    return { error: "Post title is required." };
  }
  if (title.length > 200) {
    return { error: "Post title must not exceed 200 characters." };
  }

  if (!slug) {
    slug = slugify(title);
  } else {
    slug = slugify(slug);
  }

  if (!slug) {
    return { error: "A valid URL slug is required." };
  }
  if (slug.length > 120) {
    return { error: "Post slug must not exceed 120 characters." };
  }

  if (excerpt.length > 500) {
    return { error: "Post excerpt must not exceed 500 characters." };
  }

  if (!content) {
    return { error: "Post Markdown content cannot be empty." };
  }
  if (content.length > 100000) {
    return { error: "Post Markdown content exceeds maximum length of 100,000 characters." };
  }

  if (coverImage.length > 500) {
    return { error: "Cover image URL must not exceed 500 characters." };
  }
  if (readTime.length > 30) {
    return { error: "Read time text must not exceed 30 characters." };
  }

  const tags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (tags.length > 15) {
    return { error: "Tags list must not exceed 15 items." };
  }
  for (const tag of tags) {
    if (tag.length > 40) {
      return { error: `Tag "${tag.slice(0, 20)}..." exceeds 40 characters.` };
    }
  }

  if (author.length > 100) {
    return { error: "Author name must not exceed 100 characters." };
  }

  const input: UpdateBlogPostInput = {
    slug,
    title,
    author: author || "",
    excerpt,
    content,
    tags,
    readTime,
    status,
    featured,
    publishedAt: rawPublishedAt ? parseKolkataDateTimeInput(rawPublishedAt) : undefined,
  };

  if (coverImage) {
    input.coverImage = coverImage;
  }

  try {
    await updatePost(id, input);
    if (formData.get("removeCover") === "true") {
      await deleteBlogCoverForPost(id);
      const { getDatabase } = await import("@/lib/mongodb");
      const { ObjectId } = await import("mongodb");
      const db = await getDatabase();
      if (db) {
        await db.collection("blogPosts").updateOne(
          { _id: new ObjectId(id) },
          { $unset: { coverImage: "" }, $set: { updatedAt: new Date() } }
        );
      }
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      return { error: `An article with the slug "${slug}" already exists. Please choose a unique slug.` };
    }
    console.error("[Blog Action Error] Unexpected updatePost failure:", err);
    return { error: "An unexpected error occurred while updating the post. Please try again." };
  }

  try {
    revalidateTag("blog", "max");
  } catch {}
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/saint-denis/blog");
  redirect("/saint-denis/blog");
}

/**
 * Server action to toggle the featured flag on a post.
 */
export async function togglePostFeaturedAction(id: string, currentFeatured: boolean): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  await updatePost(id, { featured: !currentFeatured });

  try {
    revalidateTag("blog", "max");
  } catch {}
  revalidatePath("/");
  revalidatePath("/blog");
}

/**
 * Server action to update a post status (draft, published, archived).
 */
export async function setPostStatusAction(id: string, newStatus: BlogPostStatus): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  const post = await getPostById(id);
  await updatePost(id, { status: newStatus });

  try {
    revalidateTag("blog", "max");
  } catch {}
  revalidatePath("/");
  revalidatePath("/blog");
  if (post?.slug) {
    revalidatePath(`/blog/${post.slug}`);
  }
}

/**
 * Server action to permanently delete a post and its associated GridFS cover image.
 */
export async function deletePostAction(id: string): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized.");
  }

  const post = await getPostById(id);

  // Clean up GridFS cover before deleting the document
  await deleteBlogCoverForPost(id);

  await deletePost(id);

  try {
    revalidateTag("blog", "max");
  } catch {}
  revalidatePath("/");
  revalidatePath("/blog");
  if (post?.slug) {
    revalidatePath(`/blog/${post.slug}`);
  }
}

// ─────────────────────────────────────────────
// Blog Cover Image Upload / Remove Actions
// ─────────────────────────────────────────────

const ALLOWED_COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Server action to upload or replace a blog post cover image.
 * Validates session, file type, and file size server-side before writing to GridFS.
 */
export async function uploadBlogCoverAction(
  postId: string,
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

  const file = formData.get("cover") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file received." };
  }

  // Server-side MIME type validation
  if (!ALLOWED_COVER_MIME_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Only JPEG, PNG, and WebP images are accepted." };
  }

  // Server-side size validation
  if (file.size > MAX_COVER_SIZE_BYTES) {
    return { error: "File exceeds the 5 MB size limit." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Double-check size after reading
    if (buffer.length > MAX_COVER_SIZE_BYTES) {
      return { error: "File exceeds the 5 MB size limit." };
    }

    const url = await storeBlogCoverFile(postId, buffer, file.type, file.name);
    const post = await getPostById(postId);

    try {
      revalidateTag("blog", "max");
    } catch {}
    revalidatePath("/blog");
    if (post?.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }
    revalidatePath("/saint-denis/blog");
    revalidatePath(`/saint-denis/blog/${postId}`);

    return { url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[BlogCover] Upload error for post ${postId}:`, msg);
    return { error: "Upload failed. Please try again." };
  }
}

/**
 * Server action to remove a blog post cover image.
 * Deletes the GridFS file and clears the coverImage field on the post document.
 */
export async function removeBlogCoverAction(
  postId: string
): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Administrator session required." };
  }

  try {
    const post = await getPostById(postId);
    await deleteBlogCoverForPost(postId);

    // Clear the coverImage field on the post document
    const { getDatabase } = await import("@/lib/mongodb");
    const { ObjectId } = await import("mongodb");
    const db = await getDatabase();
    if (db) {
      await db.collection("blogPosts").updateOne(
        { _id: new ObjectId(postId) },
        { $unset: { coverImage: "" }, $set: { updatedAt: new Date() } }
      );
    }

    try {
      revalidateTag("blog", "max");
    } catch {}
    revalidatePath("/blog");
    if (post?.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }
    revalidatePath("/saint-denis/blog");
    revalidatePath(`/saint-denis/blog/${postId}`);

    return {};
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[BlogCover] Remove error for post ${postId}:`, msg);
    return { error: "Failed to remove cover image. Please try again." };
  }
}

