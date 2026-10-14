import { NextResponse } from "next/server";
import { getPublicAvailability } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Public, read-only content revision endpoint.
 * Returns only the revision timestamp, availability status, and public maintenance metadata.
 * Exposes zero sensitive data, session tokens, or private CMS payloads.
 */
export async function GET() {
  try {
    const availability = await getPublicAvailability();
    return NextResponse.json(
      {
        revision: availability.revision || 0,
        status: availability.status,
        message: availability.message,
        endsAt: availability.endsAt,
      },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { error: "Content revision temporarily unavailable." },
      { status: 503, headers: NO_STORE }
    );
  }
}
