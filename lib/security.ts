/**
 * Security Utilities für ThemeMetrics
 * - Input Validation
 * - HMAC Verification
 * - Sanitization
 */

import crypto from 'crypto';

// ============================================
// SHOPIFY HMAC VERIFICATION
// ============================================

/**
 * Verify Shopify webhook HMAC signature
 */
export function verifyShopifyWebhook(
  rawBody: string | Buffer,
  hmacHeader: string | null
): boolean {
  if (!hmacHeader) return false;
  
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error('SHOPIFY_API_SECRET not configured');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  
  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

/**
 * Verify Shopify OAuth HMAC (query params)
 */
export function verifyShopifyOAuth(query: URLSearchParams): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;
  
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;
  
  // Build message from sorted params (excluding hmac)
  const params = new URLSearchParams();
  query.forEach((value, key) => {
    if (key !== 'hmac') {
      params.append(key, value);
    }
  });
  params.sort();
  
  const message = params.toString();
  const hash = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmac)
    );
  } catch {
    return false;
  }
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validate shop domain format
 */
export function isValidShopDomain(shop: string | null | undefined): boolean {
  if (!shop) return false;
  
  // Must match: store-name.myshopify.com
  const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return pattern.test(shop) && shop.length <= 255;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email) && email.length <= 320;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return false;
  
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return pattern.test(uuid);
}

/**
 * Validate positive integer
 */
export function isValidPositiveInt(value: any): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Sanitize string for safe database storage
 * Removes null bytes and trims whitespace
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/\0/g, '') // Remove null bytes
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * Sanitize shop domain
 */
export function sanitizeShopDomain(shop: string | null | undefined): string | null {
  if (!shop) return null;
  
  const sanitized = sanitizeString(shop).toLowerCase();
  
  // Add .myshopify.com if not present
  if (!sanitized.includes('.myshopify.com')) {
    return `${sanitized}.myshopify.com`;
  }
  
  return isValidShopDomain(sanitized) ? sanitized : null;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize object keys (prevent prototype pollution)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  
  const sanitized = {} as T;
  for (const key of Object.keys(obj)) {
    if (!dangerous.includes(key)) {
      sanitized[key as keyof T] = obj[key];
    }
  }
  
  return sanitized;
}

// ============================================
// REQUEST VALIDATION MIDDLEWARE HELPERS
// ============================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Create validation error response
 */
export function validationErrorResponse(message: string, details?: any) {
  return new Response(
    JSON.stringify({
      error: 'validation_error',
      message,
      details,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(
    JSON.stringify({
      error: 'unauthorized',
      message,
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Get security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Apply security headers to response
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders();
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}
