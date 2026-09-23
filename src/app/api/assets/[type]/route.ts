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
    const asset = await getAssetFile(assetKey);

    if (asset && asset.stream) {
      // Convert Node.js stream to Web standard ReadableStream
      const webStream = Readable.toWeb(asset.stream) as ReadableStream;
      const hasVersion = req.nextUrl.searchParams.has("v");
      const cacheControl = hasVersion
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60, stale-while-revalidate=300";

      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": asset.contentType,
          "Cache-Control": cacheControl,
          "Content-Disposition": `inline; filename="${asset.filename}"`,
        },
      });
    }
  } catch (err) {
    console.warn(`[AssetAPI] Notice while serving asset (${assetKey}):`, err);
  }

  // Graceful fallback to static file if not in GridFS or database is unavailable
  return NextResponse.redirect(new URL(fallbackUrl, req.url), 307);
}
