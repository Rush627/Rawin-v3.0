import { NextRequest, NextResponse } from "next/server";
import { getAssetFile, type AssetKey } from "@/lib/site-content";
import { Readable } from "stream";

const FALLBACK_ASSETS: Record<AssetKey, string> = {
  profilePhoto: "/images/profile.png",
  logo: "/images/logo.png",
  favicon: "/favicon.png",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type: rawType } = await context.params;

  let assetKey: AssetKey;
  if (rawType === "profile" || rawType === "profilePhoto") {
    assetKey = "profilePhoto";
  } else if (rawType === "logo") {
    assetKey = "logo";
  } else if (rawType === "favicon" || rawType === "icon") {
    assetKey = "favicon";
  } else {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  try {
    const asset = await getAssetFile(assetKey);

    if (asset && asset.stream) {
      // Convert Node.js stream to Web standard ReadableStream
      const webStream = Readable.toWeb(asset.stream) as ReadableStream;
      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Disposition": `inline; filename="${asset.filename}"`,
        },
      });
    }
  } catch (err) {
    console.warn(`[AssetAPI] Notice while serving asset (${assetKey}):`, err);
  }

  // Graceful fallback to static file if not in GridFS or database is unavailable
  const fallbackUrl = FALLBACK_ASSETS[assetKey];
  return NextResponse.redirect(new URL(fallbackUrl, req.url), 307);
}
