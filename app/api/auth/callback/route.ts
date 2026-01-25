export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, isValidShopDomain } from '@/lib/shopify';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createEmailSubscription } from '@/lib/email';
import { sendEmail } from '@/lib/email/resend';
import { welcomeEmail } from '@/lib/email/templates';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const shop = searchParams.get('shop');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!code || !state || !shop) {
    return NextResponse.redirect(`${appUrl}/?error=missing_params`);
  }
  
  if (!isValidShopDomain(shop)) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_shop`);
  }
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get('shopify_oauth_state')?.value;
  const storedShop = cookieStore.get('shopify_shop')?.value;
  
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }
  
  if (!storedShop || shop !== storedShop) {
    return NextResponse.redirect(`${appUrl}/?error=shop_mismatch`);
  }
  
  try {
    const { accessToken } = await exchangeCodeForToken(shop, code);
    
    const existingStore = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });
    
    let storeId: number;
    let isNewInstall = false;

    if (existingStore) {
      await db.update(schema.stores).set({
        accessToken,
        updatedAt: new Date(),
      }).where(eq(schema.stores.id, existingStore.id));
      storeId = existingStore.id;
    } else {
      const [newStore] = await db.insert(schema.stores).values({
        shopDomain: shop,
        accessToken,
        plan: 'starter',
        status: 'active',
        installedAt: new Date(),
      }).returning();
      storeId = newStore.id;
      isNewInstall = true;

      await db.insert(schema.subscriptions).values({
        storeId,
        plan: 'starter',
        status: 'active',
      });
    }

    // Send welcome email for new installs
    if (isNewInstall) {
      try {
        // Fetch shop email from Shopify
        const shopDataResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        });
        
        if (shopDataResponse.ok) {
          const shopData = await shopDataResponse.json();
          const shopEmail = shopData.shop?.email;
          const shopName = shopData.shop?.name || shop.replace('.myshopify.com', '');
          
          if (shopEmail) {
            // Create email subscription
            await createEmailSubscription(shopEmail, storeId, 'user');
            
            // Send welcome email
            const dashboardUrl = `${appUrl}/dashboard?shop=${shop}`;
            const html = welcomeEmail({ storeName: shopName, dashboardUrl });
            
            await sendEmail({
              to: shopEmail,
              subject: `Willkommen bei ThemeMetrics, ${shopName}! 🎉`,
              html,
            });
          }
        }
      } catch (emailError) {
        // Don't fail the whole auth if email fails
        console.error('Failed to send welcome email:', emailError);
      }
    }
    
    cookieStore.delete('shopify_oauth_state');
    cookieStore.delete('shopify_shop');
    cookieStore.set('shop_session', shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return NextResponse.redirect(`${appUrl}/dashboard?shop=${shop}&installed=${isNewInstall}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }
}
