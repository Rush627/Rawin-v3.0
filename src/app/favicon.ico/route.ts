import { NextRequest, NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-content";
import { isUploadedAsset } from "@/lib/brand-assets";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const content = await getSiteContent();
    // /favicon.ico has no theme: crawlers and old browsers get the dark-tile variant, which
    // reads on light and dark chrome alike. An uploaded one wins over the bundled icon.
    const cmsFaviconUrl = content.assets.faviconDark.url;
    if (isUploadedAsset(cmsFaviconUrl)) {
      return NextResponse.redirect(new URL(cmsFaviconUrl, req.url), 307);
    }
  } catch (err) {
    console.warn("[FaviconRoute] Notice checking CMS favicon:", err);
  }

  // 2. Fallback: the default RAWIN mark. It lives under public/icons/ so it never
  //    collides with this route (a public/favicon.ico would shadow it).
  try {
    const filePath = path.join(process.cwd(), "public", "icons", "favicon.ico");
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/x-icon",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }
  } catch (err) {
    console.warn("[FaviconRoute] Notice reading public/icons/favicon.ico:", err);
  }

  return new Response(null, { status: 404 });
}
