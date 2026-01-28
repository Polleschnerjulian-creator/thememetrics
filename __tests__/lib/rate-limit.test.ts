/**
 * Rate Limiting Tests
 *
 * Tests for API rate limiting, daily limits, and response helpers
 */

import {
  RATE_LIMITS,
  PlanType,
  checkApiRateLimit,
  rateLimitResponse,
  cleanupRateLimitStore,
} from '@/lib/rate-limit';

// ============================================
// RATE LIMITS CONFIGURATION TESTS
// ============================================

describe('RATE_LIMITS configuration', () => {
  it('should have all plan types defined', () => {
    expect(RATE_LIMITS).toHaveProperty('free');
    expect(RATE_LIMITS).toHaveProperty('starter');
    expect(RATE_LIMITS).toHaveProperty('pro');
    expect(RATE_LIMITS).toHaveProperty('agency');
  });

  it('should have correct limits for free plan', () => {
    expect(RATE_LIMITS.free.analysesPerDay).toBe(3);
    expect(RATE_LIMITS.free.performanceTestsPerDay).toBe(5);
    expect(RATE_LIMITS.free.apiCallsPerMinute).toBe(20);
  });

  it('should have correct limits for starter plan', () => {
    expect(RATE_LIMITS.starter.analysesPerDay).toBe(10);
    expect(RATE_LIMITS.starter.performanceTestsPerDay).toBe(20);
    expect(RATE_LIMITS.starter.apiCallsPerMinute).toBe(60);
  });

  it('should have correct limits for pro plan', () => {
    expect(RATE_LIMITS.pro.analysesPerDay).toBe(50);
    expect(RATE_LIMITS.pro.performanceTestsPerDay).toBe(100);
    expect(RATE_LIMITS.pro.apiCallsPerMinute).toBe(120);
  });

  it('should have unlimited analyses for agency plan', () => {
    expect(RATE_LIMITS.agency.analysesPerDay).toBe(-1);
    expect(RATE_LIMITS.agency.performanceTestsPerDay).toBe(-1);
    expect(RATE_LIMITS.agency.apiCallsPerMinute).toBe(300);
  });

  it('should have increasing limits across plans', () => {
    const plans = ['free', 'starter', 'pro'] as PlanType[];

    for (let i = 1; i < plans.length; i++) {
      const currentPlan = plans[i];
      const previousPlan = plans[i - 1];

      expect(RATE_LIMITS[currentPlan].apiCallsPerMinute).toBeGreaterThan(
        RATE_LIMITS[previousPlan].apiCallsPerMinute
      );
    }
  });
});

// ============================================
// checkApiRateLimit TESTS
// ============================================

describe('checkApiRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    cleanupRateLimitStore();
    // Force cleanup of all entries by advancing time simulation
    jest.useFakeTimers();
    jest.setSystemTime(Date.now());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow first request', () => {
    const result = checkApiRateLimit('test-identifier-1', 'free');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should track request count correctly', () => {
    const identifier = 'test-identifier-2';

    // First request
    const first = checkApiRateLimit(identifier, 'free');
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(19);

    // Second request
    const second = checkApiRateLimit(identifier, 'free');
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(18);

    // Third request
    const third = checkApiRateLimit(identifier, 'free');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(17);
  });

  it('should deny requests when limit is reached', () => {
    const identifier = 'test-identifier-3';
    const limit = RATE_LIMITS.free.apiCallsPerMinute;

    // Use up all requests
    for (let i = 0; i < limit; i++) {
      checkApiRateLimit(identifier, 'free');
    }

    // Next request should be denied
    const result = checkApiRateLimit(identifier, 'free');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    const identifier = 'test-identifier-4';

    // Make some requests
    checkApiRateLimit(identifier, 'free');
    checkApiRateLimit(identifier, 'free');

    // Advance time past the 1-minute window
    jest.advanceTimersByTime(61000);

    // Should be reset
    const result = checkApiRateLimit(identifier, 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should apply plan-specific limits', () => {
    const identifierFree = 'test-free';
    const identifierPro = 'test-pro';

    // Fill up free limit
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(identifierFree, 'free');
    }

    // Free should be blocked
    expect(checkApiRateLimit(identifierFree, 'free').allowed).toBe(false);

    // Pro should still have room at same count
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(identifierPro, 'pro');
    }

    // Pro should still be allowed (has higher limit)
    expect(checkApiRateLimit(identifierPro, 'pro').allowed).toBe(true);
  });

  it('should handle different identifiers independently', () => {
    const identifier1 = 'user-1';
    const identifier2 = 'user-2';

    // Fill up user 1's limit
    for (let i = 0; i < RATE_LIMITS.free.apiCallsPerMinute; i++) {
      checkApiRateLimit(identifier1, 'free');
    }

    // User 1 blocked
    expect(checkApiRateLimit(identifier1, 'free').allowed).toBe(false);

    // User 2 should still be allowed
    expect(checkApiRateLimit(identifier2, 'free').allowed).toBe(true);
  });

  it('should return correct resetIn value', () => {
    const identifier = 'test-reset-time';

    const result = checkApiRateLimit(identifier, 'free');

    // resetIn should be approximately 60 seconds (60000ms)
    expect(result.resetIn).toBeLessThanOrEqual(60000);
    expect(result.resetIn).toBeGreaterThan(59000);
  });

  it('should use free plan as default', () => {
    const identifier = 'test-default-plan';

    // Call without specifying plan
    const result = checkApiRateLimit(identifier);

    // Should use free plan limits
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should handle agency plan with higher limits', () => {
    const identifier = 'agency-user';

    // Make many requests
    for (let i = 0; i < 200; i++) {
      checkApiRateLimit(identifier, 'agency');
    }

    // Should still be allowed (agency limit is 300)
    const result = checkApiRateLimit(identifier, 'agency');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.agency.apiCallsPerMinute - 201);
  });
});

// ============================================
// rateLimitResponse TESTS
// ============================================

describe('rateLimitResponse', () => {
  it('should return 429 status code', () => {
    const response = rateLimitResponse(30000);
    expect(response.status).toBe(429);
  });

  it('should include Retry-After header', () => {
    const response = rateLimitResponse(30000);
    const retryAfter = response.headers.get('Retry-After');

    expect(retryAfter).toBe('30');
  });

  it('should include X-RateLimit-Reset header', () => {
    const response = rateLimitResponse(30000);
    const resetHeader = response.headers.get('X-RateLimit-Reset');

    expect(resetHeader).toBeTruthy();
    expect(Number(resetHeader)).toBeGreaterThan(Date.now());
  });

  it('should include error message in body', async () => {
    const response = rateLimitResponse(30000);
    const body = await response.json();

    expect(body.error).toBe('rate_limit_exceeded');
    expect(body.message).toContain('Zu viele Anfragen');
    expect(body.retryAfter).toBe(30);
  });

  it('should round up retryAfter to whole seconds', async () => {
    const response = rateLimitResponse(1500); // 1.5 seconds
    const body = await response.json();

    expect(body.retryAfter).toBe(2); // Rounded up
  });

  it('should handle very small resetIn values', async () => {
    const response = rateLimitResponse(100); // 100ms
    const body = await response.json();

    expect(body.retryAfter).toBe(1); // At least 1 second
  });

  it('should handle very large resetIn values', async () => {
    const response = rateLimitResponse(3600000); // 1 hour
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
    jest.setSystemTime(Date.now());
    cleanupRateLimitStore(); // Start fresh
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should remove expired entries', () => {
    // Create some entries
    checkApiRateLimit('user-a', 'free');
    checkApiRateLimit('user-b', 'free');

    // Advance time past window
    jest.advanceTimersByTime(61000);

    // Cleanup
    cleanupRateLimitStore();

    // New requests should start fresh
    const resultA = checkApiRateLimit('user-a', 'free');
    const resultB = checkApiRateLimit('user-b', 'free');

    expect(resultA.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
    expect(resultB.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);
  });

  it('should keep non-expired entries', () => {
    // Create entry
    checkApiRateLimit('user-keep', 'free');
    checkApiRateLimit('user-keep', 'free');

    // Advance time but not past window
    jest.advanceTimersByTime(30000);

    // Cleanup
    cleanupRateLimitStore();

    // Entry should still have its count
    const result = checkApiRateLimit('user-keep', 'free');
    expect(result.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 3);
  });

  it('should handle empty store', () => {
    // Should not throw
    expect(() => cleanupRateLimitStore()).not.toThrow();
  });

  it('should handle mixed expired and non-expired entries', () => {
    // Create entry that will expire
    checkApiRateLimit('user-expired', 'free');

    // Advance time past window
    jest.advanceTimersByTime(61000);

    // Create entry that won't expire
    checkApiRateLimit('user-active', 'free');

    // Cleanup
    cleanupRateLimitStore();

    // Expired user should start fresh
    const expiredResult = checkApiRateLimit('user-expired', 'free');
    expect(expiredResult.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 1);

    // Active user should maintain count
    const activeResult = checkApiRateLimit('user-active', 'free');
    expect(activeResult.remaining).toBe(RATE_LIMITS.free.apiCallsPerMinute - 2);
  });
});

// ============================================
// EDGE CASES AND INTEGRATION
// ============================================

describe('Rate Limit Edge Cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.now());
    cleanupRateLimitStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle empty identifier', () => {
    const result = checkApiRateLimit('', 'free');
    expect(result.allowed).toBe(true);
  });

  it('should handle special characters in identifier', () => {
    const result = checkApiRateLimit('user@example.com:123', 'free');
    expect(result.allowed).toBe(true);
  });

  it('should handle very long identifier', () => {
    const longIdentifier = 'x'.repeat(1000);
    const result = checkApiRateLimit(longIdentifier, 'free');
    expect(result.allowed).toBe(true);
  });

  it('should handle concurrent requests simulation', () => {
    const identifier = 'concurrent-user';

    // Simulate concurrent requests
    const results = Array(25).fill(null).map(() =>
      checkApiRateLimit(identifier, 'free')
    );

    // First 20 should be allowed (free limit)
    const allowed = results.filter(r => r.allowed);
    const denied = results.filter(r => !r.allowed);

    expect(allowed.length).toBe(20);
    expect(denied.length).toBe(5);
  });

  it('should properly track remaining count', () => {
    const identifier = 'tracking-user';
    const limit = RATE_LIMITS.free.apiCallsPerMinute;

    for (let i = 0; i < limit; i++) {
      const result = checkApiRateLimit(identifier, 'free');
      expect(result.remaining).toBe(limit - i - 1);
    }
  });
});

describe('Plan Limit Comparisons', () => {
  it('should have progressively higher API limits', () => {
    expect(RATE_LIMITS.starter.apiCallsPerMinute).toBeGreaterThan(
      RATE_LIMITS.free.apiCallsPerMinute
    );
    expect(RATE_LIMITS.pro.apiCallsPerMinute).toBeGreaterThan(
      RATE_LIMITS.starter.apiCallsPerMinute
    );
    expect(RATE_LIMITS.agency.apiCallsPerMinute).toBeGreaterThan(
      RATE_LIMITS.pro.apiCallsPerMinute
    );
  });

  it('should have progressively higher analysis limits', () => {
    expect(RATE_LIMITS.starter.analysesPerDay).toBeGreaterThan(
      RATE_LIMITS.free.analysesPerDay
    );
    expect(RATE_LIMITS.pro.analysesPerDay).toBeGreaterThan(
      RATE_LIMITS.starter.analysesPerDay
    );
    // Agency is unlimited (-1)
    expect(RATE_LIMITS.agency.analysesPerDay).toBe(-1);
  });

  it('should have non-negative limits for non-unlimited plans', () => {
    const limitedPlans: PlanType[] = ['free', 'starter', 'pro'];

    limitedPlans.forEach(plan => {
      expect(RATE_LIMITS[plan].apiCallsPerMinute).toBeGreaterThan(0);
    });
  });
});

describe('Response Format Validation', () => {
  it('should return valid JSON response', async () => {
    const response = rateLimitResponse(5000);

    expect(response.headers.get('Content-Type')).toContain('application/json');

    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(typeof body.message).toBe('string');
    expect(typeof body.retryAfter).toBe('number');
  });

  it('should have consistent error code', async () => {
    const responses = [
      rateLimitResponse(1000),
      rateLimitResponse(30000),
      rateLimitResponse(60000),
    ];

    for (const response of responses) {
      const body = await response.json();
      expect(body.error).toBe('rate_limit_exceeded');
    }
  });
});
