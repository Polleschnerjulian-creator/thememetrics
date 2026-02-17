export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest, withCors } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    const { store, shop: shopSession } = authResult;

    // Phase 2: Parallel queries that only depend on store.id
    const [subscription, agency, latestAnalysis, history] = await Promise.all([
      db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.storeId, store.id),
      }),
      db.query.agencies.findFirst({
        where: eq(schema.agencies.ownerStoreId, store.id),
      }),
      db.query.themeAnalyses.findFirst({
        where: eq(schema.themeAnalyses.storeId, store.id),
        orderBy: [desc(schema.themeAnalyses.analyzedAt)],
      }),
      db.query.themeAnalyses.findMany({
        where: eq(schema.themeAnalyses.storeId, store.id),
        orderBy: [desc(schema.themeAnalyses.analyzedAt)],
        limit: 10,
      }),
    ]);

    if (!latestAnalysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    // Phase 3: Parallel - sections (depends on latestAnalysis) + workspace check (if no agency)
    const [sections, workspace] = await Promise.all([
      db.query.sectionAnalyses.findMany({
        where: eq(schema.sectionAnalyses.analysisId, latestAnalysis.id),
      }),
      !agency
        ? db.query.workspaces.findFirst({
            where: eq(schema.workspaces.storeId, store.id),
          })
        : Promise.resolve(null),
    ]);

    // Phase 4: Get workspace agency if needed (only if no direct agency and workspace exists)
    const workspaceAgency = !agency && workspace
      ? await db.query.agencies.findFirst({
          where: eq(schema.agencies.id, workspace.agencyId),
        })
      : null;

    // Build agency branding from either direct agency or workspace agency
    let agencyBranding = null;
    const brandingSource = agency || workspaceAgency;
    if (brandingSource) {
      agencyBranding = {
        name: brandingSource.name,
        logoBase64: brandingSource.logoBase64,
        logoUrl: brandingSource.logoUrl,
        primaryColor: brandingSource.primaryColor,
      };
    }

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
