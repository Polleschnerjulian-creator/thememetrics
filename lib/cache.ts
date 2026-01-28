/**
 * Cache Layer für ThemeMetrics
 *
 * Verwendet Upstash Redis für:
 * - PageSpeed API Responses (24h TTL)
 * - Score Calculations (nie ablaufend für immutable data)
 * - Rate Limiting (1 Minute TTL)
 * - Subscription Status (1h TTL)
 */

import { Redis } from '@upstash/redis';

// ============================================
// REDIS CLIENT
// ============================================

// Singleton Redis client - only initialize if env vars are set
let redisClient: Redis | null = null;
let redisWarningShown = false;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    // Only warn once in development to avoid log spam
    if (!redisWarningShown && process.env.NODE_ENV === 'development') {
      redisWarningShown = true;
      // Silent in production - cache gracefully degrades
    }
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

// ============================================
// CACHE KEY PREFIXES
// ============================================

export const CACHE_KEYS = {
  PAGESPEED: 'pagespeed',
  SCORE: 'score',
  SUBSCRIPTION: 'subscription',
  RATE_LIMIT: 'ratelimit',
  DASHBOARD: 'dashboard',
} as const;

// ============================================
// TTL CONSTANTS (in seconds)
// ============================================

export const CACHE_TTL = {
  PAGESPEED: 24 * 60 * 60,      // 24 hours
  SCORE: 0,                      // Never expires (immutable)
  SUBSCRIPTION: 60 * 60,         // 1 hour
  RATE_LIMIT: 60,                // 1 minute
  DASHBOARD: 5 * 60,             // 5 minutes
  SHORT: 60,                     // 1 minute
  MEDIUM: 15 * 60,               // 15 minutes
  LONG: 60 * 60,                 // 1 hour
} as const;

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return null;
  }
}

/**
 * Set a value in cache with optional TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttlSeconds Time to live in seconds (0 = never expires)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    if (ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return false;
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return false;
  }
}

/**
 * Increment a counter (for rate limiting)
 * Returns the new count
 */
export async function cacheIncrement(
  key: string,
  ttlSeconds: number = CACHE_TTL.RATE_LIMIT
): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const count = await redis.incr(key);
    // Set expiry on first increment
    if (count === 1 && ttlSeconds > 0) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return null;
  }
}

/**
 * Get time to live for a key (in seconds)
 */
export async function cacheTTL(key: string): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const ttl = await redis.ttl(key);
    return ttl;
  } catch (error) {
    // Cache errors are silent - graceful degradation
    return null;
  }
}

// ============================================
// SPECIALIZED CACHE FUNCTIONS
// ============================================

/**
 * Build a cache key with prefix
 */
export function buildCacheKey(prefix: keyof typeof CACHE_KEYS, ...parts: string[]): string {
  return `${CACHE_KEYS[prefix]}:${parts.join(':')}`;
}

/**
 * Cache PageSpeed API response
 */
export async function cachePageSpeed(
  shopDomain: string,
  strategy: 'mobile' | 'desktop',
  data: unknown
): Promise<boolean> {
  const key = buildCacheKey('PAGESPEED', shopDomain, strategy);
  return cacheSet(key, data, CACHE_TTL.PAGESPEED);
}

// Alias for consistency
export const setCachedPageSpeed = cachePageSpeed;

/**
 * Get cached PageSpeed API response
 */
export async function getCachedPageSpeed<T>(
  shopDomain: string,
  strategy: 'mobile' | 'desktop'
): Promise<T | null> {
  const key = buildCacheKey('PAGESPEED', shopDomain, strategy);
  return cacheGet<T>(key);
}

/**
 * Cache score calculation (immutable - never expires)
 */
export async function cacheScore(
  analysisId: number,
  scoreData: unknown
): Promise<boolean> {
  const key = buildCacheKey('SCORE', String(analysisId));
  return cacheSet(key, scoreData, CACHE_TTL.SCORE);
}

/**
 * Get cached score
 */
export async function getCachedScore<T>(analysisId: number): Promise<T | null> {
  const key = buildCacheKey('SCORE', String(analysisId));
  return cacheGet<T>(key);
}

/**
 * Cache subscription status
 */
export async function cacheSubscription(
  shopDomain: string,
  subscriptionData: unknown
): Promise<boolean> {
  const key = buildCacheKey('SUBSCRIPTION', shopDomain);
  return cacheSet(key, subscriptionData, CACHE_TTL.SUBSCRIPTION);
}

/**
 * Get cached subscription
 */
export async function getCachedSubscription<T>(shopDomain: string): Promise<T | null> {
  const key = buildCacheKey('SUBSCRIPTION', shopDomain);
  return cacheGet<T>(key);
}

/**
 * Invalidate subscription cache (call after plan change)
 */
export async function invalidateSubscriptionCache(shopDomain: string): Promise<boolean> {
  const key = buildCacheKey('SUBSCRIPTION', shopDomain);
  return cacheDelete(key);
}

/**
 * Invalidate all caches for a shop (call on uninstall)
 */
export async function invalidateShopCaches(shopDomain: string): Promise<boolean> {
  const patterns = [
    `${CACHE_KEYS.PAGESPEED}:${shopDomain}:*`,
    `${CACHE_KEYS.SUBSCRIPTION}:${shopDomain}`,
    `${CACHE_KEYS.DASHBOARD}:${shopDomain}:*`,
  ];

  let success = true;
  for (const pattern of patterns) {
    const result = await cacheDeletePattern(pattern);
    if (!result) success = false;
  }

  return success;
}

// ============================================
// CACHE-THROUGH HELPER
// ============================================

/**
 * Get from cache or compute and cache the result
 * Useful for expensive operations
 */
export async function cacheThrough<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await computeFn();

  // Cache the result (don't await - fire and forget)
  cacheSet(key, value, ttlSeconds).catch(() => {
    // Silently ignore cache errors
  });

  return value;
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if Redis is connected and working
 */
export async function cacheHealthCheck(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch (error) {
    // Health check failed silently
    return false;
  }
}
