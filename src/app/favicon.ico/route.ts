import { NextRequest, NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-content";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const content = await getSiteContent();
    const cmsFaviconUrl = content.assets?.favicon?.url;

    // 1. If CMS favicon exists as a versioned asset, redirect directly to it
    if (cmsFaviconUrl && cmsFaviconUrl.startsWith("/api/assets/favicon/")) {
      return NextResponse.redirect(new URL(cmsFaviconUrl, req.url), 307);
    }
  } catch (err) {
    console.warn("[FaviconRoute] Notice checking CMS favicon:", err);
  }

  // 2. Fallback: serve repository default favicon from public/favicon.ico
  try {
    const filePath = path.join(process.cwd(), "public", "favicon.ico");
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
    console.warn("[FaviconRoute] Notice reading public/favicon.ico:", err);
  }

  return new Response(null, { status: 404 });
}
