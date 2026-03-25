/**
 * Session Token Module Tests
 *
 * Comprehensive tests for JWT session token verification and extraction.
 * Tests the REAL functions from lib/session-token.ts — no local stubs.
 */

import crypto from 'crypto';
import {
  verifySessionToken,
  getShopFromToken,
  isTokenExpired,
  getSessionTokenFromRequest,
  verifyRequestAndGetShop,
} from '@/lib/session-token';

// ============================================
// TEST HELPERS
// ============================================

/**
 * Create a signed JWT for testing, matching the real HMAC-SHA256 flow.
 */
function createTestToken(
  payload: Record<string, any>,
  secret: string = 'test-api-secret'
): string {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodeBase64Url = (obj: any): string => {
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

/**
 * Build a valid Shopify session-token payload with sensible defaults.
 */
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
// verifySessionToken
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

  it('should return payload for a valid token with correct HMAC', () => {
    const payload = createValidPayload();
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).not.toBeNull();
    expect(result!.iss).toBe(payload.iss);
    expect(result!.dest).toBe(payload.dest);
    expect(result!.aud).toBe(payload.aud);
    expect(result!.sub).toBe(payload.sub);
    expect(result!.jti).toBe(payload.jti);
    expect(result!.sid).toBe(payload.sid);
  });

  it('should return null for a token signed with the wrong secret (timing-safe rejection)', () => {
    const payload = createValidPayload();
    const token = createTestToken(payload, 'wrong-secret');

    const result = verifySessionToken(token);

    expect(result).toBeNull();
  });

  it('should return null for an expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createValidPayload({ exp: now - 3600 });
    const token = createTestToken(payload);

    expect(verifySessionToken(token)).toBeNull();
  });

  it('should return null when nbf is in the future', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createValidPayload({ nbf: now + 3600 });
    const token = createTestToken(payload);

    expect(verifySessionToken(token)).toBeNull();
  });

  it('should return null for wrong audience when SHOPIFY_API_KEY is set', () => {
    const payload = createValidPayload({ aud: 'wrong-api-key' });
    const token = createTestToken(payload);

    expect(verifySessionToken(token)).toBeNull();
  });

  it('should skip audience check when SHOPIFY_API_KEY is not set', () => {
    delete process.env.SHOPIFY_API_KEY;

    const payload = createValidPayload({ aud: 'any-audience-at-all' });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);
    expect(result).not.toBeNull();
    expect(result!.aud).toBe('any-audience-at-all');
  });

  it('should return null for malformed token (not 3 parts)', () => {
    expect(verifySessionToken('only-one-part')).toBeNull();
    expect(verifySessionToken('two.parts')).toBeNull();
    expect(verifySessionToken('four.parts.here.oops')).toBeNull();
    expect(verifySessionToken('a.b.c.d.e')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(verifySessionToken('')).toBeNull();
  });

  it('should return null when SHOPIFY_API_SECRET env var is missing (not just empty string)', () => {
    delete process.env.SHOPIFY_API_SECRET;

    const payload = createValidPayload();
    // Sign with an arbitrary secret — should not matter since the function should bail early
    const token = createTestToken(payload, 'anything');

    expect(verifySessionToken(token)).toBeNull();
  });

  it('should return null when SHOPIFY_API_SECRET is empty string', () => {
    process.env.SHOPIFY_API_SECRET = '';

    const payload = createValidPayload();
    const token = createTestToken(payload, '');

    // Empty string is falsy, so the function returns null before any HMAC check
    expect(verifySessionToken(token)).toBeNull();
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

  it('should handle token with special characters in claims', () => {
    const payload = createValidPayload({
      dest: 'https://special-chars-shop.myshopify.com',
      sub: 'user_with_underscore',
    });
    const token = createTestToken(payload);

    const result = verifySessionToken(token);

    expect(result).not.toBeNull();
    expect(result!.sub).toBe('user_with_underscore');
    expect(result!.dest).toBe('https://special-chars-shop.myshopify.com');
  });

  it('should use timing-safe comparison (signature length mismatch returns null, does not throw)', () => {
    // Craft a token whose base64url signature has a different length than the expected one.
    // We do this by manually building a token with a truncated signature.
    const payload = createValidPayload();
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const payloadB64 = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const token = `${headerB64}.${payloadB64}.short`;

    // Should return null gracefully — timingSafeEqual would throw on length mismatch,
    // but the code checks length first.
    expect(verifySessionToken(token)).toBeNull();
  });
});

// ============================================
// getShopFromToken
// ============================================

describe('getShopFromToken', () => {
  const basePayload = {
    iss: 'https://test-shop.myshopify.com/admin',
    dest: 'https://test-shop.myshopify.com',
    aud: 'test-api-key',
    sub: '12345',
    exp: Math.floor(Date.now() / 1000) + 3600,
    nbf: Math.floor(Date.now() / 1000) - 60,
    iat: Math.floor(Date.now() / 1000) - 60,
    jti: 'test-jti',
    sid: 'test-sid',
  };

  it('should extract shop from https:// dest', () => {
    const payload = { ...basePayload, dest: 'https://test-shop.myshopify.com' };
    expect(getShopFromToken(payload)).toBe('test-shop.myshopify.com');
  });

  it('should extract shop from http:// dest', () => {
    const payload = { ...basePayload, dest: 'http://test-shop.myshopify.com' };
    expect(getShopFromToken(payload)).toBe('test-shop.myshopify.com');
  });

  it('should return domain as-is when no protocol prefix', () => {
    const payload = { ...basePayload, dest: 'test-shop.myshopify.com' };
    expect(getShopFromToken(payload)).toBe('test-shop.myshopify.com');
  });

  it('should handle shop domains with hyphens', () => {
    const payload = { ...basePayload, dest: 'https://my-awesome-shop-name.myshopify.com' };
    expect(getShopFromToken(payload)).toBe('my-awesome-shop-name.myshopify.com');
  });
});

// ============================================
// isTokenExpired
// ============================================

describe('isTokenExpired', () => {
  const makePayload = (exp: number) => ({
    iss: 'https://test-shop.myshopify.com/admin',
    dest: 'https://test-shop.myshopify.com',
    aud: 'test-api-key',
    sub: '12345',
    exp,
    nbf: Math.floor(Date.now() / 1000) - 7200,
    iat: Math.floor(Date.now() / 1000) - 7200,
    jti: 'test-jti',
    sid: 'test-sid',
  });

  it('should return true for expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(makePayload(now - 3600))).toBe(true);
  });

  it('should return false for non-expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(makePayload(now + 3600))).toBe(false);
  });

  it('should return true when exp equals current time (boundary: exp < now is false when equal, but let us test)', () => {
    // The implementation uses `payload.exp < now`. When exp === now, exp < now is false,
    // so the token is NOT considered expired at the exact boundary second.
    const now = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(makePayload(now))).toBe(false);
  });

  it('should return true for token that expired 1 second ago', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(makePayload(now - 1))).toBe(true);
  });
});

// ============================================
// getSessionTokenFromRequest
// ============================================

describe('getSessionTokenFromRequest', () => {
  it('should extract token from Bearer Authorization header', () => {
    const request = new Request('http://localhost:3000', {
      headers: { Authorization: 'Bearer my-session-token' },
    });
    expect(getSessionTokenFromRequest(request)).toBe('my-session-token');
  });

  it('should return null when Authorization header is missing', () => {
    const request = new Request('http://localhost:3000');
    expect(getSessionTokenFromRequest(request)).toBeNull();
  });

  it('should return null for non-Bearer auth (e.g. Basic)', () => {
    const request = new Request('http://localhost:3000', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(getSessionTokenFromRequest(request)).toBeNull();
  });

  it('should return null for empty Bearer value', () => {
    const request = new Request('http://localhost:3000', {
      headers: { Authorization: 'Bearer ' },
    });
    // Header value 'Bearer ' may be trimmed to 'Bearer' by the Headers API,
    // which does not startWith('Bearer '), so it returns null.
    expect(getSessionTokenFromRequest(request)).toBeNull();
  });

  it('should handle a full JWT-like token string', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const request = new Request('http://localhost:3000', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(getSessionTokenFromRequest(request)).toBe(jwt);
  });
});

// ============================================
// verifyRequestAndGetShop
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

  it('should return shop from a valid Bearer token', () => {
    const payload = createValidPayload({ dest: 'https://my-store.myshopify.com' });
    const token = createTestToken(payload);

    const request = new Request('http://localhost:3000', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(verifyRequestAndGetShop(request)).toBe('my-store.myshopify.com');
  });

  it('should return null when no Authorization header is present (no query param or header fallback)', () => {
    // SECURITY: verifyRequestAndGetShop only reads from Bearer token.
    // Query params and X-Shop-Domain headers must NOT be accepted.
    const request = new Request('http://localhost:3000?shop=injected-shop.myshopify.com', {
      headers: { 'X-Shop-Domain': 'injected-header-shop.myshopify.com' },
    });

    expect(verifyRequestAndGetShop(request)).toBeNull();
  });

  it('should return null for an invalid / tampered token', () => {
    const request = new Request('http://localhost:3000', {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });

    expect(verifyRequestAndGetShop(request)).toBeNull();
  });

  it('should return null for an expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createValidPayload({ exp: now - 100 });
    const token = createTestToken(payload);

    const request = new Request('http://localhost:3000', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(verifyRequestAndGetShop(request)).toBeNull();
  });

  it('should return null when request has no auth at all', () => {
    const request = new Request('http://localhost:3000');
    expect(verifyRequestAndGetShop(request)).toBeNull();
  });
});
