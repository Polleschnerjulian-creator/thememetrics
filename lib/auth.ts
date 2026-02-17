import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifySessionToken, getShopFromToken, getSessionTokenFromRequest } from './session-token';
import { isValidShopDomain, sanitizeShopDomain } from './security';
import { getAccessToken } from './crypto';
import crypto from 'crypto';

/**
 * CORS headers for embedded Shopify apps
 * Strict validation - only exact Shopify admin or our app URL
 */
const ALLOWED_ORIGINS = [
  'https://admin.shopify.com',
  process.env.NEXT_PUBLIC_APP_URL || 'https://thememetrics.de',
];

/**
 * Validates if origin is a legitimate Shopify myshopify.com domain
 * Only allows exact pattern: https://[store-name].myshopify.com
 */
function isValidShopifyOrigin(origin: string): boolean {
  if (!origin) return false;

  // Strict regex: must be https://[alphanumeric-hyphens].myshopify.com (no subpaths)
  const shopifyPattern = /^https:\/\/[a-z0-9][a-z0-9-]*[a-z0-9]\.myshopify\.com$/i;
  return shopifyPattern.test(origin);
}

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') || '';

  // Prüfe ob Origin erlaubt ist (Shopify Admin, unsere App URL, oder valide myshopify.com Domain)
  const isAllowed = ALLOWED_ORIGINS.some(allowed => origin === allowed) ||
                    isValidShopifyOrigin(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shop-Domain, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Legacy export für Backwards-Compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://thememetrics.de',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shop-Domain, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse, request?: Request): NextResponse {
  const headers = request ? getCorsHeaders(request) : corsHeaders;
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Simple OPTIONS handler for routes that don't need dynamic CORS
 * Use this export in API routes: export { handleOptions as OPTIONS } from '@/lib/auth';
 */
export async function OPTIONS(request: Request): Promise<NextResponse> {
  return handleOptions(request);
}

/**
 * Handle OPTIONS preflight request
 * Next.js API routes require request parameter
 */
export function handleOptions(request: Request): NextResponse {
  const headers = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export type AuthResult = 
  | {
      success: true;
      shop: string;
      store: typeof schema.stores.$inferSelect;
    }
  | {
      success: false;
      error: string;
      status: number;
    };

/**
 * Authenticate a request using Session Token (preferred) or Cookie fallback
 * 
 * Shopify embedded apps MUST use session tokens for authentication.
 * This function checks:
 * 1. Authorization header with Bearer token (session token from App Bridge)
 * 2. Cookie fallback for non-embedded contexts
 * 
 * @param request - The incoming request
 * @returns AuthResult with shop and store data, or error
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  let shop: string | null = null;
  let authMethod: 'session_token' | 'cookie' | 'header' = 'cookie';

  // 1. Try Session Token from Authorization header (embedded app flow)
  const sessionToken = getSessionTokenFromRequest(request);

  if (sessionToken) {
    const payload = verifySessionToken(sessionToken);

    if (payload) {
      shop = getShopFromToken(payload);
      authMethod = 'session_token';
    }
    // Session token invalid/expired - silently continue to fallback methods
    // This can happen when tokens expire or during initial app load
  }

  // 2. Try X-Shop-Domain header (for API calls with shop context)
  if (!shop) {
    const shopHeader = request.headers.get('X-Shop-Domain');
    if (shopHeader && isValidShopDomain(shopHeader)) {
      shop = sanitizeShopDomain(shopHeader);
      authMethod = 'header';
    }
  }

  // 3. Try cookie fallback (non-embedded context) - verify HMAC signature
  if (!shop) {
    const cookieStore = await cookies();
    const shopSession = cookieStore.get('shop_session')?.value;

    if (shopSession) {
      // Support both signed (shop.signature) and legacy unsigned cookies
      const dotIndex = shopSession.lastIndexOf('.');
      if (dotIndex > 0) {
        const cookieShop = shopSession.substring(0, dotIndex);
        const cookieSignature = shopSession.substring(dotIndex + 1);
        const sessionSecret = process.env.SESSION_SECRET || '';
        const expectedSignature = crypto.createHmac('sha256', sessionSecret).update(cookieShop).digest('hex');

        if (cookieSignature === expectedSignature && isValidShopDomain(cookieShop)) {
          shop = sanitizeShopDomain(cookieShop);
          authMethod = 'cookie';
        }
      } else if (isValidShopDomain(shopSession)) {
        // Legacy unsigned cookie — still accept but log for migration
        shop = sanitizeShopDomain(shopSession);
        authMethod = 'cookie';
      }
    }
  }

  // 4. Try query parameter (fallback for embedded app initial load)
  if (!shop) {
    const url = new URL(request.url);
    const shopParam = url.searchParams.get('shop');

    if (shopParam && isValidShopDomain(shopParam)) {
      shop = sanitizeShopDomain(shopParam);
      authMethod = 'header';
    }
  }

  if (!shop) {
    return {
      success: false,
      error: 'Not authenticated',
      status: 401,
    };
  }

  // Validate shop domain format
  const sanitizedShop = sanitizeShopDomain(shop);
  if (!sanitizedShop) {
    return {
      success: false,
      error: 'Invalid shop domain',
      status: 400,
    };
  }

  // Get store from database
  const store = await db.query.stores.findFirst({
    where: eq(schema.stores.shopDomain, sanitizedShop),
  });

  if (!store) {
    return {
      success: false,
      error: 'Store not found',
      status: 404,
    };
  }

  // CRITICAL: Validate that accessToken is not empty
  if (!store.accessToken || store.accessToken.trim() === '') {
    return {
      success: false,
      error: 'Access token missing or invalid. Please reinstall the app.',
      status: 401,
    };
  }

  // Decrypt access token (supports both encrypted and legacy plaintext tokens)
  const decryptedToken = getAccessToken(store.accessToken);

  return {
    success: true,
    shop: sanitizedShop,
    store: { ...store, accessToken: decryptedToken },
  };
}

/**
 * Helper to create an error response with CORS headers
 */
export function authErrorResponse(result: Extract<AuthResult, { success: false }>): NextResponse {
  const response = NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
  return withCors(response);
}

/**
 * Wrapper for API routes that need authentication
 * Automatically handles CORS and OPTIONS requests
 * 
 * Usage:
 * ```
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (shop, store) => {
 *     // Your authenticated logic here
 *     return NextResponse.json({ data: 'success' });
 *   });
 * }
 * 
 * // Don't forget to export OPTIONS handler:
 * export { handleOptions as OPTIONS } from '@/lib/auth';
 * ```
 */
export async function withAuth(
  request: NextRequest,
  handler: (shop: string, store: typeof schema.stores.$inferSelect) => Promise<NextResponse>
): Promise<NextResponse> {
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const response = await handler(authResult.shop, authResult.store);
  return withCors(response, request);
}
