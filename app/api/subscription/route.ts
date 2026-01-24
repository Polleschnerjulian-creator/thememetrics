export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { PLANS, PlanId } from '@/lib/billing';

// Get current month in format '2026-01'
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shop),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, store.id),
    });

    const currentPlan = (subscription?.plan || 'free') as PlanId;
    const planDetails = PLANS[currentPlan];

    // Get or create usage tracking for current month
    const currentMonth = getCurrentMonth();
    let usage = await db.query.usageTracking.findFirst({
      where: and(
        eq(schema.usageTracking.storeId, store.id),
        eq(schema.usageTracking.month, currentMonth)
      ),
    });

    // If no usage record exists, create one
    if (!usage) {
      const [newUsage] = await db.insert(schema.usageTracking)
        .values({
          storeId: store.id,
          month: currentMonth,
          themeAnalysesCount: 0,
          performanceTestsCount: 0,
          pdfReportsCount: 0,
        })
        .returning();
      usage = newUsage;
    }

    // Calculate remaining usage
    const limits = planDetails.features;
    const themeAnalysesLimit = limits.themeAnalysisPerMonth;
    const performanceTestsLimit = limits.performanceTestsPerMonth;

    const themeAnalysesRemaining = themeAnalysesLimit === -1 
      ? -1 
      : Math.max(0, themeAnalysesLimit - (usage?.themeAnalysesCount || 0));
    
    const performanceTestsRemaining = performanceTestsLimit === -1 
      ? -1 
      : Math.max(0, performanceTestsLimit - (usage?.performanceTestsCount || 0));

    return NextResponse.json({
      plan: currentPlan,
      planName: planDetails.name,
      status: subscription?.status || 'active',
      features: planDetails.features,
      usage: {
        month: currentMonth,
        themeAnalyses: {
          used: usage?.themeAnalysesCount || 0,
          limit: themeAnalysesLimit,
          remaining: themeAnalysesRemaining,
        },
        performanceTests: {
          used: usage?.performanceTestsCount || 0,
          limit: performanceTestsLimit,
          remaining: performanceTestsRemaining,
        },
        pdfReports: {
          used: usage?.pdfReportsCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
