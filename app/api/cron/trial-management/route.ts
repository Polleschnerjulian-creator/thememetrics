export const dynamic = 'force-dynamic';

/**
 * Trial Management Cron Job
 *
 * Runs daily to:
 * 1. Send trial ending reminders (3 days, 1 day before)
 * 2. Downgrade expired trials to free plan
 *
 * Setup: Add to vercel.json or call via external cron service
 * GET /api/cron/trial-management?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, lt, gt, isNotNull } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/resend';
import { captureError, captureMessage } from '@/lib/monitoring';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === process.env.CRON_SECRET;
}

// Trial reminder email template
function trialEndingEmail(storeName: string, daysLeft: number, dashboardUrl: string): string {
  const urgency = daysLeft === 1 ? 'morgen' : `in ${daysLeft} Tagen`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Deine Trial endet ${urgency}</h1>
        </div>

        <p>Hi ${storeName},</p>

        <p>Deine kostenlose ThemeMetrics Trial endet ${urgency}. Danach wirst du automatisch auf den kostenlosen Plan umgestellt.</p>

        <p><strong>Was du verlierst:</strong></p>
        <ul>
          <li>Unbegrenzte Theme-Analysen</li>
          <li>Desktop Performance Tests</li>
          <li>Detaillierte Empfehlungen</li>
          <li>PDF Reports</li>
        </ul>

        <p>Upgrade jetzt und behalte alle Features:</p>

        <p style="text-align: center;">
          <a href="${dashboardUrl}/pricing" class="cta">Jetzt upgraden</a>
        </p>

        <p>Oder <a href="${dashboardUrl}">schau dir deine aktuellen Analyse-Ergebnisse an</a>.</p>

        <div class="footer">
          <p>Du erhältst diese E-Mail, weil du ThemeMetrics für ${storeName} nutzt.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Trial expired email template
function trialExpiredEmail(storeName: string, dashboardUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Deine Trial ist abgelaufen</h1>
        </div>

        <p>Hi ${storeName},</p>

        <p>Deine kostenlose ThemeMetrics Trial ist abgelaufen. Du bist jetzt auf dem kostenlosen Plan.</p>

        <p><strong>Du kannst weiterhin:</strong></p>
        <ul>
          <li>1 Theme-Analyse pro Monat</li>
          <li>Mobile Performance Tests</li>
          <li>Top 3 Empfehlungen</li>
        </ul>

        <p>Upgrade jederzeit für unbegrenzten Zugang:</p>

        <p style="text-align: center;">
          <a href="${dashboardUrl}/pricing" class="cta">Pläne ansehen</a>
        </p>

        <div class="footer">
          <p>Du erhältst diese E-Mail, weil du ThemeMetrics für ${storeName} nutzt.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thememetrics.de';
  const now = new Date();
  const results = {
    reminders3Days: 0,
    reminders1Day: 0,
    expired: 0,
    errors: 0,
  };

  try {
    // 1. Find trials ending in 3 days (send reminder)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const trialsEnding3Days = await db.query.subscriptions.findMany({
      where: and(
        isNotNull(schema.subscriptions.trialEndsAt),
        gt(schema.subscriptions.trialEndsAt, threeDaysStart),
        lt(schema.subscriptions.trialEndsAt, threeDaysEnd),
        eq(schema.subscriptions.status, 'active')
      ),
    });

    for (const sub of trialsEnding3Days) {
      try {
        const store = await db.query.stores.findFirst({
          where: eq(schema.stores.id, sub.storeId),
        });

        if (store) {
          const emailSub = await db.query.emailSubscriptions.findFirst({
            where: eq(schema.emailSubscriptions.storeId, store.id),
          });

          if (emailSub?.email) {
            const storeName = store.shopDomain.replace('.myshopify.com', '');
            const dashboardUrl = `${appUrl}/dashboard?shop=${store.shopDomain}`;

            await sendEmail({
              to: emailSub.email,
              subject: `⏰ Deine ThemeMetrics Trial endet in 3 Tagen`,
              html: trialEndingEmail(storeName, 3, dashboardUrl),
            });

            results.reminders3Days++;
          }
        }
      } catch (err) {
        results.errors++;
        captureError(err as Error, { tags: { cron: 'trial-management', action: 'reminder3days' } });
      }
    }

    // 2. Find trials ending tomorrow (send urgent reminder)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const oneDayStart = new Date(oneDayFromNow);
    oneDayStart.setHours(0, 0, 0, 0);
    const oneDayEnd = new Date(oneDayFromNow);
    oneDayEnd.setHours(23, 59, 59, 999);

    const trialsEnding1Day = await db.query.subscriptions.findMany({
      where: and(
        isNotNull(schema.subscriptions.trialEndsAt),
        gt(schema.subscriptions.trialEndsAt, oneDayStart),
        lt(schema.subscriptions.trialEndsAt, oneDayEnd),
        eq(schema.subscriptions.status, 'active')
      ),
    });

    for (const sub of trialsEnding1Day) {
      try {
        const store = await db.query.stores.findFirst({
          where: eq(schema.stores.id, sub.storeId),
        });

        if (store) {
          const emailSub = await db.query.emailSubscriptions.findFirst({
            where: eq(schema.emailSubscriptions.storeId, store.id),
          });

          if (emailSub?.email) {
            const storeName = store.shopDomain.replace('.myshopify.com', '');
            const dashboardUrl = `${appUrl}/dashboard?shop=${store.shopDomain}`;

            await sendEmail({
              to: emailSub.email,
              subject: `🚨 Letzte Chance: Deine Trial endet morgen!`,
              html: trialEndingEmail(storeName, 1, dashboardUrl),
            });

            results.reminders1Day++;
          }
        }
      } catch (err) {
        results.errors++;
        captureError(err as Error, { tags: { cron: 'trial-management', action: 'reminder1day' } });
      }
    }

    // 3. Find expired trials and downgrade to free
    const expiredTrials = await db.query.subscriptions.findMany({
      where: and(
        isNotNull(schema.subscriptions.trialEndsAt),
        lt(schema.subscriptions.trialEndsAt, now),
        eq(schema.subscriptions.status, 'active'),
        // Only downgrade if not on free plan already
        // (they might have upgraded during trial)
      ),
    });

    for (const sub of expiredTrials) {
      try {
        // Check if they have an active Shopify charge (upgraded during trial)
        if (sub.shopifyChargeId) {
          // They upgraded - clear trial date but keep plan
          await db.update(schema.subscriptions)
            .set({ trialEndsAt: null })
            .where(eq(schema.subscriptions.id, sub.id));
          continue;
        }

        // No charge = downgrade to free
        await db.update(schema.subscriptions)
          .set({
            plan: 'free',
            trialEndsAt: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.id, sub.id));

        await db.update(schema.stores)
          .set({
            plan: 'free',
            updatedAt: new Date(),
          })
          .where(eq(schema.stores.id, sub.storeId));

        // Send expired email
        const store = await db.query.stores.findFirst({
          where: eq(schema.stores.id, sub.storeId),
        });

        if (store) {
          const emailSub = await db.query.emailSubscriptions.findFirst({
            where: eq(schema.emailSubscriptions.storeId, store.id),
          });

          if (emailSub?.email) {
            const storeName = store.shopDomain.replace('.myshopify.com', '');
            const dashboardUrl = `${appUrl}/dashboard?shop=${store.shopDomain}`;

            await sendEmail({
              to: emailSub.email,
              subject: `Deine ThemeMetrics Trial ist abgelaufen`,
              html: trialExpiredEmail(storeName, dashboardUrl),
            });
          }
        }

        results.expired++;
      } catch (err) {
        results.errors++;
        captureError(err as Error, { tags: { cron: 'trial-management', action: 'expire' } });
      }
    }

    captureMessage('Trial management cron completed', {
      tags: { cron: 'trial-management' },
      extra: results,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    captureError(error as Error, { tags: { cron: 'trial-management' } });
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
