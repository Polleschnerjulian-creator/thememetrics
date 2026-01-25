import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailSubscriptions, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateEmailPreferences, createEmailSubscription } from '@/lib/email';

// GET - Get current preferences
export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json(
      { error: 'Shop parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.shopDomain, shop));

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.storeId, store.id));

    if (!subscription) {
      return NextResponse.json({
        preferences: {
          weeklyReports: true,
          scoreAlerts: true,
          productUpdates: true,
        },
        hasSubscription: false,
      });
    }

    return NextResponse.json({
      preferences: {
        weeklyReports: subscription.weeklyReports,
        scoreAlerts: subscription.scoreAlerts,
        productUpdates: subscription.productUpdates,
      },
      hasSubscription: true,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, email, preferences } = body;

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop is required' },
        { status: 400 }
      );
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.shopDomain, shop));

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if subscription exists
    const [existingSubscription] = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.storeId, store.id));

    if (!existingSubscription && email) {
      // Create new subscription
      await createEmailSubscription(email, store.id, 'user');
    }

    if (existingSubscription && preferences) {
      // Update existing subscription
      await updateEmailPreferences(existingSubscription.email, preferences);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
