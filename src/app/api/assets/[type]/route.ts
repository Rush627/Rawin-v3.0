import { NextRequest, NextResponse } from "next/server";
import { getAssetFile } from "@/lib/site-content";
import { assetRouteTarget } from "@/lib/brand-assets";
import { Readable } from "stream";

/**
 * Legacy unversioned asset URL: serves the newest file stored for the slot (short cache), or
 * the bundled default when there is none.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type: rawType } = await context.params;
  const target = assetRouteTarget(rawType);
  if (!target) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  try {
    const asset = await getAssetFile(target.key);
    if (asset && asset.stream) {
      const webStream = Readable.toWeb(asset.stream) as ReadableStream;
      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "Content-Disposition": `inline; filename="${asset.filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
        },
      });
    }
  } catch (err) {
    console.warn(`[AssetAPI] Asset unavailable (${target.key}):`, err instanceof Error ? err.message : String(err));
  }

  if (!target.fallback) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(target.fallback, req.url), 307);
}
