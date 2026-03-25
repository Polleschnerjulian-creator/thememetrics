/**
 * Cache Layer Tests
 *
 * Comprehensive tests for all cache operations, including actual Redis
 * interactions via mocking, graceful degradation, and specialized functions.
 */

// Set up Redis env vars BEFORE the module loads
process.env.UPSTASH_REDIS_URL = 'https://fake-redis.upstash.io';
process.env.UPSTASH_REDIS_TOKEN = 'fake-token';

const mockPipelineExec = jest.fn();
const mockPipeline = {
  incr: jest.fn(),
  expire: jest.fn(),
  exec: mockPipelineExec,
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  scan: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  ping: jest.fn(),
  pipeline: jest.fn().mockReturnValue(mockPipeline),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

import {
  CACHE_KEYS,
  CACHE_TTL,
  buildCacheKey,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheExists,
  cacheIncrement,
  cacheTTL,
  cacheThrough,
  cacheHealthCheck,
  cachePageSpeed,
  getCachedPageSpeed,
  cacheScore,
  getCachedScore,
  cacheSubscription,
  getCachedSubscription,
  invalidateSubscriptionCache,
  invalidateShopCaches,
} from '@/lib/cache';

// ============================================
// SETUP
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockPipeline.incr.mockClear();
  mockPipeline.expire.mockClear();
  mockPipelineExec.mockClear();
  mockRedis.pipeline.mockReturnValue(mockPipeline);
});

// ============================================
// buildCacheKey TESTS
// ============================================

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

  it('should build dashboard key', () => {
    const key = buildCacheKey('DASHBOARD', 'shop', 'overview');
    expect(key).toBe('dashboard:shop:overview');
  });
});

// ============================================
// CACHE_KEYS and CACHE_TTL TESTS
// ============================================

describe('CACHE_KEYS', () => {
  it('should have all required prefixes', () => {
    expect(CACHE_KEYS.PAGESPEED).toBe('pagespeed');
    expect(CACHE_KEYS.SCORE).toBe('score');
    expect(CACHE_KEYS.SUBSCRIPTION).toBe('subscription');
    expect(CACHE_KEYS.RATE_LIMIT).toBe('ratelimit');
    expect(CACHE_KEYS.DASHBOARD).toBe('dashboard');
  });
});

describe('CACHE_TTL', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.PAGESPEED).toBe(86400);       // 24h
    expect(CACHE_TTL.SCORE).toBe(0);                // never expires
    expect(CACHE_TTL.SUBSCRIPTION).toBe(3600);      // 1h
    expect(CACHE_TTL.RATE_LIMIT).toBe(60);          // 1 min
    expect(CACHE_TTL.DASHBOARD).toBe(300);           // 5 min
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.MEDIUM).toBe(900);
    expect(CACHE_TTL.LONG).toBe(3600);
  });
});

// ============================================
// cacheGet TESTS
// ============================================

describe('cacheGet', () => {
  it('should return cached value on hit', async () => {
    mockRedis.get.mockResolvedValue({ score: 85 });

    const result = await cacheGet<{ score: number }>('score:123');
    expect(result).toEqual({ score: 85 });
    expect(mockRedis.get).toHaveBeenCalledWith('score:123');
  });

  it('should return null on cache miss', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await cacheGet('nonexistent:key');
    expect(result).toBeNull();
  });

  it('should return null when Redis is unavailable (throws)', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection refused'));

    const result = await cacheGet('any:key');
    expect(result).toBeNull();
  });
});

// ============================================
// cacheSet TESTS
// ============================================

describe('cacheSet', () => {
  it('should set with TTL when ttlSeconds > 0', async () => {
    mockRedis.set.mockResolvedValue('OK');

    const result = await cacheSet('key:1', { data: 'value' }, 300);
    expect(result).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('key:1', { data: 'value' }, { ex: 300 });
  });

  it('should set without TTL when ttlSeconds is 0', async () => {
    mockRedis.set.mockResolvedValue('OK');

    const result = await cacheSet('key:2', 'permanent', 0);
    expect(result).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('key:2', 'permanent');
  });

  it('should use default TTL (MEDIUM) when not specified', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cacheSet('key:3', 'data');
    expect(mockRedis.set).toHaveBeenCalledWith('key:3', 'data', { ex: CACHE_TTL.MEDIUM });
  });

  it('should return false when Redis is unavailable', async () => {
    mockRedis.set.mockRejectedValue(new Error('Redis down'));

    const result = await cacheSet('key:fail', 'data', 60);
    expect(result).toBe(false);
  });
});

// ============================================
// cacheDelete TESTS
// ============================================

describe('cacheDelete', () => {
  it('should delete a key and return true', async () => {
    mockRedis.del.mockResolvedValue(1);

    const result = await cacheDelete('key:to-delete');
    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith('key:to-delete');
  });

  it('should return false when Redis is unavailable', async () => {
    mockRedis.del.mockRejectedValue(new Error('Redis down'));

    const result = await cacheDelete('key:fail');
    expect(result).toBe(false);
  });
});

// ============================================
// cacheDeletePattern TESTS
// ============================================

describe('cacheDeletePattern', () => {
  it('should use SCAN (not KEYS) to find matching keys', async () => {
    mockRedis.scan.mockResolvedValue([0, ['key:1', 'key:2']]);
    mockRedis.del.mockResolvedValue(2);

    const result = await cacheDeletePattern('key:*');
    expect(result).toBe(true);
    expect(mockRedis.scan).toHaveBeenCalled();
    expect(mockRedis.keys).not.toHaveBeenCalled();
  });

  it('should delete found keys', async () => {
    mockRedis.scan.mockResolvedValue([0, ['pagespeed:shop:mobile', 'pagespeed:shop:desktop']]);
    mockRedis.del.mockResolvedValue(2);

    await cacheDeletePattern('pagespeed:shop:*');
    expect(mockRedis.del).toHaveBeenCalledWith('pagespeed:shop:mobile', 'pagespeed:shop:desktop');
  });

  it('should handle paginated SCAN results', async () => {
    // First scan returns cursor 42 with some keys
    mockRedis.scan
      .mockResolvedValueOnce([42, ['key:1', 'key:2']])
      .mockResolvedValueOnce([0, ['key:3']]);
    mockRedis.del.mockResolvedValue(3);

    const result = await cacheDeletePattern('key:*');
    expect(result).toBe(true);
    expect(mockRedis.scan).toHaveBeenCalledTimes(2);
    // Should delete all 3 keys
    expect(mockRedis.del).toHaveBeenCalledWith('key:1', 'key:2', 'key:3');
  });

  it('should delete in batches of 100', async () => {
    // Return 150 keys
    const keys = Array.from({ length: 150 }, (_, i) => `key:${i}`);
    mockRedis.scan.mockResolvedValue([0, keys]);
    mockRedis.del.mockResolvedValue(100);

    await cacheDeletePattern('key:*');
    // Should be called twice: first 100, then remaining 50
    expect(mockRedis.del).toHaveBeenCalledTimes(2);
    expect(mockRedis.del).toHaveBeenNthCalledWith(1, ...keys.slice(0, 100));
    expect(mockRedis.del).toHaveBeenNthCalledWith(2, ...keys.slice(100, 150));
  });

  it('should not call del if no keys found', async () => {
    mockRedis.scan.mockResolvedValue([0, []]);

    const result = await cacheDeletePattern('nonexistent:*');
    expect(result).toBe(true);
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('should return false when Redis is unavailable', async () => {
    mockRedis.scan.mockRejectedValue(new Error('Redis down'));

    const result = await cacheDeletePattern('any:*');
    expect(result).toBe(false);
  });
});

// ============================================
// cacheIncrement TESTS
// ============================================

describe('cacheIncrement', () => {
  it('should use pipeline for atomic INCR+EXPIRE', async () => {
    mockPipelineExec.mockResolvedValue([5, true]);

    const result = await cacheIncrement('ratelimit:user:1', 60);
    expect(result).toBe(5);
    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPipeline.incr).toHaveBeenCalledWith('ratelimit:user:1');
    expect(mockPipeline.expire).toHaveBeenCalledWith('ratelimit:user:1', 60);
    expect(mockPipelineExec).toHaveBeenCalled();
  });

  it('should not set expire when ttlSeconds is 0', async () => {
    mockPipelineExec.mockResolvedValue([3]);

    await cacheIncrement('counter:permanent', 0);
    expect(mockPipeline.incr).toHaveBeenCalledWith('counter:permanent');
    expect(mockPipeline.expire).not.toHaveBeenCalled();
  });

  it('should use default TTL (RATE_LIMIT = 60s)', async () => {
    mockPipelineExec.mockResolvedValue([1, true]);

    await cacheIncrement('ratelimit:default');
    expect(mockPipeline.expire).toHaveBeenCalledWith('ratelimit:default', CACHE_TTL.RATE_LIMIT);
  });

  it('should return null when Redis is unavailable', async () => {
    mockPipelineExec.mockRejectedValue(new Error('Redis down'));

    const result = await cacheIncrement('any:key');
    expect(result).toBeNull();
  });

  it('should return null when pipeline returns empty', async () => {
    mockPipelineExec.mockResolvedValue(null);

    const result = await cacheIncrement('any:key');
    expect(result).toBeNull();
  });
});

// ============================================
// cacheExists TESTS
// ============================================

describe('cacheExists', () => {
  it('should return true when key exists', async () => {
    mockRedis.exists.mockResolvedValue(1);

    const result = await cacheExists('existing:key');
    expect(result).toBe(true);
  });

  it('should return false when key does not exist', async () => {
    mockRedis.exists.mockResolvedValue(0);

    const result = await cacheExists('missing:key');
    expect(result).toBe(false);
  });

  it('should return false when Redis is unavailable', async () => {
    mockRedis.exists.mockRejectedValue(new Error('Redis down'));

    const result = await cacheExists('any:key');
    expect(result).toBe(false);
  });
});

// ============================================
// cacheTTL TESTS
// ============================================

describe('cacheTTL', () => {
  it('should return TTL for a key', async () => {
    mockRedis.ttl.mockResolvedValue(300);

    const result = await cacheTTL('some:key');
    expect(result).toBe(300);
  });

  it('should return null when Redis is unavailable', async () => {
    mockRedis.ttl.mockRejectedValue(new Error('Redis down'));

    const result = await cacheTTL('any:key');
    expect(result).toBeNull();
  });
});

// ============================================
// cacheThrough TESTS
// ============================================

describe('cacheThrough', () => {
  it('should return cached value if hit', async () => {
    mockRedis.get.mockResolvedValue({ cached: true });

    const computeFn = jest.fn().mockResolvedValue({ computed: true });
    const result = await cacheThrough('key:hit', 300, computeFn);

    expect(result).toEqual({ cached: true });
    expect(computeFn).not.toHaveBeenCalled();
  });

  it('should compute and cache on miss', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');

    const computeFn = jest.fn().mockResolvedValue({ computed: true });
    const result = await cacheThrough('key:miss', 300, computeFn);

    expect(result).toEqual({ computed: true });
    expect(computeFn).toHaveBeenCalled();
    // cacheSet is fire-and-forget, but set should be called
    // Allow some time for the async fire-and-forget
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockRedis.set).toHaveBeenCalledWith('key:miss', { computed: true }, { ex: 300 });
  });

  it('should still return computed value even if caching fails', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockRejectedValue(new Error('Redis down'));

    const computeFn = jest.fn().mockResolvedValue({ result: 42 });
    const result = await cacheThrough('key:fail', 300, computeFn);

    expect(result).toEqual({ result: 42 });
  });

  it('should still compute when Redis get fails (graceful degradation)', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis down'));
    mockRedis.set.mockResolvedValue('OK');

    const computeFn = jest.fn().mockResolvedValue({ fresh: true });
    const result = await cacheThrough('key:redis-down', 300, computeFn);

    // cacheGet returns null on error, so computeFn runs
    expect(result).toEqual({ fresh: true });
    expect(computeFn).toHaveBeenCalled();
  });
});

// ============================================
// cacheHealthCheck TESTS
// ============================================

describe('cacheHealthCheck', () => {
  it('should return true on ping success', async () => {
    mockRedis.ping.mockResolvedValue('PONG');

    const result = await cacheHealthCheck();
    expect(result).toBe(true);
    expect(mockRedis.ping).toHaveBeenCalled();
  });

  it('should return false on ping failure', async () => {
    mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

    const result = await cacheHealthCheck();
    expect(result).toBe(false);
  });
});

// ============================================
// SPECIALIZED FUNCTIONS TESTS
// ============================================

describe('cachePageSpeed / getCachedPageSpeed', () => {
  it('should cache PageSpeed data with correct key and TTL', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cachePageSpeed('shop.myshopify.com', 'mobile', { lcp: 2500 });
    expect(mockRedis.set).toHaveBeenCalledWith(
      'pagespeed:shop.myshopify.com:mobile',
      { lcp: 2500 },
      { ex: CACHE_TTL.PAGESPEED }
    );
  });

  it('should retrieve cached PageSpeed data', async () => {
    mockRedis.get.mockResolvedValue({ lcp: 2500 });

    const result = await getCachedPageSpeed('shop.myshopify.com', 'mobile');
    expect(result).toEqual({ lcp: 2500 });
    expect(mockRedis.get).toHaveBeenCalledWith('pagespeed:shop.myshopify.com:mobile');
  });
});

describe('cacheScore / getCachedScore', () => {
  it('should cache score with TTL=0 (immutable, never expires)', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cacheScore(42, { overall: 85 });
    // SCORE TTL is 0, so set should be called without ex
    expect(mockRedis.set).toHaveBeenCalledWith('score:42', { overall: 85 });
  });

  it('should retrieve cached score', async () => {
    mockRedis.get.mockResolvedValue({ overall: 85 });

    const result = await getCachedScore(42);
    expect(result).toEqual({ overall: 85 });
    expect(mockRedis.get).toHaveBeenCalledWith('score:42');
  });
});

describe('cacheSubscription / getCachedSubscription', () => {
  it('should cache subscription with correct TTL', async () => {
    mockRedis.set.mockResolvedValue('OK');

    await cacheSubscription('shop.myshopify.com', { plan: 'pro' });
    expect(mockRedis.set).toHaveBeenCalledWith(
      'subscription:shop.myshopify.com',
      { plan: 'pro' },
      { ex: CACHE_TTL.SUBSCRIPTION }
    );
  });

  it('should retrieve cached subscription', async () => {
    mockRedis.get.mockResolvedValue({ plan: 'pro' });

    const result = await getCachedSubscription('shop.myshopify.com');
    expect(result).toEqual({ plan: 'pro' });
  });
});

describe('invalidateSubscriptionCache', () => {
  it('should delete subscription cache key', async () => {
    mockRedis.del.mockResolvedValue(1);

    const result = await invalidateSubscriptionCache('shop.myshopify.com');
    expect(result).toBe(true);
    expect(mockRedis.del).toHaveBeenCalledWith('subscription:shop.myshopify.com');
  });
});

// ============================================
// invalidateShopCaches TESTS
// ============================================

describe('invalidateShopCaches', () => {
  it('should delete all patterns for a shop', async () => {
    mockRedis.scan.mockResolvedValue([0, []]);

    const result = await invalidateShopCaches('shop.myshopify.com');
    expect(result).toBe(true);

    // Should attempt to delete 3 patterns
    expect(mockRedis.scan).toHaveBeenCalledTimes(3);
  });

  it('should delete pagespeed, subscription, and dashboard patterns', async () => {
    mockRedis.scan.mockResolvedValue([0, ['some-key']]);
    mockRedis.del.mockResolvedValue(1);

    await invalidateShopCaches('test.myshopify.com');

    // Check the scan calls include the right patterns
    const scanCalls = mockRedis.scan.mock.calls;
    const patterns = scanCalls.map((call: any[]) => call[1]?.match);
    expect(patterns).toContain('pagespeed:test.myshopify.com:*');
    expect(patterns).toContain('subscription:test.myshopify.com');
    expect(patterns).toContain('dashboard:test.myshopify.com:*');
  });

  it('should return false if any pattern deletion fails', async () => {
    mockRedis.scan
      .mockResolvedValueOnce([0, []])
      .mockRejectedValueOnce(new Error('Redis fail'))
      .mockResolvedValueOnce([0, []]);

    const result = await invalidateShopCaches('shop.myshopify.com');
    expect(result).toBe(false);
  });
});

// ============================================
// GRACEFUL DEGRADATION TESTS
// ============================================

describe('graceful degradation (all operations)', () => {
  it('cacheGet returns null on error', async () => {
    mockRedis.get.mockRejectedValue(new Error('fail'));
    expect(await cacheGet('key')).toBeNull();
  });

  it('cacheSet returns false on error', async () => {
    mockRedis.set.mockRejectedValue(new Error('fail'));
    expect(await cacheSet('key', 'val')).toBe(false);
  });

  it('cacheDelete returns false on error', async () => {
    mockRedis.del.mockRejectedValue(new Error('fail'));
    expect(await cacheDelete('key')).toBe(false);
  });

  it('cacheDeletePattern returns false on error', async () => {
    mockRedis.scan.mockRejectedValue(new Error('fail'));
    expect(await cacheDeletePattern('key:*')).toBe(false);
  });

  it('cacheIncrement returns null on error', async () => {
    mockPipelineExec.mockRejectedValue(new Error('fail'));
    expect(await cacheIncrement('key')).toBeNull();
  });

  it('cacheExists returns false on error', async () => {
    mockRedis.exists.mockRejectedValue(new Error('fail'));
    expect(await cacheExists('key')).toBe(false);
  });

  it('cacheTTL returns null on error', async () => {
    mockRedis.ttl.mockRejectedValue(new Error('fail'));
    expect(await cacheTTL('key')).toBeNull();
  });

  it('cacheHealthCheck returns false on error', async () => {
    mockRedis.ping.mockRejectedValue(new Error('fail'));
    expect(await cacheHealthCheck()).toBe(false);
  });
});
