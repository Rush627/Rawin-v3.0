/**
 * Lightweight, zero-dependency in-memory rate limiter for authentication endpoints.
 * Operates without external infrastructure (Redis/Memcached).
 * Automatically prunes expired entries to prevent memory growth.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const attempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5; // Maximum failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

// Prune expired records periodically
function pruneExpired() {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetTime) {
      attempts.delete(key);
    }
  }
}

/**
 * Checks if a client identifier (IP / key) has exceeded the rate limit.
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  pruneExpired();

  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetTime) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt for a client identifier.
 */
export function recordFailedAttempt(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  pruneExpired();

  const now = Date.now();
  let record = attempts.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    attempts.set(key, record);
  } else {
    record.count += 1;
  }

  const allowed = record.count < MAX_ATTEMPTS;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.count);
  const retryAfterSeconds = allowed ? 0 : Math.ceil((record.resetTime - now) / 1000);

  return {
    allowed,
    remainingAttempts,
    retryAfterSeconds,
  };
}

/**
 * Resets/clears rate limit attempts upon successful authentication.
 */
export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
