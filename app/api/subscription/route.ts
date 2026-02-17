export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { PLANS, PlanId } from '@/lib/billing';
import { authenticateRequest, withCors } from '@/lib/auth';

// Get current month in format '2026-01'
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Calculate days remaining in trial or billing period
function getDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Get upgrade suggestion based on usage
function getUpgradeSuggestion(
  planId: PlanId,
  usagePercent: number
): { suggest: boolean; reason?: string; suggestedPlan?: PlanId } {
  if (planId === 'agency') return { suggest: false };

  if (usagePercent >= 90) {
    const nextPlan = planId === 'free' ? 'starter' : planId === 'starter' ? 'pro' : 'agency';
    return {
      suggest: true,
      reason: 'Du hast fast dein monatliches Limit erreicht',
      suggestedPlan: nextPlan,
    };
  }

  if (usagePercent >= 70) {
    return {
      suggest: false,
      reason: `${Math.round(usagePercent)}% deines Limits verwendet`,
    };
  }

  return { suggest: false };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store } = authResult;

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

    const themeAnalysesUsed = usage?.themeAnalysesCount || 0;
    const performanceTestsUsed = usage?.performanceTestsCount || 0;

    const themeAnalysesRemaining = themeAnalysesLimit === -1
      ? -1
      : Math.max(0, themeAnalysesLimit - themeAnalysesUsed);

    const performanceTestsRemaining = performanceTestsLimit === -1
      ? -1
      : Math.max(0, performanceTestsLimit - performanceTestsUsed);

    // Calculate usage percentages
    const themeAnalysesPercent = themeAnalysesLimit === -1
      ? 0
      : Math.round((themeAnalysesUsed / themeAnalysesLimit) * 100);

    const performanceTestsPercent = performanceTestsLimit === -1
      ? 0
      : Math.round((performanceTestsUsed / performanceTestsLimit) * 100);

    // Overall usage percent (average of limited resources)
    const overallUsagePercent = Math.max(themeAnalysesPercent, performanceTestsPercent);

    // Billing period information
    const periodEndsAt = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const daysLeftInPeriod = getDaysRemaining(periodEndsAt);

    // Upgrade suggestion
    const upgradeSuggestion = getUpgradeSuggestion(currentPlan, overallUsagePercent);

    return NextResponse.json({
      plan: currentPlan,
      planName: planDetails.name,
      status: subscription?.status || 'active',
      features: planDetails.features,

      // Billing period
      billingPeriod: periodEndsAt ? {
        endsAt: periodEndsAt.toISOString(),
        daysLeft: daysLeftInPeriod,
      } : null,

      // Usage with percentages
      usage: {
        month: currentMonth,
        overallPercent: overallUsagePercent,
        themeAnalyses: {
          used: themeAnalysesUsed,
          limit: themeAnalysesLimit,
          remaining: themeAnalysesRemaining,
          percent: themeAnalysesPercent,
        },
        performanceTests: {
          used: performanceTestsUsed,
          limit: performanceTestsLimit,
          remaining: performanceTestsRemaining,
          percent: performanceTestsPercent,
        },
        pdfReports: {
          used: usage?.pdfReportsCount || 0,
        },
      },

      // Upgrade suggestion
      upgrade: upgradeSuggestion,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

export { OPTIONS } from '@/lib/auth';
