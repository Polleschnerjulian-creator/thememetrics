export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, isValidShopDomain } from '@/lib/shopify';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createEmailSubscription } from '@/lib/email';
import { sendEmail } from '@/lib/email/resend';
import { welcomeEmail } from '@/lib/email/templates';
import { captureError, captureMessage } from '@/lib/monitoring';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const shop = searchParams.get('shop');
  const hostFromQuery = searchParams.get('host');

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
  const storedHost = cookieStore.get('shopify_host')?.value;
  const host = hostFromQuery || storedHost;

  // Validate OAuth state to prevent CSRF attacks
  if (!storedState || state !== storedState) {
    captureError(new Error('OAuth state mismatch - possible CSRF attack'), {
      tags: { route: 'auth/callback', shop },
      extra: { hasStoredState: !!storedState, stateMatch: storedState === state }
    });
    return NextResponse.redirect(`${appUrl}/?error=state_mismatch`);
  }

  if (storedShop && shop !== storedShop) {
    return NextResponse.redirect(`${appUrl}/?error=shop_mismatch`);
  }

  try {
    const { accessToken } = await exchangeCodeForToken(shop, code);

    if (!accessToken) {
      captureError(new Error(`No access token received for ${shop}`), { tags: { route: 'auth/callback' } });
      return NextResponse.redirect(`${appUrl}/?error=no_token`);
    }

    // Encrypt access token before storing in database
    const encryptedToken = encrypt(accessToken);

    const existingStore = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });

    let storeId: number;
    let isNewInstall = false;

    if (existingStore) {
      try {
        await db.update(schema.stores).set({
          accessToken: encryptedToken,
          status: 'active',
          updatedAt: new Date(),
        }).where(eq(schema.stores.id, existingStore.id));
        storeId = existingStore.id;
      } catch (dbUpdateError) {
        captureError(dbUpdateError as Error, { tags: { route: 'auth/callback', action: 'updateStore', shop } });
        return NextResponse.redirect(`${appUrl}/?error=db_update_failed`);
      }
    } else {
      try {
        const [newStore] = await db.insert(schema.stores).values({
          shopDomain: shop,
          accessToken: encryptedToken,
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

        captureMessage(`New store installed: ${shop}`, { tags: { shop, storeId: String(storeId) } });
      } catch (dbInsertError) {
        captureError(dbInsertError as Error, { tags: { route: 'auth/callback', action: 'createStore', shop } });
        return NextResponse.redirect(`${appUrl}/?error=db_insert_failed`);
      }
    }

    // Send welcome email for new installs (non-blocking)
    if (isNewInstall) {
      (async () => {
        try {
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
              try {
                await createEmailSubscription(shopEmail, storeId, 'user');
              } catch {
                // Ignore - table might not exist
              }

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
          captureError(emailError as Error, { tags: { route: 'auth/callback', action: 'sendWelcomeEmail' } });
        }
      })();
    }

    cookieStore.delete('shopify_oauth_state');
    cookieStore.delete('shopify_shop');
    cookieStore.delete('shopify_host');

    // Sign the session cookie with HMAC to prevent tampering
    const crypto = require('crypto');
    const sessionSecret = process.env.SESSION_SECRET || '';
    const signature = crypto.createHmac('sha256', sessionSecret).update(shop).digest('hex');
    const signedValue = `${shop}.${signature}`;

    cookieStore.set('shop_session', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (reduced from 7 days)
      path: '/',
    });

    const redirectParams = new URLSearchParams();
    redirectParams.set('shop', shop);
    if (host) {
      redirectParams.set('host', host);
    }
    if (isNewInstall) {
      redirectParams.set('installed', 'true');
    }

    return NextResponse.redirect(`${appUrl}/dashboard?${redirectParams.toString()}`);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'auth/callback', shop } });
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }
}
