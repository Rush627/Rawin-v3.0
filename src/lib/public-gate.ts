import { NextResponse } from "next/server";
import { getSiteContent, maintenanceActiveNow } from "./site-content";
import { getAdminSession } from "./auth";

/**
 * The maintenance gate for public API routes (dynamic, so reading the session here is fine).
 *  - maintenance or offline on: 503 for visitors; a signed-in administrator passes;
 *  - the setting cannot be read: 503 as well. An unknown state is treated as closed, never as
 *    live, so a database interruption cannot reopen an offline site's data;
 *  - otherwise null, and the route continues.
 * Brand assets, availability, the revision endpoint and Studio routes do not use this gate.
 */
export async function publicApiGate(feature: string): Promise<NextResponse | null> {
  const headers = { "Cache-Control": "no-store", "Retry-After": "30" };
  let active: boolean;
  try {
    active = maintenanceActiveNow((await getSiteContent()).maintenance);
  } catch {
    return NextResponse.json({ error: `${feature} is temporarily unavailable.` }, { status: 503, headers });
  }
  if (!active) return null;
  if (await getAdminSession()) return null;
  return NextResponse.json({ error: `${feature} is offline during scheduled maintenance.` }, { status: 503, headers });
}
