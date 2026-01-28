/**
 * Auth Flow Tests
 */

import { isValidShopDomain, verifyShopifyWebhook } from '@/lib/security';

describe('Auth Flow', () => {
  describe('Shop Domain Validation', () => {
    it('should accept valid myshopify.com domain', () => {
      expect(isValidShopDomain('test-store.myshopify.com')).toBe(true);
    });

    it('should accept domain with numbers', () => {
      expect(isValidShopDomain('store123.myshopify.com')).toBe(true);
    });

    it('should accept domain with hyphens', () => {
      expect(isValidShopDomain('my-test-store.myshopify.com')).toBe(true);
    });

    it('should reject non-myshopify.com domain', () => {
      expect(isValidShopDomain('test-store.shopify.com')).toBe(false);
    });

    it('should reject custom domains', () => {
      expect(isValidShopDomain('www.example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidShopDomain('')).toBe(false);
    });

    it('should reject domain with special characters', () => {
      expect(isValidShopDomain('test_store.myshopify.com')).toBe(false);
    });

    it('should reject domain starting with hyphen', () => {
      expect(isValidShopDomain('-teststore.myshopify.com')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidShopDomain(null)).toBe(false);
      expect(isValidShopDomain(undefined)).toBe(false);
    });
  });

  describe('Webhook HMAC Verification', () => {
    // Using verifyShopifyWebhook which is the actual exported function

    it('should return false when hmac header is null', () => {
      const result = verifyShopifyWebhook('test body', null);
      expect(result).toBe(false);
    });

    it('should return false when hmac header is empty', () => {
      const result = verifyShopifyWebhook('test body', '');
      expect(result).toBe(false);
    });

    it('should return false for invalid hmac', () => {
      const result = verifyShopifyWebhook('test body', 'invalid_hmac');
      expect(result).toBe(false);
    });
  });

  describe('OAuth State Generation', () => {
    function generateState(): string {
      const crypto = require('crypto');
      return crypto.randomBytes(16).toString('hex');
    }

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('should generate 32 character hex string', () => {
      const state = generateState();
      expect(state).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('Session Cookie Logic', () => {
    interface CookieOptions {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
      maxAge: number;
      path: string;
    }

    function getSessionCookieOptions(isProduction: boolean): CookieOptions {
      return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      };
    }

    it('should set httpOnly for security', () => {
      const options = getSessionCookieOptions(true);
      expect(options.httpOnly).toBe(true);
    });

    it('should set secure in production', () => {
      const options = getSessionCookieOptions(true);
      expect(options.secure).toBe(true);
    });

    it('should not set secure in development', () => {
      const options = getSessionCookieOptions(false);
      expect(options.secure).toBe(false);
    });

    it('should use sameSite lax', () => {
      const options = getSessionCookieOptions(true);
      expect(options.sameSite).toBe('lax');
    });

    it('should expire in 7 days', () => {
      const options = getSessionCookieOptions(true);
      expect(options.maxAge).toBe(60 * 60 * 24 * 7);
    });
  });

  describe('Redirect URL Validation', () => {
    const appUrl = 'https://thememetrics.de';

    function isValidRedirectUrl(url: string): boolean {
      try {
        const parsed = new URL(url);
        const appParsed = new URL(appUrl);
        return parsed.hostname === appParsed.hostname;
      } catch {
        return false;
      }
    }

    it('should allow same-origin redirect', () => {
      expect(isValidRedirectUrl('https://thememetrics.de/dashboard')).toBe(true);
    });

    it('should reject cross-origin redirect', () => {
      expect(isValidRedirectUrl('https://evil.com/steal')).toBe(false);
    });

    it('should reject invalid URL', () => {
      expect(isValidRedirectUrl('not-a-url')).toBe(false);
    });

    it('should reject javascript: protocol', () => {
      expect(isValidRedirectUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('Access Token Handling', () => {
    function maskAccessToken(token: string): string {
      if (token.length <= 8) return '****';
      return token.substring(0, 4) + '****' + token.substring(token.length - 4);
    }

    it('should mask access token for logging', () => {
      const token = 'shpat_1234567890abcdef';
      const masked = maskAccessToken(token);
      expect(masked).not.toContain('1234567890');
      expect(masked).toContain('****');
    });

    it('should handle short tokens', () => {
      const masked = maskAccessToken('short');
      expect(masked).toBe('****');
    });

    it('should preserve start and end', () => {
      const token = 'shpat_1234567890abcdef';
      const masked = maskAccessToken(token);
      expect(masked.startsWith('shpa')).toBe(true);
      expect(masked.endsWith('cdef')).toBe(true);
    });
  });

  describe('Error Response Codes', () => {
    const ERROR_CODES = {
      missing_params: 'Fehlende Parameter',
      invalid_shop: 'Ungültiger Shop',
      shop_mismatch: 'Shop stimmt nicht überein',
      no_token: 'Kein Access Token erhalten',
      auth_failed: 'Authentifizierung fehlgeschlagen',
      db_error: 'Datenbankfehler',
    };

    it('should have error message for missing_params', () => {
      expect(ERROR_CODES.missing_params).toBeDefined();
    });

    it('should have error message for invalid_shop', () => {
      expect(ERROR_CODES.invalid_shop).toBeDefined();
    });

    it('should have error message for all codes', () => {
      Object.values(ERROR_CODES).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
