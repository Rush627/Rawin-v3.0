import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getProjectPreviewStream } from "@/lib/projects";
import { ObjectId } from "mongodb";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;

  // Strict allowlist: only valid MongoDB ObjectIds accepted : no arbitrary browsing
  if (!projectId || !ObjectId.isValid(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  try {
    const preview = await getProjectPreviewStream(projectId);

    if (!preview) {
      return NextResponse.json({ error: "Preview image not found" }, { status: 404 });
    }

    const webStream = Readable.toWeb(preview.stream) as ReadableStream;
    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": preview.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${preview.filename}"`,
      },
    });
  } catch (err) {
    console.warn(`[ProjectPreviewAPI] Notice serving preview for project ${projectId}:`, err);
    return NextResponse.json({ error: "Preview image unavailable" }, { status: 404 });
  }
}
