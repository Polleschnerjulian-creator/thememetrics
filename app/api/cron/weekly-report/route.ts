import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailSubscriptions, stores, themeAnalyses, performanceSnapshots } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/resend';
import { weeklyReportEmail } from '@/lib/email/templates';
import { captureError } from '@/lib/monitoring';
import { timingSafeEqual } from 'crypto';

// Vercel Cron: runs every Monday at 9:00 AM UTC
export const dynamic = 'force-dynamic';

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret with timing-safe comparison
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Get all active subscriptions with weekly reports enabled
    const subscriptions = await db
      .select({
        id: emailSubscriptions.id,
        email: emailSubscriptions.email,
        storeId: emailSubscriptions.storeId,
      })
      .from(emailSubscriptions)
      .where(
        and(
          eq(emailSubscriptions.status, 'active'),
          eq(emailSubscriptions.weeklyReports, true)
        )
      );

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      if (!subscription.storeId) continue;

      try {
        // Get store info
        const [store] = await db
          .select()
          .from(stores)
          .where(eq(stores.id, subscription.storeId));

        if (!store) continue;

        const storeName = store.shopDomain.replace('.myshopify.com', '');
        const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

        // Get latest analysis
        const [latestAnalysis] = await db
          .select()
          .from(themeAnalyses)
          .where(eq(themeAnalyses.storeId, subscription.storeId))
          .orderBy(desc(themeAnalyses.analyzedAt))
          .limit(1);

        // Get previous week's analysis
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [previousAnalysis] = await db
          .select()
          .from(themeAnalyses)
          .where(
            and(
              eq(themeAnalyses.storeId, subscription.storeId),
              gte(themeAnalyses.analyzedAt, oneWeekAgo)
            )
          )
          .orderBy(themeAnalyses.analyzedAt)
          .limit(1);

        const currentScore = latestAnalysis?.overallScore || 0;
        const previousScore = previousAnalysis?.overallScore || currentScore;

        // Generate email
        const html = weeklyReportEmail({
          storeName,
          currentScore,
          previousScore,
          topIssue: currentScore < 70 ? 'Optimiere deine Hero-Section für bessere Ladezeiten' : undefined,
          dashboardUrl,
        });

        const scoreDiff = currentScore - previousScore;
        const trendEmoji = scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➡️';

        await sendEmail({
          to: subscription.email,
          subject: `${trendEmoji} Dein ThemeMetrics Wochenreport – Score: ${currentScore}`,
          html,
        });

        sentCount++;
      } catch (error) {
        captureError(error, { context: `Failed to send weekly report to ${subscription.email}` });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      total: subscriptions.length,
    });
  } catch (error) {
    captureError(error, { context: 'Weekly report cron error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
