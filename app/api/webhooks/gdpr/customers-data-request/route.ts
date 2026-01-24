export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/security';
import { captureMessage } from '@/lib/monitoring';

/**
 * GDPR Webhook: Customer Data Request
 * 
 * Shopify sends this when a customer requests their data.
 * Since ThemeMetrics does NOT store any customer data, we simply acknowledge the request.
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
    
    // Log the request for compliance records
    captureMessage('GDPR: Customer data request received', {
      tags: { webhook: 'customers/data_request' },
      extra: {
        shop_domain: data.shop_domain,
        orders_requested: data.orders_requested?.length || 0,
      }
    });

    // ThemeMetrics does NOT store any customer data.
    // We only store shop-level data (domain, theme analysis results).
    // Therefore, there is no customer data to return.
    
    return NextResponse.json({ 
      success: true,
      message: 'ThemeMetrics does not store customer data. No data to report.'
    });

  } catch (error) {
    console.error('GDPR customers/data_request webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
