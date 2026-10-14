/**
 * Pure rules behind admin sign-in (no I/O, unit-tested in tests/admin-auth.test.ts).
 *
 * Credential precedence — one source per account, never both:
 *   1. A database record for the email exists → its bcrypt hash is the only valid password.
 *      The environment credential is ignored from then on, so a password changed in the admin
 *      cannot be bypassed with the old ADMIN_PASSWORD_HASH.
 *   2. No database record yet (first run) → the environment credential bootstraps the account;
 *      a successful bootstrap sign-in writes the database record, which then takes over (rule 1).
 *   3. Anything else → denied, with the same generic message as a wrong password.
 *
 * Session versions: every admin record carries `sessionVersion` (missing = 0) and every session
 * token carries the version it was issued under (`sv`, missing = 0). Bumping the record's version
 * (password change, "sign out everywhere") invalidates every token issued before it.
 */

export type CredentialPlan =
  | { kind: "database"; hash: string }
  | { kind: "bootstrap-hash"; hash: string }
  | { kind: "bootstrap-plain"; password: string }
  | { kind: "deny" };

export interface CredentialInputs {
  email: string;
  /** the admins record for this email, or null when there is none */
  record: { passwordHash?: unknown } | null;
  envEmail: string;
  envPasswordHash: string;
  envPassword: string;
  production: boolean;
}

export function planCredentialCheck(input: CredentialInputs): CredentialPlan {
  const email = input.email.trim().toLowerCase();
  if (input.record) {
    // A record without a usable hash is a broken account, not an invitation to fall back
    return typeof input.record.passwordHash === "string" && input.record.passwordHash
      ? { kind: "database", hash: input.record.passwordHash }
      : { kind: "deny" };
  }
  const envEmail = input.envEmail.trim().toLowerCase();
  if (!envEmail || email !== envEmail) return { kind: "deny" };
  if (input.envPasswordHash) return { kind: "bootstrap-hash", hash: input.envPasswordHash };
  // Plaintext bootstrap passwords are a development convenience only
  if (input.envPassword && !input.production) return { kind: "bootstrap-plain", password: input.envPassword };
  return { kind: "deny" };
}

/** A token is current only while its version matches the account's. */
export function sessionIsCurrent(tokenVersion: unknown, recordVersion: unknown): boolean {
  const t = typeof tokenVersion === "number" && Number.isFinite(tokenVersion) ? tokenVersion : 0;
  const r = typeof recordVersion === "number" && Number.isFinite(recordVersion) ? recordVersion : 0;
  return t === r;
}

/* ------------------------------------------------------------------ sign-in throttling */

export const LOGIN_LIMITS = {
  /** failures per client before it is paused */
  perClient: 5,
  /** failures per account email, whatever the client: cannot be dodged by changing headers */
  perAccount: 10,
  windowMs: 15 * 60 * 1000,
} as const;

export interface ThrottleRecord {
  count: number;
  windowStart: number;
}

/** Remaining pause in seconds (0 = allowed) for a record under `limit` failures per window. */
export function throttleWait(record: ThrottleRecord | null, limit: number, now: number, windowMs: number = LOGIN_LIMITS.windowMs): number {
  if (!record || now - record.windowStart >= windowMs) return 0;
  if (record.count < limit) return 0;
  return Math.ceil((record.windowStart + windowMs - now) / 1000);
}

/** The record after one more failure at `now`. */
export function recordFailure(record: ThrottleRecord | null, now: number, windowMs: number = LOGIN_LIMITS.windowMs): ThrottleRecord {
  if (!record || now - record.windowStart >= windowMs) return { count: 1, windowStart: now };
  return { count: record.count + 1, windowStart: record.windowStart };
}

/**
 * The client identity used for per-client throttling. Only a header written by the hosting
 * edge itself is trusted (Netlify sets x-nf-client-connection-ip and overwrites any client
 * copy). Without it the identity is derived from client-controlled headers and marked as such:
 * it still slows casual retries, while the per-account limit is what actually bounds guessing.
 */
export function clientIdentity(get: (name: string) => string | null): { key: string; trusted: boolean } {
  const edge = get("x-nf-client-connection-ip")?.trim();
  if (edge) return { key: `ip:${edge}`, trusted: true };
  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim() || get("x-real-ip")?.trim() || "unknown";
  return { key: `untrusted:${forwarded.slice(0, 64)}`, trusted: false };
}
