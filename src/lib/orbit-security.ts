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
 * - Reads owner_verification from MongoDB.
 * - If not yet initialized, reads process.env.ORBIT_OWNER_VERIFICATION_CODE at runtime.
 * - If no environment variable is set or record is missing after initialization, fails closed (returns null).
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
      // Fail closed: do NOT silently recreate code.
      console.warn(
        "[Orbit Security] Owner verification record is missing after initialization. Failing closed."
      );
      return null;
    }

    // First-time initialization only: check environment variable
    const env = (typeof process !== "undefined" && process.env)
      ? (process.env as Record<string, string | undefined>)
      : {};
    const envCode = (env["ORBIT_OWNER_VERIFICATION_CODE"] || "").trim();
    if (!envCode || envCode.length < 4 || envCode.length > 32) {
      console.warn(
        "[Orbit Security] ORBIT_OWNER_VERIFICATION_CODE not configured for initial bootstrap. Failing closed."
      );
      return null;
    }

    const initialHash = await bcrypt.hash(envCode, BCRYPT_SALT_ROUNDS);
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
  const raw = input.trim();
  const normalized = raw
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[.,!?;:"`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Pure third-person queries about Rushan, Orbit, or RAWIN are NOT identity claims
  const isThirdPersonQuery =
    /\b(who\s+(is|are|was|were|created|built|founded|made|designed))\b/.test(normalized) ||
    /\b(tell\s+me\s+about\s+(rushan|your\s+developer|the\s+developer|rawin|orbit))\b/.test(normalized) ||
    /\b(is\s+rushan(\s+siddiqui)?\s+(the|your)?\s*(developer|founder|creator))\b/.test(normalized) ||
    /\b(is\s+rushan(\s+siddiqui)?\s+the\s+founder\s+of\s+rawin)\b/.test(normalized) ||
    /\b(are\s+you\s+(rushan|the\s+developer|the\s+founder|an\s+ai|orbit))\b/.test(normalized) ||
    /\b(what\s+(is|did)\s+(rushan|rawin|orbit))\b/.test(normalized) ||
    /\b(projects\s+of\s+rushan|skills\s+of\s+rushan)\b/.test(normalized);

  if (isThirdPersonQuery) {
    return false;
  }

  // 1. Explicit claims of being Rushan
  const claimsRushanName =
    /\b(i\s*am|im|this\s*is|its|it\s*is|hey\s*im|hi\s*im|myself)\s+rushan(\s+siddiqui)?\b/.test(
      normalized
    ) ||
    /\brushan\s+siddiqui\s+here\b/.test(normalized) ||
    /\brushan\s+here\b/.test(normalized) ||
    normalized === "rushan" ||
    normalized === "rushan siddiqui";

  if (claimsRushanName) return true;

  // 2. Explicit claims of being Orbit's or RAWIN's developer, founder, or creator
  const claimsCreatorRole =
    /\b(i\s*am|im|this\s*is)\s+(your|the|rawins?|orbits?)?\s*(developer|dev|founder|creator|architect|maker|builder)\b/.test(
      normalized
    ) ||
    /\b(i\s*am|im)\s+the\s+developer\s+of\s+(rawin|orbit)\b/.test(normalized) ||
    /\b(i\s*am|im)\s+the\s+founder\s+of\s+rawin\b/.test(normalized) ||
    /\b(i\s*am|im)\s+your\s+developer\s+rushan\b/.test(normalized) ||
    /\b(i\s*am|im)\s+rushan\s+your\s+developer\b/.test(normalized) ||
    /\b(i\s*am|im)\s+the\s+(person|one|engineer|developer|founder)\s+who\s+(created|built|made|designed)\s+(you|rawin|orbit)\b/.test(
      normalized
    ) ||
    /\b(you\s*are\s*talking\s*to|speaking\s*to)\s+(your\s+|the\s+)?(developer|founder|creator|rushan)\b/.test(
      normalized
    );

  if (claimsCreatorRole) return true;

  // 3. Explicit claims of having built or created Orbit or RAWIN
  const claimsBuiltAction =
    /\bi\s+(created|built|designed|made)\s+you\b/.test(normalized) ||
    /\bi\s+(created|built|founded|designed|made)\s+(rawin|orbit)\b/.test(normalized);

  if (claimsBuiltAction) return true;

  return false;
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
