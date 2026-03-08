/**
 * In-memory sliding window rate limiter.
 * Adequate for Vercel serverless MVP.
 * Each cold start resets counters — acceptable for MVP scale.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given key.
 *
 * @param key - Unique identifier (e.g., IP + email, or IP + token)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const resetAt = oldestInWindow + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  // Allow and record
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Predefined rate limit configurations.
 */
export const RATE_LIMITS = {
  /** Magic link requests: 5 per email per 15 minutes */
  magicLink: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Event tracking: 100 batches per token per minute */
  events: { limit: 100, windowMs: 60 * 1000 },
  /** PDF export: 10 per token per hour */
  pdfExport: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Contact form: 2 per token per day */
  contactForm: { limit: 2, windowMs: 24 * 60 * 60 * 1000 },
  /** Admin API: 60 per admin per minute */
  adminApi: { limit: 60, windowMs: 60 * 1000 },
  /** Admin export: 10 per admin per hour */
  adminExport: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Token creation: 20 per admin per hour */
  tokenCreate: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;
