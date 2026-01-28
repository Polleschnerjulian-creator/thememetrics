export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createSubscription, PLANS, PlanId } from '@/lib/billing';
import { captureError } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const planId = body.plan as PlanId;
    
    // Get shop from body (embedded app) or cookie (standalone)
    const cookieStore = await cookies();
    const shopSession = body.shop || cookieStore.get('shop_session')?.value;
    
    if (!shopSession) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shopSession),
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shopSession}`;
    
    // Free plan doesn't need Shopify billing
    if (planId === 'free') {
      await db.update(schema.subscriptions)
        .set({ 
          plan: 'free',
          status: 'active',
        })
        .where(eq(schema.subscriptions.storeId, store.id));
      
      return NextResponse.json({ success: true, plan: 'free' });
    }

    const result = await createSubscription(
      store.shopDomain,
      store.accessToken,
      planId,
      returnUrl
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const { confirmationUrl, chargeId } = result;
    
    // Store the pending charge ID
    await db.update(schema.subscriptions)
      .set({ 
        plan: planId,
        status: 'pending',
      })
      .where(eq(schema.subscriptions.storeId, store.id));
    
    return NextResponse.json({ confirmationUrl, chargeId });
  } catch (error) {
    captureError(error, { context: 'Billing error' });
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// GET: Return available plans
export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
