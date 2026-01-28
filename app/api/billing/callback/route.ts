export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { activateSubscription, getSubscriptionStatus } from '@/lib/billing';
import { captureError } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const chargeId = searchParams.get('charge_id');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!shop) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_shop`);
  }
  
  try {
    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });
    
    if (!store) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=store_not_found`);
    }
    
    if (chargeId) {
      // Activate the subscription
      const activated = await activateSubscription(
        store.shopDomain,
        store.accessToken,
        parseInt(chargeId)
      );
      
      if (activated) {
        // Get subscription details
        const status = await getSubscriptionStatus(store.shopDomain, store.accessToken);
        
        // Update database
        await db.update(schema.subscriptions)
          .set({
            status: 'active',
            plan: status.plan || 'starter',
          })
          .where(eq(schema.subscriptions.storeId, store.id));
        
        await db.update(schema.stores)
          .set({ plan: status.plan || 'starter' })
          .where(eq(schema.stores.id, store.id));
        
        return NextResponse.redirect(`${appUrl}/dashboard?billing=success`);
      }
    }
    
    // Check if user declined
    return NextResponse.redirect(`${appUrl}/dashboard?billing=cancelled`);
  } catch (error) {
    captureError(error, { context: 'Billing callback error' });
    return NextResponse.redirect(`${appUrl}/dashboard?error=billing_failed`);
  }
}
