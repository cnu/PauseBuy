/**
 * Rate Limiter using Vercel KV
 *
 * Implements a 24-hour sliding window rate limiter with
 * distributed state storage via Vercel KV (Redis).
 */

import { kv } from "@vercel/kv"

const DAILY_LIMIT = 100
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp when the oldest request expires
  limit: number
}

/**
 * Generate a rate limit key for a client
 * Uses a combination of IP and extension ID for identification
 */
function getRateLimitKey(clientId: string): string {
  return `ratelimit:${clientId}`
}

/**
 * Check and update rate limit for a client
 *
 * Uses a sorted set in Redis where:
 * - Member: unique request ID (timestamp + random)
 * - Score: timestamp of the request
 *
 * This allows efficient sliding window implementation by
 * removing expired entries and counting remaining ones.
 */
export async function checkRateLimit(
  clientId: string
): Promise<RateLimitResult> {
  const key = getRateLimitKey(clientId)
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  try {
    // Remove expired entries (older than 24 hours)
    await kv.zremrangebyscore(key, 0, windowStart)

    // Count current requests in the window
    const count = await kv.zcard(key)

    if (count >= DAILY_LIMIT) {
      // Get the oldest request to calculate reset time
      const oldest = await kv.zrange(key, 0, 0, { withScores: true })
      const resetAt = oldest.length >= 2
        ? Math.ceil((oldest[1] as number) + WINDOW_MS)
        : now + WINDOW_MS

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: DAILY_LIMIT
      }
    }

    // Add new request with unique ID
    const requestId = `${now}-${Math.random().toString(36).slice(2, 8)}`
    await kv.zadd(key, { score: now, member: requestId })

    // Set expiry on the key (slightly longer than window to handle edge cases)
    await kv.expire(key, Math.ceil(WINDOW_MS / 1000) + 60)

    // Get updated count
    const newCount = count + 1

    // Find reset time (when oldest entry expires)
    const oldestAfterAdd = await kv.zrange(key, 0, 0, { withScores: true })
    const resetAt = oldestAfterAdd.length >= 2
      ? Math.ceil((oldestAfterAdd[1] as number) + WINDOW_MS)
      : now + WINDOW_MS

    return {
      allowed: true,
      remaining: DAILY_LIMIT - newCount,
      resetAt,
      limit: DAILY_LIMIT
    }
  } catch (error) {
    // If KV is unavailable, log error and allow request (fail open)
    // This prevents KV outages from blocking all users
    console.error("[RateLimit] KV error, failing open:", error)
    return {
      allowed: true,
      remaining: DAILY_LIMIT,
      resetAt: now + WINDOW_MS,
      limit: DAILY_LIMIT
    }
  }
}

/**
 * Get current rate limit status without consuming a request
 */
export async function getRateLimitStatus(
  clientId: string
): Promise<RateLimitResult> {
  const key = getRateLimitKey(clientId)
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  try {
    // Remove expired entries
    await kv.zremrangebyscore(key, 0, windowStart)

    // Count current requests
    const count = await kv.zcard(key)

    // Get oldest entry for reset time
    const oldest = await kv.zrange(key, 0, 0, { withScores: true })
    const resetAt = oldest.length >= 2
      ? Math.ceil((oldest[1] as number) + WINDOW_MS)
      : now + WINDOW_MS

    return {
      allowed: count < DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - count),
      resetAt,
      limit: DAILY_LIMIT
    }
  } catch (error) {
    console.error("[RateLimit] KV error getting status:", error)
    return {
      allowed: true,
      remaining: DAILY_LIMIT,
      resetAt: now + WINDOW_MS,
      limit: DAILY_LIMIT
    }
  }
}

/**
 * Extract client identifier from request
 * Prioritizes extension ID header, falls back to IP
 */
export function getClientId(
  extensionId: string | undefined,
  ip: string | undefined
): string {
  // Extension ID is preferred as it's more stable than IP
  if (extensionId && extensionId.length > 0) {
    return `ext:${extensionId}`
  }

  // Fallback to IP address
  if (ip) {
    return `ip:${ip}`
  }

  // Last resort: anonymous (should rarely happen)
  return "anonymous"
}
