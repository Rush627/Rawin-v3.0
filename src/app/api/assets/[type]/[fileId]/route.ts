import { NextRequest, NextResponse } from "next/server";
import { getAssetFile, type AssetKey } from "@/lib/site-content";
import { Readable } from "stream";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

const FALLBACK_ASSETS: Record<AssetKey, string> = {
  profilePhoto: "/images/profile.png",
  logo: "/images/logo.png",
  favicon: "/favicon.png",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string; fileId: string }> }
) {
  const { type: rawType, fileId } = await context.params;

  if (!fileId || !ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid asset file ID" }, { status: 400 });
  }

  let assetKey: string;
  let fallbackUrl: string;

  if (rawType === "profile" || rawType === "profilePhoto") {
    assetKey = "profilePhoto";
    fallbackUrl = FALLBACK_ASSETS.profilePhoto;
  } else if (rawType === "logo") {
    assetKey = "logo";
    fallbackUrl = FALLBACK_ASSETS.logo;
  } else if (rawType === "favicon" || rawType === "icon") {
    assetKey = "favicon";
    fallbackUrl = FALLBACK_ASSETS.favicon;
  } else if (rawType.startsWith("evolution-")) {
    assetKey = rawType;
    fallbackUrl = `/images/${rawType}.png`;
  } else {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  try {
    const asset = await getAssetFile(assetKey, fileId);

    if (asset && asset.stream) {
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
    console.warn(`[AssetAPI] Notice while serving versioned asset (${assetKey}/${fileId}):`, err);
  }

  // Graceful fallback to static file if not in GridFS
  return NextResponse.redirect(new URL(fallbackUrl, req.url), 307);
}
