import * as crypto from 'crypto';

interface SessionTokenPayload {
  iss: string; // Issuer - the shop's admin URL
  dest: string; // Destination - the shop's domain
  aud: string; // Audience - the API key (client ID)
  sub: string; // Subject - the user ID
  exp: number; // Expiration
  nbf: number; // Not before
  iat: number; // Issued at
  jti: string; // JWT ID
  sid: string; // Session ID
}

/**
 * Decode base64url to string
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters and add padding
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64').toString('utf-8');
}

/**
 * Verify a Shopify session token
 * Session tokens are JWTs signed with HMAC SHA-256 using your app's API secret
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) { console.error('[TOKEN] No SHOPIFY_API_SECRET'); return null; }

    const parts = token.split('.');
    if (parts.length !== 3) { console.error('[TOKEN] Not 3 parts:', parts.length); return null; }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload first for debugging
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as SessionTokenPayload;
    console.log('[TOKEN] Payload: iss=' + payload.iss + ' dest=' + payload.dest + ' aud=' + payload.aud + ' exp=' + payload.exp);

    // Verify signature using HMAC SHA-256
    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    // Timing-safe comparison
    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) {
      console.error('[TOKEN] Sig length mismatch: got=' + sigBuf.length + ' expected=' + expBuf.length);
      console.error('[TOKEN] Got sig=' + signatureB64.substring(0, 20) + ' expected=' + expectedSignature.substring(0, 20));
      return null;
    }
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error('[TOKEN] Sig mismatch (same length). Secret prefix=' + secret.substring(0, 10));
      return null;
    }

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) { console.error('[TOKEN] Expired: exp=' + payload.exp + ' now=' + now); return null; }

    // Verify not before
    if (payload.nbf > now) { console.error('[TOKEN] Not yet valid: nbf=' + payload.nbf + ' now=' + now); return null; }

    // Verify audience (should match our API key)
    const expectedAudience = process.env.SHOPIFY_API_KEY;
    if (expectedAudience && payload.aud !== expectedAudience) {
      console.error('[TOKEN] Audience mismatch: got=' + payload.aud + ' expected=' + expectedAudience);
      return null;
    }

    console.log('[TOKEN] Verified OK for ' + payload.dest);
    return payload;
  } catch (error) {
    console.error('[TOKEN] Exception:', (error as Error).message);
    return null;
  }
}

/**
 * Extract shop domain from session token
 */
export function getShopFromToken(payload: SessionTokenPayload): string {
  // The dest claim contains the shop URL like https://shop.myshopify.com
  const dest = payload.dest;
  return dest.replace('https://', '').replace('http://', '');
}

/**
 * Check if session token is expired
 */
export function isTokenExpired(payload: SessionTokenPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Middleware helper to get session token from request
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Verify request and extract shop domain
 * Returns shop domain if valid, null otherwise
 */
export function verifyRequestAndGetShop(request: Request): string | null {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return getShopFromToken(payload);
}
