export const SESSION_COOKIE_NAME = "rawin_admin_session";
export const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Key secret for HMAC-SHA256 signature (min 32 bytes)
export function getSecretKey(): Uint8Array {
  const env = (typeof process !== "undefined" && process.env)
    ? (process.env as Record<string, string | undefined>)
    : {};
  const secret = (env["SESSION_SECRET"] || "").trim();

  if (!secret) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET is not configured. Server failing closed."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET must be at least 32 characters long."
    );
  }

  return new TextEncoder().encode(secret.padEnd(32, "!"));
}

export interface AdminSessionPayload {
  email: string;
  role: "admin";
  issuedAt: number;
}
