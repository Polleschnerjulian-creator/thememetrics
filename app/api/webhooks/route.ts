export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyShopifyWebhook } from '@/lib/security';
import { captureError, captureMessage, captureWarning } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    // Verify HMAC signature
    if (!verifyShopifyWebhook(rawBody, hmac)) {
      captureWarning('Invalid webhook HMAC', { tags: { shop: shop || 'unknown', topic: topic || 'unknown' } });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    captureMessage(`Webhook received: ${topic}`, { tags: { shop: shop || 'unknown' } });

    if (topic === 'app/uninstalled' && shop) {
      // Mark store as uninstalled and invalidate token
      // Token is set to empty string (auth.ts validates this and returns proper error)
      // On reinstall, callback route will update token AND reset status to 'active'
      try {
        await db.update(schema.stores).set({
          status: 'uninstalled',
          accessToken: '',
          updatedAt: new Date(),
        }).where(eq(schema.stores.shopDomain, shop));

        captureMessage(`App uninstalled: ${shop}`, { tags: { shop } });
      } catch (dbError) {
        captureError(dbError as Error, { tags: { route: 'webhooks', action: 'uninstall', shop } });
      }
    }

    // Handle subscription changes (cancel, upgrade, downgrade from Shopify admin)
    if (topic === 'app_subscriptions/update' && shop) {
      try {
        const payload = JSON.parse(rawBody);
        const status = payload.app_subscription?.status;

        const store = await db.query.stores.findFirst({
          where: eq(schema.stores.shopDomain, shop),
        });

        if (store) {
          if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'DECLINED') {
            // Subscription cancelled - downgrade to free
            await db.update(schema.subscriptions).set({
              plan: 'free',
              status: 'cancelled',
              updatedAt: new Date(),
            }).where(eq(schema.subscriptions.storeId, store.id));

            await db.update(schema.stores).set({
              plan: 'free',
              updatedAt: new Date(),
            }).where(eq(schema.stores.id, store.id));

            captureMessage(`Subscription cancelled: ${shop}`, { tags: { shop, status } });
          } else if (status === 'ACTIVE') {
            // Subscription activated/reactivated
            await db.update(schema.subscriptions).set({
              status: 'active',
              updatedAt: new Date(),
            }).where(eq(schema.subscriptions.storeId, store.id));

            captureMessage(`Subscription activated: ${shop}`, { tags: { shop } });
          }
        }
      } catch (dbError) {
        captureError(dbError as Error, { tags: { route: 'webhooks', action: 'subscription_update', shop } });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'webhooks' } });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
