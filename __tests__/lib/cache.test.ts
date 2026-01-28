/**
 * Cache Layer Tests
 */

import { CACHE_KEYS, CACHE_TTL, buildCacheKey } from '@/lib/cache';

describe('Cache Layer', () => {
  describe('Cache Keys', () => {
    it('should have all required cache key prefixes', () => {
      expect(CACHE_KEYS.PAGESPEED).toBe('pagespeed');
      expect(CACHE_KEYS.SCORE).toBe('score');
      expect(CACHE_KEYS.SUBSCRIPTION).toBe('subscription');
      expect(CACHE_KEYS.RATE_LIMIT).toBe('ratelimit');
      expect(CACHE_KEYS.DASHBOARD).toBe('dashboard');
    });
  });

  describe('Cache TTL', () => {
    it('should have correct TTL for PageSpeed', () => {
      expect(CACHE_TTL.PAGESPEED).toBe(24 * 60 * 60); // 24 hours
    });

    it('should have TTL of 0 for scores (never expires)', () => {
      expect(CACHE_TTL.SCORE).toBe(0);
    });

    it('should have 1 hour TTL for subscriptions', () => {
      expect(CACHE_TTL.SUBSCRIPTION).toBe(60 * 60);
    });

    it('should have 1 minute TTL for rate limiting', () => {
      expect(CACHE_TTL.RATE_LIMIT).toBe(60);
    });

    it('should have 5 minutes TTL for dashboard', () => {
      expect(CACHE_TTL.DASHBOARD).toBe(5 * 60);
    });

    it('should have standard TTL helpers', () => {
      expect(CACHE_TTL.SHORT).toBe(60);
      expect(CACHE_TTL.MEDIUM).toBe(15 * 60);
      expect(CACHE_TTL.LONG).toBe(60 * 60);
    });
  });

  describe('buildCacheKey', () => {
    it('should build key with single part', () => {
      const key = buildCacheKey('PAGESPEED', 'test.myshopify.com');
      expect(key).toBe('pagespeed:test.myshopify.com');
    });

    it('should build key with multiple parts', () => {
      const key = buildCacheKey('PAGESPEED', 'test.myshopify.com', 'mobile');
      expect(key).toBe('pagespeed:test.myshopify.com:mobile');
    });

    it('should build score cache key', () => {
      const key = buildCacheKey('SCORE', '12345');
      expect(key).toBe('score:12345');
    });

    it('should build subscription cache key', () => {
      const key = buildCacheKey('SUBSCRIPTION', 'shop.myshopify.com');
      expect(key).toBe('subscription:shop.myshopify.com');
    });

    it('should build rate limit key', () => {
      const key = buildCacheKey('RATE_LIMIT', '192.168.1.1', '2026-01');
      expect(key).toBe('ratelimit:192.168.1.1:2026-01');
    });
  });

  describe('Cache Key Format', () => {
    it('should use colon as separator', () => {
      const key = buildCacheKey('DASHBOARD', 'shop', 'data');
      expect(key).toContain(':');
      expect(key.split(':').length).toBe(3);
    });

    it('should preserve special characters in parts', () => {
      const key = buildCacheKey('PAGESPEED', 'my-shop.myshopify.com', 'mobile');
      expect(key).toBe('pagespeed:my-shop.myshopify.com:mobile');
    });
  });

  describe('Score Caching Logic', () => {
    // Test the logic that would be used for score caching

    interface ScoreBreakdown {
      overall: number;
      speed: number;
      quality: number;
      conversion: number;
    }

    function serializeScore(score: ScoreBreakdown): string {
      return JSON.stringify(score);
    }

    function deserializeScore(serialized: string): ScoreBreakdown | null {
      try {
        return JSON.parse(serialized);
      } catch {
        return null;
      }
    }

    it('should serialize score breakdown', () => {
      const score: ScoreBreakdown = {
        overall: 75,
        speed: 80,
        quality: 70,
        conversion: 75,
      };
      const serialized = serializeScore(score);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('75');
    });

    it('should deserialize score breakdown', () => {
      const serialized = '{"overall":75,"speed":80,"quality":70,"conversion":75}';
      const score = deserializeScore(serialized);
      expect(score).not.toBeNull();
      expect(score?.overall).toBe(75);
      expect(score?.speed).toBe(80);
    });

    it('should return null for invalid JSON', () => {
      const score = deserializeScore('invalid json');
      expect(score).toBeNull();
    });
  });

  describe('PageSpeed Caching Logic', () => {
    interface PageSpeedData {
      lcp: number;
      fcp: number;
      cls: number;
      tbt: number;
      strategy: 'mobile' | 'desktop';
    }

    function isValidPageSpeedData(data: unknown): data is PageSpeedData {
      if (!data || typeof data !== 'object') return false;
      const d = data as Record<string, unknown>;
      return (
        typeof d.lcp === 'number' &&
        typeof d.fcp === 'number' &&
        typeof d.cls === 'number' &&
        typeof d.tbt === 'number' &&
        (d.strategy === 'mobile' || d.strategy === 'desktop')
      );
    }

    it('should validate correct PageSpeed data', () => {
      const data: PageSpeedData = {
        lcp: 2500,
        fcp: 1800,
        cls: 0.1,
        tbt: 200,
        strategy: 'mobile',
      };
      expect(isValidPageSpeedData(data)).toBe(true);
    });

    it('should reject incomplete PageSpeed data', () => {
      const incomplete = { lcp: 2500, fcp: 1800 };
      expect(isValidPageSpeedData(incomplete)).toBe(false);
    });

    it('should reject null data', () => {
      expect(isValidPageSpeedData(null)).toBe(false);
    });

    it('should reject invalid strategy', () => {
      const data = {
        lcp: 2500,
        fcp: 1800,
        cls: 0.1,
        tbt: 200,
        strategy: 'tablet',
      };
      expect(isValidPageSpeedData(data)).toBe(false);
    });
  });

  describe('Cache Expiration Logic', () => {
    function shouldRefreshCache(
      cachedAt: Date,
      ttlSeconds: number
    ): boolean {
      if (ttlSeconds === 0) return false; // Never expires
      const now = new Date();
      const expiresAt = new Date(cachedAt.getTime() + ttlSeconds * 1000);
      return now >= expiresAt;
    }

    it('should not refresh when TTL is 0 (never expires)', () => {
      const cachedAt = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      expect(shouldRefreshCache(cachedAt, 0)).toBe(false);
    });

    it('should not refresh when within TTL', () => {
      const cachedAt = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      expect(shouldRefreshCache(cachedAt, 60)).toBe(false);
    });

    it('should refresh when TTL expired', () => {
      const cachedAt = new Date(Date.now() - 120 * 1000); // 2 minutes ago
      expect(shouldRefreshCache(cachedAt, 60)).toBe(true);
    });

    it('should refresh when exactly at TTL', () => {
      const cachedAt = new Date(Date.now() - 60 * 1000); // Exactly 60 seconds ago
      expect(shouldRefreshCache(cachedAt, 60)).toBe(true);
    });
  });

  describe('Rate Limit Key Generation', () => {
    function getRateLimitKey(identifier: string): string {
      const now = new Date();
      const minute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      return `ratelimit:${identifier}:${minute}`;
    }

    it('should generate unique key per minute', () => {
      const key = getRateLimitKey('test-shop');
      expect(key).toMatch(/^ratelimit:test-shop:\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/);
    });

    it('should include identifier in key', () => {
      const key = getRateLimitKey('my-shop.myshopify.com');
      expect(key).toContain('my-shop.myshopify.com');
    });
  });

  describe('Cache Invalidation Patterns', () => {
    function getInvalidationPatterns(shopDomain: string): string[] {
      return [
        `pagespeed:${shopDomain}:*`,
        `subscription:${shopDomain}`,
        `dashboard:${shopDomain}:*`,
      ];
    }

    it('should generate correct invalidation patterns', () => {
      const patterns = getInvalidationPatterns('test.myshopify.com');
      expect(patterns).toHaveLength(3);
      expect(patterns[0]).toBe('pagespeed:test.myshopify.com:*');
      expect(patterns[1]).toBe('subscription:test.myshopify.com');
      expect(patterns[2]).toBe('dashboard:test.myshopify.com:*');
    });

    it('should use wildcard for multi-key invalidation', () => {
      const patterns = getInvalidationPatterns('shop');
      expect(patterns[0]).toContain('*');
    });
  });
});
