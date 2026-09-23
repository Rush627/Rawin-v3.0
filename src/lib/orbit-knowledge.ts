import { cache } from "react";
import { unstable_cache } from "next/cache";
import { invalidateCacheTag } from "./cache";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

export type OrbitKnowledgeCategory =
  | "profile"
  | "education"
  | "skills"
  | "rawin"
  | "orbit"
  | "custom";

export type OrbitKnowledgePriority = "high" | "normal" | "low";
export type OrbitKnowledgeStatus = "current" | "historical";

export interface OrbitKnowledgeItem {
  _id: string;
  category: OrbitKnowledgeCategory;
  title: string;
  content: string;
  enabled: boolean;
  priority: OrbitKnowledgePriority;
  status: OrbitKnowledgeStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateOrbitKnowledgeInput = Omit<
  OrbitKnowledgeItem,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdateOrbitKnowledgeInput = Partial<CreateOrbitKnowledgeInput>;

const COLLECTION_NAME = "orbit_knowledge";

let indexesEnsured = false;

/**
 * Ensures indexes on the orbit_knowledge collection for performant queries.
 * Idempotent, executes only once in-memory per application instance.
 */
export async function ensureOrbitKnowledgeIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const col = db.collection(COLLECTION_NAME);
    await col.createIndex({ category: 1, enabled: 1 });
    await col.createIndex({ enabled: 1, priority: 1, status: 1 });
    await col.createIndex({ updatedAt: -1 });
    indexesEnsured = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error ensuring indexes:", msg);
  }
}

/**
 * Returns all orbit knowledge items, optionally filtered by category and enabled flag.
 */
async function fetchOrbitKnowledgeListFromDb(): Promise<OrbitKnowledgeItem[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];

    const docs = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      category: (doc.category || "custom") as OrbitKnowledgeCategory,
      title: doc.title || "",
      content: doc.content || "",
      enabled: doc.enabled !== false,
      priority: (doc.priority || "normal") as OrbitKnowledgePriority,
      status: (doc.status || "current") as OrbitKnowledgeStatus,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error retrieving knowledge list:", msg);
    return [];
  }
}

const getCachedOrbitKnowledgeAll = unstable_cache(
  async () => fetchOrbitKnowledgeListFromDb(),
  ["orbit-knowledge-all"],
  {
    tags: ["orbit-knowledge"],
    revalidate: 3600,
  }
);

export const getOrbitKnowledgeList = cache(async (filter?: {
  category?: OrbitKnowledgeCategory;
  enabledOnly?: boolean;
}): Promise<OrbitKnowledgeItem[]> => {
  const allItems = await getCachedOrbitKnowledgeAll();
  if (!filter || (!filter.category && !filter.enabledOnly)) {
    return allItems;
  }
  return allItems.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.enabledOnly && !item.enabled) return false;
    return true;
  });
});

/**
 * Returns a single orbit knowledge item by its string ID.
 */
export async function getOrbitKnowledgeById(id: string): Promise<OrbitKnowledgeItem | null> {
  try {
    const db = await getDatabase();
    if (!db || !ObjectId.isValid(id)) return null;

    const doc = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return {
      _id: doc._id.toString(),
      category: (doc.category || "custom") as OrbitKnowledgeCategory,
      title: doc.title || "",
      content: doc.content || "",
      enabled: doc.enabled !== false,
      priority: (doc.priority || "normal") as OrbitKnowledgePriority,
      status: (doc.status || "current") as OrbitKnowledgeStatus,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error retrieving knowledge item by id:", msg);
    return null;
  }
}

/**
 * Creates a new knowledge record in MongoDB with verified server timestamps.
 */
export async function createOrbitKnowledge(
  input: CreateOrbitKnowledgeInput
): Promise<OrbitKnowledgeItem> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  await ensureOrbitKnowledgeIndexes();

  const now = new Date().toISOString();
  const docToInsert = {
    category: input.category,
    title: input.title.trim(),
    content: input.content.trim(),
    enabled: input.enabled !== false,
    priority: input.priority || "normal",
    status: input.status || "current",
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION_NAME).insertOne(docToInsert);

  try {
    invalidateCacheTag("orbit-knowledge");
  } catch {}

  return {
    _id: result.insertedId.toString(),
    ...docToInsert,
  };
}

/**
 * Updates an existing knowledge record in MongoDB with a fresh server timestamp.
 */
export async function updateOrbitKnowledge(
  id: string,
  input: UpdateOrbitKnowledgeInput
): Promise<OrbitKnowledgeItem | null> {
  const db = await getDatabase();
  if (!db) {
    throw new Error("Database connection unavailable.");
  }

  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid knowledge item ID format.");
  }

  const updateFields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.category !== undefined) updateFields.category = input.category;
  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.content !== undefined) updateFields.content = input.content.trim();
  if (input.enabled !== undefined) updateFields.enabled = Boolean(input.enabled);
  if (input.priority !== undefined) updateFields.priority = input.priority;
  if (input.status !== undefined) updateFields.status = input.status;

  const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  if (!result) return null;

  try {
    invalidateCacheTag("orbit-knowledge");
  } catch {}

  return {
    _id: result._id.toString(),
    category: (result.category || "custom") as OrbitKnowledgeCategory,
    title: result.title || "",
    content: result.content || "",
    enabled: result.enabled !== false,
    priority: (result.priority || "normal") as OrbitKnowledgePriority,
    status: (result.status || "current") as OrbitKnowledgeStatus,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
  };
}

/**
 * Deletes a knowledge record by string ID.
 */
export async function deleteOrbitKnowledge(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db || !ObjectId.isValid(id)) return false;

    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      try {
        invalidateCacheTag("orbit-knowledge");
      } catch {}
      return true;
    }
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error deleting item:", msg);
    return false;
  }
}

/**
 * Toggles the enabled state of a knowledge record.
 */
export async function toggleOrbitKnowledgeEnabled(
  id: string,
  enabled: boolean
): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (!db || !ObjectId.isValid(id)) return false;

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          enabled: Boolean(enabled),
          updatedAt: new Date().toISOString(),
        },
      }
    );
    if (result.matchedCount === 1) {
      try {
        invalidateCacheTag("orbit-knowledge");
      } catch {}
      return true;
    }
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error toggling item enabled state:", msg);
    return false;
  }
}

/**
 * Retrieves all active (enabled) knowledge items formatted and ordered deterministically
 * for AI context compilation:
 * Priority: high > normal > low
 * Status: current > historical
 * Updated: recent first
 */
export async function getActiveOrbitKnowledgeForAura(): Promise<OrbitKnowledgeItem[]> {
  try {
    const items = await getOrbitKnowledgeList({ enabledOnly: true });

    const priorityWeight: Record<OrbitKnowledgePriority, number> = {
      high: 3,
      normal: 2,
      low: 1,
    };

    const statusWeight: Record<OrbitKnowledgeStatus, number> = {
      current: 2,
      historical: 1,
    };

    return items.sort((a, b) => {
      // 1. Priority sorting
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;

      // 2. Status sorting (current before historical)
      const sDiff = (statusWeight[b.status] || 2) - (statusWeight[a.status] || 2);
      if (sDiff !== 0) return sDiff;

      // 3. Category sorting
      const cDiff = a.category.localeCompare(b.category);
      if (cDiff !== 0) return cDiff;

      // 4. Most recently updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OrbitKnowledge] Error fetching active knowledge for Aura:", msg);
    return [];
  }
}
