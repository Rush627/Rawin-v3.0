import { getDatabase } from "../mongodb";
import type { SystemCheck } from "@/components/studio/SettingsCards";

/**
 * Real, cheap checks for the studio (no secrets are read into the page, only whether they are
 * set). Anything not actually verified says so instead of showing a success state.
 */
export async function getSystemChecks(): Promise<{ checks: SystemCheck[]; dbOk: boolean }> {
  const env = process.env as Record<string, string | undefined>;
  const checks: SystemCheck[] = [];
  let dbOk = false;
  const db = await getDatabase();
  if (!db) {
    checks.push({ label: "Database", tone: "error", detail: "Not reachable" });
  } else {
    const t0 = Date.now();
    try {
      await db.command({ ping: 1 });
      dbOk = true;
      checks.push({ label: "Database", tone: "ok", detail: `Connected (${db.databaseName}, ${Date.now() - t0} ms)` });
    } catch {
      checks.push({ label: "Database", tone: "error", detail: "Ping failed" });
    }
  }
  if (db && dbOk) {
    try {
      const files = await db.collection("site_assets.files").estimatedDocumentCount();
      checks.push({ label: "Asset storage (GridFS)", tone: "ok", detail: `${files} stored file${files === 1 ? "" : "s"}` });
    } catch {
      checks.push({ label: "Asset storage (GridFS)", tone: "error", detail: "Could not be read" });
    }
    try {
      const code = await db.collection("orbit_security").countDocuments({ key: "owner_verification" }, { limit: 1 });
      checks.push({ label: "Orbit owner code", tone: code ? "ok" : "warn", detail: code ? "Set" : "Not set" });
    } catch {
      checks.push({ label: "Orbit owner code", tone: "error", detail: "Could not be read" });
    }
  } else {
    checks.push({ label: "Asset storage (GridFS)", tone: "muted", detail: "Not checked (database unavailable)" });
  }
  const ai = Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
  checks.push({ label: "Workers AI (Orbit)", tone: ai ? "ok" : "warn", detail: ai ? "Credentials configured (not called)" : "Credentials missing" });
  const secret = (env.SESSION_SECRET || "").trim().length >= 32;
  checks.push({ label: "Session signing secret", tone: secret ? "ok" : "error", detail: secret ? "Configured" : "Missing or too short" });
  checks.push({
    label: "Bootstrap credential",
    tone: "muted",
    detail: env.ADMIN_PASSWORD_HASH ? "Configured · used only before the account exists" : "Not configured",
  });
  return { checks, dbOk };
}
