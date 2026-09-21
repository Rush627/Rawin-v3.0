export const SESSION_COOKIE_NAME = "rawin_admin_session";
export const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Key secret for HMAC-SHA256 signature (min 32 bytes)
export function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET is not configured. Server failing closed."
      );
    }
    // Only in non-production local development:
    console.warn(
      "[Auth Security Warning] SESSION_SECRET is not set in development environment. Using temporary local dev secret."
    );
    return new TextEncoder().encode("rawin_3_0_dev_only_temporary_secret_key_2026".padEnd(32, "!"));
  }

  if (secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET must be at least 32 characters long."
      );
    }
  }

  return new TextEncoder().encode(secret.padEnd(32, "!"));
}

export interface AdminSessionPayload {
  email: string;
  role: "admin";
  issuedAt: number;
}
