import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getBlogCoverStream } from "@/lib/blog";
import { ObjectId } from "mongodb";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;

  // Strict allowlist: only valid MongoDB ObjectIds accepted : no arbitrary browsing
  if (!postId || !ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const cover = await getBlogCoverStream(postId);

    if (!cover) {
      return NextResponse.json({ error: "Cover image not found" }, { status: 404 });
    }

    const webStream = Readable.toWeb(cover.stream) as ReadableStream;
    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": cover.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${cover.filename}"`,
      },
    });
  } catch (err) {
    console.warn(`[BlogCoverAPI] Notice serving cover for post ${postId}:`, err);
    return NextResponse.json({ error: "Cover image unavailable" }, { status: 404 });
  }
}
