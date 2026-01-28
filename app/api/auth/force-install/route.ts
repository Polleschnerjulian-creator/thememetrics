export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// TEMPORARY DEBUG ENDPOINT - Remove after fixing!
// This creates a store directly without OAuth for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const secret = searchParams.get('secret');

  // Basic protection
  if (secret !== 'thememetrics2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!shop) {
    return NextResponse.json({ error: 'Shop required' }, { status: 400 });
  }

  try {
    // Check if store exists
    const existing = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });

    if (existing) {
      return NextResponse.json({
        message: 'Store already exists',
        store: {
          id: existing.id,
          shop: existing.shopDomain,
          status: existing.status,
          hasToken: !!existing.accessToken,
        }
      });
    }

    // Create store with placeholder token (will need OAuth to get real token)
    const [newStore] = await db.insert(schema.stores).values({
      shopDomain: shop,
      accessToken: 'NEEDS_OAUTH_TOKEN',
      plan: 'pro',
      status: 'pending_oauth',
      installedAt: new Date(),
    }).returning();

    // Create subscription
    await db.insert(schema.subscriptions).values({
      storeId: newStore.id,
      plan: 'pro',
      status: 'active',
    });

    return NextResponse.json({
      message: 'Store created - needs OAuth to complete',
      store: {
        id: newStore.id,
        shop: newStore.shopDomain,
      },
      nextStep: `Go to Partner Dashboard and click "Test app" to complete OAuth`
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
