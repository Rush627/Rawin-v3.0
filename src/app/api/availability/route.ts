import { NextResponse } from "next/server";
import { getPublicAvailability } from "@/lib/site-content";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const availability = await getPublicAvailability();
    const admin = await getAdminSession();
    if (admin) {
      return NextResponse.json({ status: "live", revision: availability.revision }, { headers: NO_STORE });
    }
    return NextResponse.json(availability, { headers: NO_STORE });
  } catch {
    // Status unknown (database unreachable): clients keep whatever state they already show
    return NextResponse.json({ error: "Availability is temporarily unknown." }, { status: 503, headers: NO_STORE });
  }
}
