/**
 * Rate Limiting Tests
 *
 * Comprehensive tests for API rate limiting (in-memory),
 * daily analysis limits (DB-backed), daily performance limits (DB-backed),
 * response helpers, and cleanup.
 */

// Mock the DB module before imports
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    query: {
      themeAnalyses: { findMany: (...args: any[]) => mockFindMany(...args) },
      stores: { findFirst: (...args: any[]) => mockFindFirst(...args) },
      performanceSnapshots: { findMany: (...args: any[]) => mockFindMany(...args) },
    },
  },
  schema: {
    themeAnalyses: {
      storeId: 'storeId',
      analyzedAt: 'analyzedAt',
    },
    stores: {
      id: 'id',
    },
    performanceSnapshots: {
      themeId: 'themeId',
      createdAt: 'createdAt',
    },
  },
}));

import {
  RATE_LIMITS,
  PlanType,
  checkApiRateLimit,
  checkDailyAnalysisLimit,
  checkDailyPerformanceLimit,
  rateLimitResponse,
  cleanupRateLimitStore,
} from '@/lib/rate-limit';

// ============================================
// checkApiRateLimit TESTS (in-memory)
// ============================================

describe('checkApiRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-18T12:00:00Z'));
    // Clean up all entries by advancing time past window and cleaning
    jest.advanceTimersByTime(120000);
    cleanupRateLimitStore();
    // Reset time back
    jest.setSystemTime(new Date('2026-03-18T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow first call with remaining = limit - 1', () => {
    const result = checkApiRateLimit('user-fresh', 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should deny when at limit', () => {
    const identifier = 'user-at-limit';
    const limit = RATE_LIMITS.free.apiCallsPerMinute; // 20

    for (let i = 0; i < limit; i++) {
      checkApiRateLimit(identifier, 'free');
    }

    const result = checkApiRateLimit(identifier, 'free');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires and allow again', () => {
    const identifier = 'user-reset';

    // Use some requests
    for (let i = 0; i < 5; i++) {
      checkApiRateLimit(identifier, 'free');
    }

    // Advance time past the 60-second window
    jest.advanceTimersByTime(61000);

    // Should be allowed again with full remaining
    const result = checkApiRateLimit(identifier, 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should track different identifiers independently', () => {
    const id1 = 'user-A';
    const id2 = 'user-B';

    // Exhaust user A's limit
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(id1, 'free');
    }

    // User A is blocked
    expect(checkApiRateLimit(id1, 'free').allowed).toBe(false);

    // User B is unaffected
    const resultB = checkApiRateLimit(id2, 'free');
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should apply different limits for different plans', () => {
    const freeUser = 'free-user';
    const proUser = 'pro-user';

    // Exhaust free limit (20)
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(freeUser, 'free');
    }
    expect(checkApiRateLimit(freeUser, 'free').allowed).toBe(false);

    // Pro user at same count (20) should still be allowed (limit is 120)
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(proUser, 'pro');
    }
    const proResult = checkApiRateLimit(proUser, 'pro');
    expect(proResult.allowed).toBe(true);
    expect(proResult.remaining).toBe(RATE_LIMITS.pro.apiCallsPerMinute - RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should handle agency plan with 300/min limit', () => {
    const agencyUser = 'agency-user';

    // Make 200 requests -- should all be allowed
    for (let i = 0; i < 200; i++) {
      const r = checkApiRateLimit(agencyUser, 'agency');
      expect(r.allowed).toBe(true);
    }

    const result = checkApiRateLimit(agencyUser, 'agency');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.agency.apiCallsPerMinute - 201);
  });

  it('should default to free plan', () => {
    const result = checkApiRateLimit('default-user');
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should provide correct resetIn value', () => {
    const result = checkApiRateLimit('timer-user', 'free');
    expect(result.resetIn).toBe(60000); // 1 minute in ms
  });

  it('should provide decreasing resetIn for blocked user', () => {
    const id = 'blocked-timer';

    // Exhaust limit
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(id, 'free');
    }

    // Advance 30 seconds
    jest.advanceTimersByTime(30000);

    const result = checkApiRateLimit(id, 'free');
    expect(result.allowed).toBe(false);
    expect(result.resetIn).toBeLessThanOrEqual(30000);
    expect(result.resetIn).toBeGreaterThan(0);
  });
});

// ============================================
// checkDailyAnalysisLimit TESTS (DB-backed)
// ============================================

describe('checkDailyAnalysisLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow when below limit', async () => {
    mockFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }]); // 2 analyses today

    const result = await checkDailyAnalysisLimit(1, 'free');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(2);
    expect(result.limit).toBe(3);
  });

  it('should deny when at limit', async () => {
    mockFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]); // 3 = limit for free

    const result = await checkDailyAnalysisLimit(1, 'free');
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(3);
    expect(result.limit).toBe(3);
  });

  it('should always allow agency plan (unlimited, -1)', async () => {
    // DB should not even be called
    const result = await checkDailyAnalysisLimit(1, 'agency');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('should provide reset at midnight UTC', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await checkDailyAnalysisLimit(1, 'free');
    const resetDate = result.resetAt;

    // Reset should be tomorrow at midnight UTC
    expect(resetDate.getUTCHours()).toBe(0);
    expect(resetDate.getUTCMinutes()).toBe(0);
    expect(resetDate.getUTCSeconds()).toBe(0);
  });

  it('should use plan-specific limits', async () => {
    mockFindMany.mockResolvedValue(Array(5).fill({ id: 1 })); // 5 analyses

    const freeResult = await checkDailyAnalysisLimit(1, 'free');
    expect(freeResult.allowed).toBe(false); // free limit is 3

    const starterResult = await checkDailyAnalysisLimit(1, 'starter');
    expect(starterResult.allowed).toBe(true); // starter limit is 10

    const proResult = await checkDailyAnalysisLimit(1, 'pro');
    expect(proResult.allowed).toBe(true); // pro limit is 50
  });
});

// ============================================
// checkDailyPerformanceLimit TESTS (DB-backed)
// ============================================

describe('checkDailyPerformanceLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow when below limit', async () => {
    mockFindFirst.mockResolvedValue({
      id: 1,
      themes: [{ id: 10 }, { id: 11 }],
    });
    // Two themes, each with 1 snapshot today = 2 total
    mockFindMany
      .mockResolvedValueOnce([{ id: 100 }]) // theme 10 snapshots
      .mockResolvedValueOnce([{ id: 101 }]); // theme 11 snapshots

    const result = await checkDailyPerformanceLimit(1, 'free');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('should deny when at limit', async () => {
    mockFindFirst.mockResolvedValue({
      id: 1,
      themes: [{ id: 10 }],
    });
    // 5 snapshots = at the free limit
    mockFindMany.mockResolvedValue(Array(5).fill({ id: 100 }));

    const result = await checkDailyPerformanceLimit(1, 'free');
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(5);
    expect(result.limit).toBe(5);
  });

  it('should always allow agency plan (unlimited)', async () => {
    const result = await checkDailyPerformanceLimit(1, 'agency');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    // DB should not be queried for stores
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it('should gracefully handle no store found', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await checkDailyPerformanceLimit(999, 'free');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
  });

  it('should gracefully handle store with no themes', async () => {
    mockFindFirst.mockResolvedValue({ id: 1, themes: [] });

    const result = await checkDailyPerformanceLimit(1, 'free');
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
  });

  it('should count snapshots across all themes', async () => {
    mockFindFirst.mockResolvedValue({
      id: 1,
      themes: [{ id: 10 }, { id: 11 }, { id: 12 }],
    });
    // 3 themes, 2 snapshots each = 6 total
    mockFindMany
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ id: 3 }, { id: 4 }])
      .mockResolvedValueOnce([{ id: 5 }, { id: 6 }]);

    const result = await checkDailyPerformanceLimit(1, 'free');
    expect(result.allowed).toBe(false); // 6 > 5 (free limit)
    expect(result.used).toBe(6);
  });

  it('should provide correct reset time', async () => {
    mockFindFirst.mockResolvedValue({ id: 1, themes: [] });

    const result = await checkDailyPerformanceLimit(1, 'free');
    expect(result.resetAt.getUTCHours()).toBe(0);
    expect(result.resetAt.getUTCMinutes()).toBe(0);
  });
});

// ============================================
// rateLimitResponse TESTS
// ============================================

describe('rateLimitResponse', () => {
  it('should return 429 status', () => {
    const response = rateLimitResponse(30000);
    expect(response.status).toBe(429);
  });

  it('should include Retry-After header in seconds', () => {
    const response = rateLimitResponse(30000);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should include X-RateLimit-Reset header', () => {
    const response = rateLimitResponse(30000);
    const reset = response.headers.get('X-RateLimit-Reset');
    expect(reset).toBeTruthy();
    expect(Number(reset)).toBeGreaterThan(Date.now() - 1000);
  });

  it('should return correct JSON body', async () => {
    const response = rateLimitResponse(30000);
    const body = await response.json();

    expect(body.error).toBe('rate_limit_exceeded');
    expect(body.message).toBeTruthy();
    expect(body.retryAfter).toBe(30);
  });

  it('should round up partial seconds', async () => {
    const response = rateLimitResponse(1500); // 1.5 seconds
    const body = await response.json();
    expect(body.retryAfter).toBe(2);
  });

  it('should handle small values (100ms)', async () => {
    const response = rateLimitResponse(100);
    const body = await response.json();
    expect(body.retryAfter).toBe(1);
  });

  it('should handle large values (1 hour)', async () => {
    const response = rateLimitResponse(3600000);
    const body = await response.json();
    expect(body.retryAfter).toBe(3600);
  });
});

// ============================================
// cleanupRateLimitStore TESTS
// ============================================

describe('cleanupRateLimitStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-18T12:00:00Z'));
    // Clear everything
    jest.advanceTimersByTime(120000);
    cleanupRateLimitStore();
    jest.setSystemTime(new Date('2026-03-18T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should remove expired entries', () => {
    checkApiRateLimit('expired-user', 'free');

    // Advance past the 1-minute window
    jest.advanceTimersByTime(61000);

    cleanupRateLimitStore();

    // New request should start fresh (remaining = limit - 1)
    const result = checkApiRateLimit('expired-user', 'free');
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should keep non-expired entries', () => {
    checkApiRateLimit('active-user', 'free');
    checkApiRateLimit('active-user', 'free');

    // Advance 30 seconds (still within window)
    jest.advanceTimersByTime(30000);

    cleanupRateLimitStore();

    // Should still have the count (2 + 1 = 3)
    const result = checkApiRateLimit('active-user', 'free');
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 3);
  });

  it('should handle empty store without error', () => {
    expect(() => cleanupRateLimitStore()).not.toThrow();
  });

  it('should handle mixed expired and non-expired entries', () => {
    // Create an entry that will expire
    checkApiRateLimit('will-expire', 'free');
    checkApiRateLimit('will-expire', 'free');

    // Advance past window
    jest.advanceTimersByTime(61000);

    // Create a fresh entry
    checkApiRateLimit('still-active', 'free');

    cleanupRateLimitStore();

    // Expired user starts fresh
    const expired = checkApiRateLimit('will-expire', 'free');
    expect(expired.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);

    // Active user retains count (1 + 1 = 2 calls)
    const active = checkApiRateLimit('still-active', 'free');
    expect(active.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 2);
  });
});
