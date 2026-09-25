import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getProjectPreviewStream } from "@/lib/projects";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string; fileId: string }> }
) {
  const { projectId, fileId } = await context.params;

  if (!projectId || !ObjectId.isValid(projectId) || !fileId || !ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid project ID or file ID" }, { status: 400 });
  }

  try {
    const preview = await getProjectPreviewStream(projectId, fileId);

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
    console.warn(`[ProjectPreviewAPI] Notice serving preview ${fileId} for project ${projectId}:`, err);
    return NextResponse.json({ error: "Preview image unavailable" }, { status: 404 });
  }
}
