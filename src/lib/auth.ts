import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDatabase } from "./mongodb";

export const SESSION_COOKIE_NAME = "rawin_admin_session";
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

/**
 * Signs a cryptographic JWT session token.
 */
export async function signSessionToken(email: string): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ email: email.toLowerCase(), role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a cryptographic JWT session token.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin" || typeof payload.email !== "string") {
      return null;
    }

    return {
      email: payload.email,
      role: "admin",
      issuedAt: typeof payload.iat === "number" ? payload.iat : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Verifies admin credentials against MongoDB or environment fallback.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  // 1. Check MongoDB Atlas admins collection
  try {
    const db = await getDatabase();
    if (db) {
      const adminsCol = db.collection("admins");
      const adminDoc = await adminsCol.findOne({ email });

      if (adminDoc && adminDoc.passwordHash) {
        const passwordMatches = await bcrypt.compare(password, adminDoc.passwordHash);
        if (passwordMatches) {
          // Update last login timestamp asynchronously
          adminsCol.updateOne({ _id: adminDoc._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});
          return { success: true, email: adminDoc.email };
        }
      }
    }
  } catch (err) {
    console.error("[Auth] Database check error:", err);
  }

  // 2. Check environment credentials fallback
  const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD || "";
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";

  if (envEmail && email === envEmail) {
    let matches = false;

    if (envPasswordHash) {
      matches = await bcrypt.compare(password, envPasswordHash);
    } else if (envPassword) {
      // Strictly disallowed in production
      if (process.env.NODE_ENV === "production") {
        console.error(
          "[Auth Critical Error] Plaintext ADMIN_PASSWORD cannot be used in production. Please set ADMIN_PASSWORD_HASH."
        );
        return {
          success: false,
          error: "Authentication service misconfiguration. Contact administrator.",
        };
      }
      matches = password === envPassword;
    } else if (process.env.NODE_ENV === "production") {
      // In production with no hash configured and user not in DB
      return { success: false, error: "Invalid email or password." };
    }

    if (matches) {
      // Sync into MongoDB admins collection if connected and missing
      try {
        const db = await getDatabase();
        if (db) {
          const adminsCol = db.collection("admins");
          const existing = await adminsCol.findOne({ email: envEmail });
          if (!existing) {
            const hash = envPasswordHash || (await bcrypt.hash(password, 12));
            await adminsCol.insertOne({
              email: envEmail,
              passwordHash: hash,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            });
          }
        }
      } catch {
        // Non-blocking sync
      }

      return { success: true, email: envEmail };
    }
  }

  return { success: false, error: "Invalid email or password." };
}

/**
 * Detects whether a host corresponds to localhost or an RFC 1918 private LAN IP.
 */
export function isLocalOrLanHost(host: string): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase().trim();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }

  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  const match172 = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (match172) {
    const octet = parseInt(match172[1], 10);
    if (octet >= 16 && octet <= 31) {
      return true;
    }
  }

  return false;
}

/**
 * Creates and sets the secure HTTP-only admin session cookie.
 */
export async function createAdminSession(email: string): Promise<void> {
  const token = await signSessionToken(email);
  const cookieStore = await cookies();

  let isSecure = process.env.NODE_ENV === "production";

  try {
    const headerList = await headers();
    const host = headerList.get("host") || "";
    const forwardedProto = headerList.get("x-forwarded-proto");
    const referer = headerList.get("referer");
    const origin = headerList.get("origin");

    const isHttps =
      forwardedProto === "https" ||
      referer?.startsWith("https://") ||
      origin?.startsWith("https://");

    // If accessing over plain HTTP on a local or private LAN host (e.g. physical phone connecting to
    // http://192.168.29.190:3000), we must not set the Secure cookie flag; otherwise physical mobile
    // browsers will reject or refuse to transmit the cookie over HTTP per RFC 6265bis.
    // In real production HTTPS (e.g. https://rawin.world), isHttps or public domain host guarantees isSecure=true.
    if (!isHttps && isLocalOrLanHost(host)) {
      isSecure = false;
    }
  } catch {
    // Fallback safely to process.env.NODE_ENV === "production"
  }

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRATION_SECONDS,
  });
}

/**
 * Returns the active admin session if valid, or null.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * Destroys the admin session cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
