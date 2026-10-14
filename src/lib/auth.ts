import { cache } from "react";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";
import { planCredentialCheck, sessionIsCurrent } from "./admin-credentials";

import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRATION_SECONDS,
  getSecretKey,
  type AdminSessionPayload,
} from "./auth-token";

export { SESSION_COOKIE_NAME, SESSION_EXPIRATION_SECONDS, getSecretKey };
export type { AdminSessionPayload };

/**
 * Signs a cryptographic JWT session token, stamped with the account's session version.
 */
export async function signSessionToken(email: string, sessionVersion = 0): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ email: email.toLowerCase(), role: "admin", sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a token's signature and expiry only (no database). Use getAdminSession() for
 * authorization: it also checks the session version against the account record.
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
      sessionVersion: typeof payload.sv === "number" ? payload.sv : 0,
    };
  } catch {
    return null;
  }
}

const ADMINS_COLLECTION = "admins";
/** A valid bcrypt hash of a random string: unknown accounts cost the same time as known ones. */
const TIMING_DECOY_HASH = "$2b$12$uOn1q36Sctgkn0NuOmqh.OkLOJapB..G./0ZzCLFVZfzZ45EwBOoG";

/**
 * Verifies admin credentials. The database record is the only credential once it exists; the
 * environment credential only bootstraps a first account (see lib/admin-credentials).
 * Fails closed when the database is unreachable, because the stored password may have changed.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; email?: string; sessionVersion?: number; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const db = await getDatabase();
  if (!db) {
    return { success: false, error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const adminsCol = db.collection(ADMINS_COLLECTION);
  let record: { _id: ObjectId; email?: unknown; passwordHash?: unknown; sessionVersion?: unknown } | null;
  try {
    record = await adminsCol.findOne({ email });
  } catch (err) {
    console.error("[Auth] Admin lookup failed:", err instanceof Error ? err.message : String(err));
    return { success: false, error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const env = (typeof process !== "undefined" && process.env)
    ? (process.env as Record<string, string | undefined>)
    : {};
  const plan = planCredentialCheck({
    email,
    record,
    envEmail: env["ADMIN_EMAIL"] || "",
    envPasswordHash: env["ADMIN_PASSWORD_HASH"] || "",
    envPassword: env["ADMIN_PASSWORD"] || "",
    production: process.env.NODE_ENV === "production",
  });

  if (plan.kind === "deny") {
    await bcrypt.compare(password, TIMING_DECOY_HASH).catch(() => false);
    return { success: false, error: "Invalid email or password." };
  }

  if (plan.kind === "database") {
    const ok = await bcrypt.compare(password, plan.hash);
    if (!ok || !record) return { success: false, error: "Invalid email or password." };
    adminsCol.updateOne({ _id: record._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});
    return {
      success: true,
      email: typeof record.email === "string" ? record.email : email,
      sessionVersion: typeof record.sessionVersion === "number" ? record.sessionVersion : 0,
    };
  }

  // Bootstrap: the environment credential creates the first database record, which then rules
  const ok = plan.kind === "bootstrap-hash" ? await bcrypt.compare(password, plan.hash) : password === plan.password;
  if (!ok) return { success: false, error: "Invalid email or password." };
  try {
    const hash = plan.kind === "bootstrap-hash" ? plan.hash : await bcrypt.hash(password, 12);
    await adminsCol.updateOne(
      { email },
      {
        $setOnInsert: { email, passwordHash: hash, sessionVersion: 0, createdAt: new Date() },
        $set: { lastLoginAt: new Date() },
      },
      { upsert: true }
    );
  } catch (err) {
    // Without the record the session could never be validated: refuse rather than half sign in
    console.error("[Auth] Bootstrap account write failed:", err instanceof Error ? err.message : String(err));
    return { success: false, error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }
  return { success: true, email, sessionVersion: 0 };
}

/**
 * Increments the account's session version: every session issued before now stops working.
 * Returns the new version (used to re-issue the caller's own session where appropriate).
 */
export async function bumpSessionVersion(email: string): Promise<number> {
  const db = await getDatabase();
  if (!db) throw new Error("Database connection unavailable.");
  const res = await db
    .collection(ADMINS_COLLECTION)
    .findOneAndUpdate(
      { email: email.toLowerCase() },
      { $inc: { sessionVersion: 1 }, $set: { sessionsRevokedAt: new Date() } },
      { returnDocument: "after" }
    );
  if (!res) throw new Error("Admin account not found.");
  return typeof res.sessionVersion === "number" ? res.sessionVersion : 0;
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
export async function createAdminSession(email: string, sessionVersion = 0): Promise<void> {
  const token = await signSessionToken(email, sessionVersion);
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
    // In real production HTTPS (e.g. https://rawin.space), isHttps or public domain host guarantees isSecure=true.
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
 * Returns the active admin session if valid, or null. Valid means: signature and expiry check
 * out, the account still exists, and the token's session version matches the account's (so a
 * password change or "sign out everywhere" revokes it). Fails closed if the database is down.
 * Memoized within the render cycle with React cache to prevent redundant reads.
 */
async function fetchAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const payload = await verifySessionToken(sessionCookie.value);
  if (!payload) return null;

  try {
    const db = await getDatabase();
    if (!db) return null;
    const record = await db
      .collection(ADMINS_COLLECTION)
      .findOne({ email: payload.email.toLowerCase() }, { projection: { sessionVersion: 1 } });
    if (!record || !sessionIsCurrent(payload.sessionVersion, record.sessionVersion)) return null;
  } catch {
    return null;
  }
  return payload;
}

export const getAdminSession = cache(fetchAdminSession);

/**
 * Destroys the admin session cookie.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
