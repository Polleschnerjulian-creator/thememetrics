export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSubscriptionStatus } from '@/lib/billing';
import { captureError } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

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

    // With Shopify GraphQL Billing API, the subscription is automatically
    // activated once the merchant approves at the confirmationUrl.
    // We just need to verify the active subscription and sync our DB.
    const status = await getSubscriptionStatus(store.shopDomain, store.accessToken);

    if (status.active && status.plan !== 'free') {
      const currentPeriodEnd = status.currentPeriodEnd
        ? new Date(status.currentPeriodEnd)
        : null;

      await db
        .update(schema.subscriptions)
        .set({
          status: 'active',
          plan: status.plan,
          currentPeriodEnd,
        })
        .where(eq(schema.subscriptions.storeId, store.id));

      await db
        .update(schema.stores)
        .set({ plan: status.plan })
        .where(eq(schema.stores.id, store.id));

      return NextResponse.redirect(`${appUrl}/dashboard?billing=success`);
    }

    // Merchant declined or subscription not yet active
    return NextResponse.redirect(`${appUrl}/dashboard?billing=cancelled`);
  } catch (error) {
    captureError(error, { context: 'Billing callback error' });
    return NextResponse.redirect(`${appUrl}/dashboard?error=billing_failed`);
  }
}
