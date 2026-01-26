import { jwtVerify, importSPKI } from 'jose';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

interface SessionTokenPayload {
  iss: string; // Issuer - the shop's admin URL
  dest: string; // Destination - the shop's domain
  aud: string; // Audience - the API key
  sub: string; // Subject - the user ID
  exp: number; // Expiration
  nbf: number; // Not before
  iat: number; // Issued at
  jti: string; // JWT ID
  sid: string; // Session ID
}

/**
 * Verify a Shopify session token
 * Session tokens are JWTs signed with your app's API secret
 */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    // Shopify session tokens are signed with HMAC SHA-256
    const secret = new TextEncoder().encode(SHOPIFY_API_SECRET);
    
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      audience: process.env.SHOPIFY_API_KEY,
    });

    return payload as unknown as SessionTokenPayload;
  } catch (error) {
    console.error('Session token verification failed:', error);
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
