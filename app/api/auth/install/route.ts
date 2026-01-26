export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl, generateState, isValidShopDomain } from '@/lib/shopify';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const host = searchParams.get('host'); // Get host for embedded apps
  
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }
  
  let shopDomain = shop.toLowerCase().trim();
  if (!shopDomain.includes('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }
  
  if (!isValidShopDomain(shopDomain)) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }
  
  const state = generateState();
  const cookieStore = await cookies();
  
  cookieStore.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  
  cookieStore.set('shopify_shop', shopDomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  // Store host for embedded apps
  if (host) {
    cookieStore.set('shopify_host', host, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback`;
  const authUrl = generateAuthUrl(shopDomain, redirectUri, state);
  
  return NextResponse.redirect(authUrl);
}
