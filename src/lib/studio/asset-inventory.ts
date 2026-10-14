import { getDatabase } from "../mongodb";

export interface InventoryFile {
  id: string;
  name: string;
  kind: string;
  bytes: number;
  uploadedAt: string | null;
}

/**
 * Read-only inventory of GridFS asset files and whether anything references them. A file
 * counts as referenced when its id appears anywhere in the site content document, a project or
 * an article (that is where every asset URL is stored). Nothing is ever deleted from here.
 */
export async function getAssetInventory(): Promise<{ total: number; totalBytes: number; orphans: InventoryFile[] } | null> {
  const db = await getDatabase();
  if (!db) return null;
  const [site, projects, posts, files] = await Promise.all([
    db.collection("site_content").findOne({ key: "main" }),
    db.collection("projects").find({}).toArray(),
    db.collection("blogPosts").find({}).toArray(),
    db.collection("site_assets.files").find({}, { projection: { filename: 1, length: 1, uploadDate: 1, metadata: 1 } }).toArray(),
  ]);
  const haystack = JSON.stringify([site, projects, posts]);
  const orphans: InventoryFile[] = [];
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += Number(f.length) || 0;
    const id = String(f._id);
    if (haystack.includes(id)) continue;
    orphans.push({
      id,
      name: String(f.filename || ""),
      kind: String(f.metadata?.assetType || "unknown"),
      bytes: Number(f.length) || 0,
      uploadedAt: f.uploadDate instanceof Date ? f.uploadDate.toISOString() : null,
    });
  }
  return { total: files.length, totalBytes, orphans };
}
