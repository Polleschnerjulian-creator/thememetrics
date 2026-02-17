import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailSubscriptions, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateEmailPreferences, createEmailSubscription } from '@/lib/email';
import { captureError } from '@/lib/monitoring';
import { authenticateRequest, withCors } from '@/lib/auth';

// GET - Get current preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

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
    captureError(error as Error, { tags: { route: 'emails/preferences', action: 'GET' } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update preferences
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

    const body = await request.json();
    const { email, preferences } = body;

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
    captureError(error as Error, { tags: { route: 'emails/preferences', action: 'POST' } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { OPTIONS } from '@/lib/auth';
