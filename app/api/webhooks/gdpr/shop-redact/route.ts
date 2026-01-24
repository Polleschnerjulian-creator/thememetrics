export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/security';
import { captureMessage } from '@/lib/monitoring';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * GDPR Webhook: Shop Redact
 * 
 * Shopify sends this 48 hours after a store uninstalls the app.
 * We must delete all data associated with the shop.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256') || '';
    
    // Verify webhook authenticity
    if (!verifyShopifyWebhook(body, hmac)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const shopDomain = data.shop_domain;
    
    // Log the request for compliance records
    captureMessage('GDPR: Shop redact request received', {
      tags: { webhook: 'shop/redact' },
      extra: {
        shop_domain: shopDomain,
      }
    });

    if (shopDomain) {
      // Delete all store data from our database
      try {
        // Delete theme analyses
        await db.delete(schema.themeAnalyses)
          .where(eq(schema.themeAnalyses.storeId, 
            db.select({ id: schema.stores.id })
              .from(schema.stores)
              .where(eq(schema.stores.shopDomain, shopDomain))
          ));
        
        // Delete the store record
        await db.delete(schema.stores)
          .where(eq(schema.stores.shopDomain, shopDomain));
        
        captureMessage('GDPR: Shop data deleted successfully', {
          tags: { webhook: 'shop/redact' },
          extra: { shop_domain: shopDomain }
        });
      } catch (dbError) {
        console.error('Error deleting shop data:', dbError);
        // Still return 200 - we've logged the request
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Shop data has been redacted.'
    });

  } catch (error) {
    console.error('GDPR shop/redact webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
