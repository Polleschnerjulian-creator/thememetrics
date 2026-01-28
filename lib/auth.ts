import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifySessionToken, getShopFromToken, getSessionTokenFromRequest } from './session-token';
import { isValidShopDomain, sanitizeShopDomain } from './security';

/**
 * CORS headers for embedded Shopify apps
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Shop-Domain, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
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
      console.log(`[Auth] Session token verified for shop: ${shop}`);
    } else {
      // Invalid session token - don't fall back, this is an error
      console.error('[Auth] Invalid session token provided');
      return {
        success: false,
        error: 'Invalid session token',
        status: 401,
      };
    }
  }

  // 2. Try X-Shop-Domain header (for API calls with shop context)
  if (!shop) {
    const shopHeader = request.headers.get('X-Shop-Domain');
    if (shopHeader && isValidShopDomain(shopHeader)) {
      shop = sanitizeShopDomain(shopHeader);
      authMethod = 'header';
      console.log(`[Auth] Using X-Shop-Domain header: ${shop}`);
    }
  }

  // 3. Try cookie fallback (non-embedded context)
  if (!shop) {
    const cookieStore = await cookies();
    const shopSession = cookieStore.get('shop_session')?.value;
    
    if (shopSession && isValidShopDomain(shopSession)) {
      shop = sanitizeShopDomain(shopSession);
      authMethod = 'cookie';
      console.log(`[Auth] Using cookie session: ${shop}`);
    }
  }

  // 4. Try query parameter (last resort)
  if (!shop) {
    const url = new URL(request.url);
    const shopParam = url.searchParams.get('shop');
    
    if (shopParam && isValidShopDomain(shopParam)) {
      shop = sanitizeShopDomain(shopParam);
      authMethod = 'header';
      console.log(`[Auth] Using query parameter: ${shop}`);
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

  // Log auth method for debugging
  console.log(`[Auth] Authenticated ${sanitizedShop} via ${authMethod}`);

  return {
    success: true,
    shop: sanitizedShop,
    store,
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
    return handleOptions();
  }

  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }
  
  const response = await handler(authResult.shop, authResult.store);
  return withCors(response);
}
