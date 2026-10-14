import { NextRequest, NextResponse } from "next/server";
import { completeUpload, UploadError, verifyUploadToken } from "@/lib/aura/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// conversion of large documents can take a while
export const maxDuration = 60;

/** Reassemble, verify and convert an uploaded file; answers with its processing status. */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!verifyUploadToken(id, req.headers.get("x-upload-token"))) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  try {
    return NextResponse.json(await completeUpload(id), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[Orbit uploads] processing failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "The file couldn't be processed." }, { status: 500 });
  }
}
