export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    
    const cookieStore = await cookies();
    const shopSession = shop || cookieStore.get('shop_session')?.value;

    if (!shopSession) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shopSession),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get subscription to check plan
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, store.id),
    });

    // Get agency branding if user is agency or part of an agency workspace
    let agencyBranding = null;
    
    // Check if this store is an agency owner
    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (agency) {
      agencyBranding = {
        name: agency.name,
        logoBase64: agency.logoBase64,
        logoUrl: agency.logoUrl,
        primaryColor: agency.primaryColor,
      };
    } else {
      // Check if this store is part of an agency workspace
      const workspace = await db.query.workspaces.findFirst({
        where: eq(schema.workspaces.storeId, store.id),
      });

      if (workspace) {
        const workspaceAgency = await db.query.agencies.findFirst({
          where: eq(schema.agencies.id, workspace.agencyId),
        });

        if (workspaceAgency) {
          agencyBranding = {
            name: workspaceAgency.name,
            logoBase64: workspaceAgency.logoBase64,
            logoUrl: workspaceAgency.logoUrl,
            primaryColor: workspaceAgency.primaryColor,
          };
        }
      }
    }

    // Get latest analysis
    const latestAnalysis = await db.query.themeAnalyses.findFirst({
      where: eq(schema.themeAnalyses.storeId, store.id),
      orderBy: [desc(schema.themeAnalyses.analyzedAt)],
    });

    if (!latestAnalysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    // Get sections
    const sections = await db.query.sectionAnalyses.findMany({
      where: eq(schema.sectionAnalyses.analysisId, latestAnalysis.id),
    });

    // Get history for trend
    const history = await db.query.themeAnalyses.findMany({
      where: eq(schema.themeAnalyses.storeId, store.id),
      orderBy: [desc(schema.themeAnalyses.analyzedAt)],
      limit: 10,
    });

    // Return data for client-side PDF generation
    const reportData = {
      store: {
        domain: shopSession,
        plan: subscription?.plan || store.plan || 'free',
      },
      agency: agencyBranding,
      analysis: {
        themeName: latestAnalysis.themeName,
        overallScore: latestAnalysis.overallScore,
        totalSections: latestAnalysis.totalSections,
        analyzedAt: latestAnalysis.analyzedAt,
      },
      sections: sections.map(s => ({
        name: s.sectionName,
        type: s.sectionType,
        score: s.performanceScore,
        recommendations: s.recommendations || [],
      })).sort((a, b) => a.score - b.score),
      history: history.map(h => ({
        score: h.overallScore,
        date: h.analyzedAt,
      })).reverse(),
      summary: {
        critical: sections.filter(s => s.performanceScore < 50).length,
        warning: sections.filter(s => s.performanceScore >= 50 && s.performanceScore < 70).length,
        good: sections.filter(s => s.performanceScore >= 70).length,
        totalRecommendations: sections.reduce((sum, s) => sum + (s.recommendations?.length || 0), 0),
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
