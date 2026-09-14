import { NextResponse } from "next/server";
import { getPublicAvailability } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const availability = await getPublicAvailability();
  return NextResponse.json(availability, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
