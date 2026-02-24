/**
 * Simple in-memory rate limiter for server-side use
 * Uses IP address to track request counts
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Time in milliseconds until the rate limit resets */
  resetIn: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address)
 * @param action - Action being rate limited (e.g., "register", "login")
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string | undefined | null,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  // SECURITY: If no identifier, use a shared fallback key (fail-closed)
  // This prevents bypassing rate limits by stripping IP headers
  if (!identifier) {
    identifier = "__unknown_ip__";
  }

  cleanupExpiredEntries();

  const key = `${action}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No existing entry or entry has expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Entry exists and is still valid
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  register: {
    maxRequests: 15,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Price alert creation: 15 attempts per 15 minutes per IP
  priceAlertCreate: {
    maxRequests: 15,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Login: 10 attempts per 15 minutes per IP
  login: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Password reset: 3 attempts per 15 minutes per IP
  passwordReset: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Chat message (AI query): 30 per minute
  chatMessage: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  // Chat creation: 20 per minute
  chatCreate: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  // Chat update (save): 60 per minute (streaming saves frequently)
  chatUpdate: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  // Chat plot-data fetches: 20 per minute
  chatPlotData: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  // Chat deletion: 10 per minute
  chatDelete: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Chat generation status polling: 120 per minute
  chatStatus: {
    maxRequests: 120,
    windowMs: 60 * 1000,
  },
  // Compare data: 30 per minute
  compareData: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  // ETF holdings: 30 per minute
  etfHoldings: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
} as const;
