import { NextResponse } from "next/server";
import { getPublicAvailability } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * The site's public availability, the same for every requester: public pages show the
 * maintenance screen to everyone while maintenance is on (they are static, so they cannot tell
 * an administrator apart), and this answer has to agree with them or an open tab would keep
 * refreshing. Administrators work in Studio, which never polls this endpoint.
 */
export async function GET() {
  try {
    const availability = await getPublicAvailability();
    return NextResponse.json(availability, { headers: NO_STORE });
  } catch {
    // Status unknown (database unreachable): clients keep whatever state they already show
    return NextResponse.json({ error: "Availability is temporarily unknown." }, { status: 503, headers: NO_STORE });
  }
}
