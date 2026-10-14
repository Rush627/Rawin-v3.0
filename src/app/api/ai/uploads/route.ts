import { NextRequest, NextResponse } from "next/server";
import { limitOrbitRequest } from "@/lib/aura/durable-limit";
import { startUpload, UploadError } from "@/lib/aura/uploads";
import { getSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Begin an attachment upload: validates name, type and size, returns an id and its token. */
export async function POST(req: NextRequest) {
  // Attachments are stored in MongoDB, so without the database they could not work anyway
  const limit = await limitOrbitRequest(req.headers, "upload", 30, 10 * 60 * 1000, "closed");
  if (limit.unavailable) {
    return NextResponse.json({ error: "Attachments are briefly unavailable. Please try again in a moment." }, { status: 503, headers: { "Retry-After": String(limit.resetInSeconds) } });
  }
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many uploads from this connection. Please wait a moment." }, { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } });
  }

  const site = await getSiteContent();
  if (site.ai?.fileAttachments !== true) {
    return NextResponse.json({ error: "File attachments are not enabled for Orbit." }, { status: 403 });
  }

  let body: { name?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    return NextResponse.json(await startUpload(body.name, body.size), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[Orbit uploads] start failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "The upload couldn't be started." }, { status: 500 });
  }
}
