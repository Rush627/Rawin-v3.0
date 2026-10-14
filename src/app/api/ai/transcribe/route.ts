import { NextRequest, NextResponse } from "next/server";
import { limitOrbitRequest } from "@/lib/aura/durable-limit";
import { transcribeAudio, TRANSCRIBE_LIMITS } from "@/lib/aura/transcribe";
import { getSiteContent } from "@/lib/site-content";
import { publicApiGate } from "@/lib/public-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST raw audio (the browser recording) → { text }.
 * Enforced on the server: CMS switch, rate limit, size cap and container signature.
 * Nothing is stored; audio content is never logged.
 */
export async function POST(req: NextRequest) {
  const closed = await publicApiGate("Orbit transcription");
  if (closed) return closed;
  const site = await getSiteContent();
  if (site.ai?.serverTranscription !== true) {
    return NextResponse.json({ error: "Orbit transcription is not enabled." }, { status: 403 });
  }

  const limit = await limitOrbitRequest(req.headers, "transcribe", 20, 60 * 1000, "degrade");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } }
    );
  }

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > TRANSCRIBE_LIMITS.maxBytes) {
    return NextResponse.json({ error: "The recording is too long." }, { status: 413 });
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Could not read the recording." }, { status: 400 });
  }

  const result = await transcribeAudio(bytes);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ text: result.text });
}
