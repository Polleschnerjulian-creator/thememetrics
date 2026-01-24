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
      await db.update(schema.stores).set({
        status: 'uninstalled',
        accessToken: '',
        updatedAt: new Date(),
      }).where(eq(schema.stores.shopDomain, shop));
      
      captureMessage(`App uninstalled: ${shop}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'webhooks' } });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
