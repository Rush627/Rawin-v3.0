import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDatabase } from "./mongodb";
import { getSecretKey } from "./auth";

export type OrbitIdentityState =
  | "UNKNOWN"
  | "CLAIMED_RUSHAN_PENDING_VERIFICATION"
  | "VERIFIED_RUSHAN"
  | "RUSHAN_VERIFICATION_FAILED";

export interface OrbitOwnerVerificationRecord {
  key: "owner_verification";
  codeHash: string;
  updatedAt: string;
}

export interface OrbitSecurityMetadataRecord {
  key: "security_metadata";
  initialized: boolean;
  initializedAt: string;
  lastUpdated?: string;
}

const DEFAULT_INITIAL_CODE = "9559";
const BCRYPT_SALT_ROUNDS = 12;
const VERIFICATION_COLLECTION = "orbit_security";
const VERIFICATION_KEY = "owner_verification";
const METADATA_KEY = "security_metadata";

// In-memory rate limiting map for candidate verification attempts
interface AttemptRecord {
  attempts: number[];
}
const attemptMap = new Map<string, AttemptRecord>();
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 60 * 1000; // 1 minute window

export function checkVerificationRateLimit(identifier: string): boolean {
  const now = Date.now();
  let record = attemptMap.get(identifier);
  if (!record) {
    record = { attempts: [] };
    attemptMap.set(identifier, record);
  }

  // Filter timestamps within current window
  record.attempts = record.attempts.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);

  if (record.attempts.length >= ATTEMPT_LIMIT) {
    return false;
  }

  record.attempts.push(now);
  return true;
}

/**
 * Retrieves the stored bcrypt hash for the Rushan verification code.
 * Fail-closed behavior:
 * - First-time initialization creates the initial 9559 hash (cost 12) and marks system initialized.
 * - Once initialized, if the record is missing or DB is unavailable, returns null (verification fails closed).
 */
export async function getOwnerVerificationHash(): Promise<string | null> {
  try {
    const db = await getDatabase();
    if (!db) {
      console.warn("[Orbit Security] Database connection unavailable during verification hash retrieval.");
      return null;
    }

    const col = db.collection(VERIFICATION_COLLECTION);
    const record = await col.findOne<OrbitOwnerVerificationRecord>({ key: VERIFICATION_KEY });
    if (record && typeof record.codeHash === "string" && record.codeHash.length > 0) {
      return record.codeHash;
    }

    // Check if the system has already been initialized previously
    const metadata = await col.findOne<OrbitSecurityMetadataRecord>({ key: METADATA_KEY });
    if (metadata && metadata.initialized) {
      // System was previously initialized, but owner_verification record is missing.
      // Fail closed: do NOT silently recreate default code.
      console.warn(
        "[Orbit Security] Owner verification record is missing after initialization. Failing closed."
      );
      return null;
    }

    // First-time initialization only: create initial default hash and mark system initialized
    const initialHash = await bcrypt.hash(DEFAULT_INITIAL_CODE, BCRYPT_SALT_ROUNDS);
    const now = new Date().toISOString();

    await Promise.all([
      col.updateOne(
        { key: METADATA_KEY },
        {
          $set: {
            key: METADATA_KEY,
            initialized: true,
            initializedAt: now,
          },
        },
        { upsert: true }
      ),
      col.updateOne(
        { key: VERIFICATION_KEY },
        {
          $set: {
            key: VERIFICATION_KEY,
            codeHash: initialHash,
            updatedAt: now,
          },
        },
        { upsert: true }
      ),
    ]);

    return initialHash;
  } catch (err) {
    console.error("[Orbit Security] Failed to read verification record from MongoDB:", err);
    return null;
  }
}

/**
 * Updates the verification code in MongoDB with a newly hashed secret.
 * Validates length (4 to 32 characters) and trims surrounding whitespace.
 */
export async function updateOwnerVerificationCode(
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = newCode.trim();

  if (!trimmed || trimmed.length < 4 || trimmed.length > 32) {
    return {
      success: false,
      error: "Verification code must be between 4 and 32 characters.",
    };
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return { success: false, error: "Database connection unavailable." };
    }

    const hash = await bcrypt.hash(trimmed, BCRYPT_SALT_ROUNDS);
    const col = db.collection(VERIFICATION_COLLECTION);
    const now = new Date().toISOString();

    await Promise.all([
      col.updateOne(
        { key: METADATA_KEY },
        {
          $set: {
            key: METADATA_KEY,
            initialized: true,
            lastUpdated: now,
          },
          $setOnInsert: {
            initializedAt: now,
          },
        },
        { upsert: true }
      ),
      col.updateOne(
        { key: VERIFICATION_KEY },
        {
          $set: {
            key: VERIFICATION_KEY,
            codeHash: hash,
            updatedAt: now,
          },
        },
        { upsert: true }
      ),
    ]);

    return { success: true };
  } catch (err) {
    console.error("[Orbit Security] Failed to update verification code:", err);
    return {
      success: false,
      error: "Failed to persist new verification code to database.",
    };
  }
}

/**
 * Checks whether the verification code is configured in MongoDB.
 * Never returns the code or hash.
 */
export async function getOwnerVerificationStatus(): Promise<{
  isConfigured: boolean;
  updatedAt: string | null;
}> {
  try {
    const db = await getDatabase();
    if (db) {
      const col = db.collection<OrbitOwnerVerificationRecord>(VERIFICATION_COLLECTION);
      const record = await col.findOne({ key: VERIFICATION_KEY });
      if (record && record.codeHash) {
        return {
          isConfigured: true,
          updatedAt: record.updatedAt || null,
        };
      }
    }
  } catch {
    // Non-blocking
  }
  return { isConfigured: false, updatedAt: null };
}

/**
 * Validates a candidate verification code against the stored bcrypt hash.
 * Trims accidental surrounding whitespace without altering internal characters.
 * Never leaks the hash, candidate, or secret.
 */
export async function verifyOwnerCandidate(
  candidateCode: string,
  ip = "127.0.0.1"
): Promise<boolean> {
  if (!checkVerificationRateLimit(ip)) {
    return false;
  }

  const trimmed = candidateCode.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 32) {
    return false;
  }

  try {
    const hash = await getOwnerVerificationHash();
    if (!hash) {
      // Fail closed when record is missing or database is unavailable
      return false;
    }
    return await bcrypt.compare(trimmed, hash);
  } catch (err) {
    console.error("[Orbit Security] Error during candidate comparison:", err);
    return false;
  }
}

/**
 * Signs a cryptographic JWT session token capturing the conversation identity state.
 */
export async function signOrbitIdentityToken(
  identityState: OrbitIdentityState
): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ identityState, type: "orbit_identity" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secretKey);
}

/**
 * Verifies a cryptographic JWT session token. Returns UNKNOWN if invalid or absent.
 */
export async function verifyOrbitIdentityToken(
  token: string | null | undefined
): Promise<OrbitIdentityState> {
  if (!token) return "UNKNOWN";
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      payload.type === "orbit_identity" &&
      typeof payload.identityState === "string" &&
      [
        "UNKNOWN",
        "CLAIMED_RUSHAN_PENDING_VERIFICATION",
        "VERIFIED_RUSHAN",
        "RUSHAN_VERIFICATION_FAILED",
      ].includes(payload.identityState)
    ) {
      return payload.identityState as OrbitIdentityState;
    }
  } catch {
    // Invalid or expired token
  }
  return "UNKNOWN";
}

/**
 * Detects whether the visitor's message is an explicit claim of being Rushan Siddiqui.
 * Avoids false positives on queries asking about Rushan.
 */
export function isClaimingRushanIdentity(input: string): boolean {
  if (!input) return false;
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[.,!?;:"`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Questions or queries about Rushan are NOT identity claims
  if (
    /^(who|what|where|when|why|how|is|are|does|can|could|tell|about)\b/.test(
      normalized
    ) ||
    normalized.includes("who is") ||
    normalized.includes("tell me about") ||
    normalized.includes("did rushan") ||
    normalized.includes("does rushan") ||
    normalized.includes("projects of rushan") ||
    normalized.includes("skills of rushan")
  ) {
    return false;
  }

  // Identity claims
  return (
    /\b(i\s*am|i\s*m|im|this\s*is|its|it\s*is|hey\s*im|hi\s*im|myself)\s+rushan(\s+siddiqui)?\b/.test(
      normalized
    ) ||
    /\brushan\s+siddiqui\s+here\b/.test(normalized) ||
    /\brushan\s+here\b/.test(normalized) ||
    normalized === "rushan" ||
    normalized === "rushan siddiqui"
  );
}

/**
 * Extracts a candidate verification code from visitor input.
 */
export function extractCandidateCode(input: string): string {
  const trimmed = input.trim();
  const prefixMatch = trimmed.match(
    /(?:verification\s+code|verification|code)(?:\s+is|\s*:|\s*=)?\s*([A-Za-z0-9_-]{4,32})/i
  );
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1].trim();
  }
  return trimmed;
}
