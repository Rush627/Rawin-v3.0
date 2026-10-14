import { NextRequest, NextResponse } from "next/server";
import { discardUpload, putChunk, UploadError, verifyUploadToken } from "@/lib/aura/uploads";
import { UPLOAD_LIMITS } from "@/lib/aura/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** One raw chunk of an upload: PUT /api/ai/uploads/:id?index=N, x-upload-token header. */
export async function PUT(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!verifyUploadToken(id, req.headers.get("x-upload-token"))) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > UPLOAD_LIMITS.chunkBytes) {
    return NextResponse.json({ error: "Chunk too large." }, { status: 413 });
  }
  const index = Number(req.nextUrl.searchParams.get("index"));
  try {
    const body = await req.arrayBuffer();
    if (body.byteLength > UPLOAD_LIMITS.chunkBytes) return NextResponse.json({ error: "Chunk too large." }, { status: 413 });
    await putChunk(id, index, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[Orbit uploads] chunk failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "The upload failed. Try again." }, { status: 500 });
  }
}

/** Remove an upload (the visitor took the attachment off before sending). */
export async function DELETE(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!verifyUploadToken(id, req.headers.get("x-upload-token"))) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  await discardUpload(id).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
