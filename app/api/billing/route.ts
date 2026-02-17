export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createSubscription, PLANS, PlanId } from '@/lib/billing';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const body = await request.json();
    const planId = body.plan as PlanId;
    
    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/api/billing/callback?shop=${store.shopDomain}`;
    
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
