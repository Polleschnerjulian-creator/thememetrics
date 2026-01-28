export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/security';
import { captureMessage, captureError } from '@/lib/monitoring';
import { db, schema } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

/**
 * GDPR Webhook: Shop Redact
 *
 * Shopify sends this 48 hours after a store uninstalls the app.
 * We must delete ALL data associated with the shop.
 *
 * Deletion order matters due to foreign key constraints:
 * 1. Child records first (sections, snapshots, etc.)
 * 2. Parent records last (stores)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256') || '';

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(body, hmac)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const shopDomain = data.shop_domain;

    // Log the request for compliance records
    captureMessage('GDPR: Shop redact request received', {
      tags: { webhook: 'shop/redact' },
      extra: { shop_domain: shopDomain }
    });

    if (shopDomain) {
      try {
        // 1. Find the store
        const store = await db.query.stores.findFirst({
          where: eq(schema.stores.shopDomain, shopDomain),
        });

        if (!store) {
          // Store already deleted or never existed - that's OK
          return NextResponse.json({
            success: true,
            message: 'No data found for this shop.'
          });
        }

        const storeId = store.id;

        // 2. Find all themes for this store
        const themes = await db.query.themes.findMany({
          where: eq(schema.themes.storeId, storeId),
        });
        const themeIds = themes.map(t => t.id);

        // 3. Find all theme analyses
        const themeAnalyses = await db.query.themeAnalyses.findMany({
          where: eq(schema.themeAnalyses.storeId, storeId),
        });
        const analysisIds = themeAnalyses.map(a => a.id);

        // 4. Find agency if this store is an agency owner
        const agency = await db.query.agencies.findFirst({
          where: eq(schema.agencies.ownerStoreId, storeId),
        });

        // === DELETE IN CORRECT ORDER (children first) ===

        // Delete section analyses (child of theme analyses)
        if (analysisIds.length > 0) {
          await db.delete(schema.sectionAnalyses)
            .where(inArray(schema.sectionAnalyses.analysisId, analysisIds));
        }

        // Delete sections (child of themes)
        if (themeIds.length > 0) {
          await db.delete(schema.sections)
            .where(inArray(schema.sections.themeId, themeIds));

          // Delete performance snapshots (child of themes)
          await db.delete(schema.performanceSnapshots)
            .where(inArray(schema.performanceSnapshots.themeId, themeIds));
        }

        // Delete themes
        await db.delete(schema.themes)
          .where(eq(schema.themes.storeId, storeId));

        // Delete theme analyses
        await db.delete(schema.themeAnalyses)
          .where(eq(schema.themeAnalyses.storeId, storeId));

        // Delete image analyses
        await db.delete(schema.imageAnalyses)
          .where(eq(schema.imageAnalyses.storeId, storeId));

        // Delete recommendations
        await db.delete(schema.recommendations)
          .where(eq(schema.recommendations.storeId, storeId));

        // Delete usage tracking
        await db.delete(schema.usageTracking)
          .where(eq(schema.usageTracking.storeId, storeId));

        // Delete promo code uses
        await db.delete(schema.promoCodeUses)
          .where(eq(schema.promoCodeUses.storeId, storeId));

        // Delete email subscriptions and logs
        const emailSubs = await db.query.emailSubscriptions.findMany({
          where: eq(schema.emailSubscriptions.storeId, storeId),
        });
        const emailSubIds = emailSubs.map(e => e.id);

        if (emailSubIds.length > 0) {
          await db.delete(schema.emailLogs)
            .where(inArray(schema.emailLogs.subscriptionId, emailSubIds));
          await db.delete(schema.scheduledEmails)
            .where(inArray(schema.scheduledEmails.subscriptionId, emailSubIds));
        }

        await db.delete(schema.emailSubscriptions)
          .where(eq(schema.emailSubscriptions.storeId, storeId));

        // Delete subscription
        await db.delete(schema.subscriptions)
          .where(eq(schema.subscriptions.storeId, storeId));

        // Delete agency data if applicable
        if (agency) {
          const agencyId = agency.id;

          // Find workspaces
          const workspaces = await db.query.workspaces.findMany({
            where: eq(schema.workspaces.agencyId, agencyId),
          });
          const workspaceIds = workspaces.map(w => w.id);

          // Delete workspace member access
          if (workspaceIds.length > 0) {
            await db.delete(schema.workspaceMemberAccess)
              .where(inArray(schema.workspaceMemberAccess.workspaceId, workspaceIds));

            // Delete client access logs
            await db.delete(schema.clientAccessLog)
              .where(inArray(schema.clientAccessLog.workspaceId, workspaceIds));
          }

          // Delete workspaces
          await db.delete(schema.workspaces)
            .where(eq(schema.workspaces.agencyId, agencyId));

          // Delete team members
          await db.delete(schema.teamMembers)
            .where(eq(schema.teamMembers.agencyId, agencyId));

          // Delete agency
          await db.delete(schema.agencies)
            .where(eq(schema.agencies.id, agencyId));
        }

        // Finally, delete the store record
        await db.delete(schema.stores)
          .where(eq(schema.stores.id, storeId));

        captureMessage('GDPR: Shop data deleted successfully', {
          tags: { webhook: 'shop/redact' },
          extra: {
            shop_domain: shopDomain,
            deleted: {
              themes: themeIds.length,
              analyses: analysisIds.length,
              hasAgency: !!agency,
            }
          }
        });

      } catch (dbError) {
        captureError(dbError as Error, {
          tags: { webhook: 'shop/redact' },
          extra: { shop_domain: shopDomain }
        });
        // Still return 200 - we've logged the request for manual follow-up
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shop data has been redacted.'
    });

  } catch (error) {
    captureError(error as Error, {
      tags: { webhook: 'shop/redact' }
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
