import { NextRequest, NextResponse } from "next/server";
import { getAssetFile } from "@/lib/site-content";
import { assetRouteTarget } from "@/lib/brand-assets";
import { Readable } from "stream";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * Versioned identity asset (the file id is in the URL, so the bytes never change: immutable).
 * A missing file falls back to the bundled default for that slot; milestone images have none
 * and answer 404.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string; fileId: string }> }
) {
  const { type: rawType, fileId } = await context.params;

  if (!fileId || !ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid asset file ID" }, { status: 400 });
  }
  const target = assetRouteTarget(rawType);
  if (!target) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  try {
    const asset = await getAssetFile(target.key, fileId);
    if (asset && asset.stream) {
      const webStream = Readable.toWeb(asset.stream) as ReadableStream;
      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Disposition": `inline; filename="${asset.filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
        },
      });
    }
  } catch (err) {
    console.warn(`[AssetAPI] Versioned asset unavailable (${target.key}/${fileId}):`, err instanceof Error ? err.message : String(err));
  }

  if (!target.fallback) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(target.fallback, req.url), 307);
}
