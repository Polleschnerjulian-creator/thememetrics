/**
 * Session Token Module Tests
 *
 * Tests for JWT session token verification and extraction functions
 */

import crypto from 'crypto';
import {
  verifySessionToken,
  getShopFromToken,
  isTokenExpired,
  getSessionTokenFromRequest,
  verifyRequestAndGetShop,
} from '@/lib/session-token';

// Helper to create valid JWT tokens for testing
function createTestToken(
  payload: Record<string, any>,
  secret: string = 'test-api-secret'
): string {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodeBase64Url = (obj: any) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerB64 = encodeBase64Url(header);
  const payloadB64 = encodeBase64Url(payload);

  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

// Create a valid payload with proper timestamps
function createValidPayload(overrides: Partial<Record<string, any>> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'https://test-shop.myshopify.com/admin',
    dest: 'https://test-shop.myshopify.com',
    aud: 'test-api-key',
    sub: '12345',
    exp: now + 3600, // 1 hour from now
    nbf: now - 60,   // 1 minute ago
    iat: now - 60,
    jti: 'test-jti-12345',
    sid: 'test-session-id',
    ...overrides,
  };
}

// ============================================
// verifySessionToken TESTS
// ============================================

describe('verifySessionToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SHOPIFY_API_SECRET = 'test-api-secret';
    process.env.SHOPIFY_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return payload for valid token', () => {
    const payload = createValidPayload();
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).not.toBeNull();
    expect(result?.iss).toBe(payload.iss);
    expect(result?.dest).toBe(payload.dest);
    expect(result?.sub).toBe(payload.sub);
  });

  it('should return null for token with invalid signature', () => {
    const payload = createValidPayload();
    const token = createTestToken(payload, 'wrong-secret');

    const result = verifySessionToken(token);

    expect(result).toBeNull();
  });

  it('should return null for expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createValidPayload({
      exp: now - 3600, // 1 hour ago
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).toBeNull();
  });

  it('should return null for token not yet valid (nbf in future)', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createValidPayload({
      nbf: now + 3600, // 1 hour from now
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).toBeNull();
  });

  it('should return null for token with wrong audience', () => {
    const payload = createValidPayload({
      aud: 'wrong-api-key',
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).toBeNull();
  });

  it('should return null for malformed token (wrong number of parts)', () => {
    expect(verifySessionToken('only-one-part')).toBeNull();
    expect(verifySessionToken('two.parts')).toBeNull();
    expect(verifySessionToken('four.parts.here.oops')).toBeNull();
  });

  it('should return null for empty token', () => {
    expect(verifySessionToken('')).toBeNull();
  });

  it('should return null for token with invalid JSON payload', () => {
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .toString('base64url');
    const invalidPayloadB64 = Buffer.from('not-valid-json')
      .toString('base64url');
    const signature = crypto
      .createHmac('sha256', 'test-api-secret')
      .update(`${headerB64}.${invalidPayloadB64}`)
      .digest('base64url');

    const token = `${headerB64}.${invalidPayloadB64}.${signature}`;

    expect(verifySessionToken(token)).toBeNull();
  });

  it('should accept token when SHOPIFY_API_KEY is not set', () => {
    delete process.env.SHOPIFY_API_KEY;

    const payload = createValidPayload({
      aud: 'any-audience', // Should be accepted without validation
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    // Note: The code checks `if (expectedAudience && payload.aud !== expectedAudience)`
    // So when expectedAudience is undefined, it skips the audience check
    expect(result).not.toBeNull();
  });

  it('should handle token with special characters in claims', () => {
    const payload = createValidPayload({
      dest: 'https://special-chars-shop.myshopify.com',
      sub: 'user_with_underscore',
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).not.toBeNull();
    expect(result?.sub).toBe('user_with_underscore');
  });
});

// ============================================
// getShopFromToken TESTS
// ============================================

describe('getShopFromToken', () => {
  it('should extract shop domain from https URL', () => {
    const payload = {
      iss: 'https://test-shop.myshopify.com/admin',
      dest: 'https://test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: Date.now() / 1000 + 3600,
      nbf: Date.now() / 1000 - 60,
      iat: Date.now() / 1000 - 60,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    const shop = getShopFromToken(payload);

    expect(shop).toBe('test-shop.myshopify.com');
  });

  it('should extract shop domain from http URL', () => {
    const payload = {
      iss: 'http://test-shop.myshopify.com/admin',
      dest: 'http://test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: Date.now() / 1000 + 3600,
      nbf: Date.now() / 1000 - 60,
      iat: Date.now() / 1000 - 60,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    const shop = getShopFromToken(payload);

    expect(shop).toBe('test-shop.myshopify.com');
  });

  it('should handle domain without protocol', () => {
    const payload = {
      iss: 'test-shop.myshopify.com/admin',
      dest: 'test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: Date.now() / 1000 + 3600,
      nbf: Date.now() / 1000 - 60,
      iat: Date.now() / 1000 - 60,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    const shop = getShopFromToken(payload);

    expect(shop).toBe('test-shop.myshopify.com');
  });

  it('should handle shop domains with hyphens', () => {
    const payload = {
      iss: 'https://my-awesome-shop-name.myshopify.com/admin',
      dest: 'https://my-awesome-shop-name.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: Date.now() / 1000 + 3600,
      nbf: Date.now() / 1000 - 60,
      iat: Date.now() / 1000 - 60,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    const shop = getShopFromToken(payload);

    expect(shop).toBe('my-awesome-shop-name.myshopify.com');
  });
});

// ============================================
// isTokenExpired TESTS
// ============================================

describe('isTokenExpired', () => {
  it('should return true for expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://test-shop.myshopify.com/admin',
      dest: 'https://test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: now - 3600, // 1 hour ago
      nbf: now - 7200,
      iat: now - 7200,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    expect(isTokenExpired(payload)).toBe(true);
  });

  it('should return false for valid token', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://test-shop.myshopify.com/admin',
      dest: 'https://test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: now + 3600, // 1 hour from now
      nbf: now - 60,
      iat: now - 60,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    expect(isTokenExpired(payload)).toBe(false);
  });

  it('should return true for token that just expired', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://test-shop.myshopify.com/admin',
      dest: 'https://test-shop.myshopify.com',
      aud: 'test-api-key',
      sub: '12345',
      exp: now - 1, // 1 second ago
      nbf: now - 3600,
      iat: now - 3600,
      jti: 'test-jti',
      sid: 'test-sid',
    };

    expect(isTokenExpired(payload)).toBe(true);
  });
});

// ============================================
// getSessionTokenFromRequest TESTS
// ============================================

describe('getSessionTokenFromRequest', () => {
  it('should extract token from Bearer Authorization header', () => {
    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: 'Bearer test-token-12345',
      },
    });

    const token = getSessionTokenFromRequest(request);

    expect(token).toBe('test-token-12345');
  });

  it('should return null when Authorization header is missing', () => {
    const request = new Request('http://localhost:3000');

    const token = getSessionTokenFromRequest(request);

    expect(token).toBeNull();
  });

  it('should return null when Authorization header does not start with Bearer', () => {
    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: 'Basic dXNlcjpwYXNz',
      },
    });

    const token = getSessionTokenFromRequest(request);

    expect(token).toBeNull();
  });

  it('should return null for empty Bearer token', () => {
    // Note: Headers may trim trailing whitespace, so 'Bearer ' becomes 'Bearer'
    // which doesn't start with 'Bearer ' (with space), so returns null
    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: 'Bearer ',
      },
    });

    const token = getSessionTokenFromRequest(request);

    // Returns null because trimmed header doesn't match 'Bearer '
    expect(token).toBeNull();
  });

  it('should handle token with special characters', () => {
    const complexToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: `Bearer ${complexToken}`,
      },
    });

    const token = getSessionTokenFromRequest(request);

    expect(token).toBe(complexToken);
  });
});

// ============================================
// verifyRequestAndGetShop TESTS
// ============================================

describe('verifyRequestAndGetShop', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SHOPIFY_API_SECRET = 'test-api-secret';
    process.env.SHOPIFY_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return shop from valid session token', () => {
    const payload = createValidPayload();
    const token = createTestToken(payload);

    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBe('test-shop.myshopify.com');
  });

  it('should return null for invalid session token', () => {
    const request = new Request('http://localhost:3000', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBeNull();
  });

  it('should fallback to query param when no token', () => {
    const request = new Request('http://localhost:3000?shop=query-shop.myshopify.com');

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBe('query-shop.myshopify.com');
  });

  it('should fallback to X-Shop-Domain header when no token or query', () => {
    const request = new Request('http://localhost:3000', {
      headers: {
        'X-Shop-Domain': 'header-shop.myshopify.com',
      },
    });

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBe('header-shop.myshopify.com');
  });

  it('should prefer query param over header when no token', () => {
    const request = new Request('http://localhost:3000?shop=query-shop.myshopify.com', {
      headers: {
        'X-Shop-Domain': 'header-shop.myshopify.com',
      },
    });

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBe('query-shop.myshopify.com');
  });

  it('should return null when no authentication method available', () => {
    const request = new Request('http://localhost:3000');

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBeNull();
  });

  it('should prefer valid token over query param', () => {
    const payload = createValidPayload({
      dest: 'https://token-shop.myshopify.com',
    });
    const token = createTestToken(payload);

    const request = new Request('http://localhost:3000?shop=query-shop.myshopify.com', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const shop = verifyRequestAndGetShop(request);

    expect(shop).toBe('token-shop.myshopify.com');
  });
});
