/**
 * Rate Limiting für ThemeMetrics
 * Schützt vor API-Missbrauch und Kostenexplosion
 */

import { db, schema } from '@/lib/db';
import { eq, and, gte } from 'drizzle-orm';

// Rate Limits pro Plan
export const RATE_LIMITS = {
  free: {
    analysesPerDay: 3,
    performanceTestsPerDay: 5,
    apiCallsPerMinute: 20,
  },
  starter: {
    analysesPerDay: 10,
    performanceTestsPerDay: 20,
    apiCallsPerMinute: 60,
  },
  pro: {
    analysesPerDay: 50,
    performanceTestsPerDay: 100,
    apiCallsPerMinute: 120,
  },
  agency: {
    analysesPerDay: -1, // unlimited
    performanceTestsPerDay: -1,
    apiCallsPerMinute: 300,
  },
} as const;

export type PlanType = keyof typeof RATE_LIMITS;

// In-Memory Store für kurzfristige Rate Limits (API calls per minute)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check API calls per minute (in-memory, resets on server restart)
 */
export function checkApiRateLimit(identifier: string, plan: PlanType = 'free'): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const limit = RATE_LIMITS[plan].apiCallsPerMinute;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const key = `api:${identifier}`;
  const current = inMemoryStore.get(key);
  
  // Reset if window expired
  if (!current || now > current.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  
  // Check limit
  if (current.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: current.resetAt - now 
    };
  }
  
  // Increment
  current.count++;
  inMemoryStore.set(key, current);
  
  return { 
    allowed: true, 
    remaining: limit - current.count, 
    resetIn: current.resetAt - now 
  };
}

/**
 * Check daily analysis limit (database-backed)
 */
export async function checkDailyAnalysisLimit(
  storeId: number, 
  plan: PlanType = 'free'
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  resetAt: Date;
}> {
  const limit = RATE_LIMITS[plan].analysesPerDay;
  
  // Unlimited for agency
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, resetAt: new Date() };
  }
  
  // Get start of today (UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  // Tomorrow for reset time
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  
  // Count analyses today
  const analyses = await db.query.themeAnalyses.findMany({
    where: and(
      eq(schema.themeAnalyses.storeId, storeId),
      gte(schema.themeAnalyses.analyzedAt, today)
    ),
  });
  
  const used = analyses.length;
  
  return {
    allowed: used < limit,
    used,
    limit,
    resetAt: tomorrow,
  };
}

/**
 * Check daily performance test limit
 */
export async function checkDailyPerformanceLimit(
  storeId: number,
  plan: PlanType = 'free'
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const limit = RATE_LIMITS[plan].performanceTestsPerDay;
  
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }
  
  // Get current month's usage
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(schema.usageTracking.storeId, storeId),
      eq(schema.usageTracking.month, currentMonth)
    ),
  });
  
  const used = usage?.performanceTestsCount || 0;
  
  // For daily limit, we divide monthly by 30
  const dailyUsed = Math.floor(used / 30);
  
  return {
    allowed: dailyUsed < limit,
    used: dailyUsed,
    limit,
  };
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetIn: number) {
  const retryAfter = Math.ceil(resetIn / 1000);
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message: 'Zu viele Anfragen. Bitte warte einen Moment.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Date.now() + resetIn),
      },
    }
  );
}

/**
 * Clean up old entries from in-memory store (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  inMemoryStore.forEach((value, key) => {
    if (now > value.resetAt) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => inMemoryStore.delete(key));
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
