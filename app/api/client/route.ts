export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const password = searchParams.get('password');

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    const workspace = await db.query.workspaces.findFirst({
      where: eq(schema.workspaces.clientAccessToken, token),
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 404 });
    }

    if (!workspace.clientAccessEnabled) {
      return NextResponse.json({ error: 'Client access is disabled' }, { status: 403 });
    }

    if (!workspace.isActive) {
      return NextResponse.json({ error: 'Workspace is inactive' }, { status: 403 });
    }

    if (workspace.clientAccessPassword && workspace.clientAccessPassword !== password) {
      return NextResponse.json({ 
        error: 'Password required',
        passwordProtected: true,
      }, { status: 401 });
    }

    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.id, workspace.agencyId),
    });

    await db.insert(schema.clientAccessLog).values({
      workspaceId: workspace.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const store = workspace.storeId 
      ? await db.query.stores.findFirst({
          where: eq(schema.stores.id, workspace.storeId),
        })
      : null;

    if (!store) {
      return NextResponse.json({
        workspace: {
          name: workspace.name,
          shopDomain: workspace.shopDomain,
        },
        agency: agency ? {
          name: agency.name,
          logoUrl: agency.logoUrl,
          primaryColor: agency.primaryColor,
        } : null,
        data: null,
        message: 'Shop not connected yet',
      });
    }

    const latestAnalysis = await db.query.themeAnalyses.findFirst({
      where: eq(schema.themeAnalyses.storeId, store.id),
      orderBy: desc(schema.themeAnalyses.analyzedAt),
    });

    const sectionAnalyses = latestAnalysis 
      ? await db.query.sectionAnalyses.findMany({
          where: eq(schema.sectionAnalyses.analysisId, latestAnalysis.id),
        })
      : [];

    const analysisHistory = await db.query.themeAnalyses.findMany({
      where: eq(schema.themeAnalyses.storeId, store.id),
      orderBy: desc(schema.themeAnalyses.analyzedAt),
      limit: 10,
    });

    const criticalSections = sectionAnalyses.filter(s => s.performanceScore < 40).length;
    const warningSections = sectionAnalyses.filter(s => s.performanceScore >= 40 && s.performanceScore < 60).length;
    const goodSections = sectionAnalyses.filter(s => s.performanceScore >= 60).length;

    const topRecommendations = sectionAnalyses
      .flatMap(s => {
        const recs = (s.recommendations || []) as string[];
        return recs.map(r => ({
          section: s.sectionName,
          recommendation: r,
          score: s.performanceScore,
        }));
      })
      .filter(r => r.score < 60)
      .slice(0, 10);

    return NextResponse.json({
      workspace: {
        name: workspace.name,
        shopDomain: workspace.shopDomain,
      },
      agency: agency ? {
        name: agency.name,
        logoUrl: agency.logoUrl,
        logoBase64: agency.logoBase64,
        primaryColor: agency.primaryColor,
      } : null,
      data: {
        theme: latestAnalysis ? {
          name: latestAnalysis.themeName,
          analyzedAt: latestAnalysis.analyzedAt,
          score: latestAnalysis.overallScore,
          totalSections: latestAnalysis.totalSections,
          coreWebVitals: latestAnalysis.lcpMs ? {
            lcp: latestAnalysis.lcpMs,
            cls: latestAnalysis.clsScore,
            tbt: latestAnalysis.tbtMs,
            fcp: latestAnalysis.fcpMs,
          } : null,
        } : null,
        summary: {
          critical: criticalSections,
          warning: warningSections,
          good: goodSections,
          total: sectionAnalyses.length,
        },
        sections: sectionAnalyses.map(s => ({
          name: s.sectionName,
          type: s.sectionType,
          category: s.category,
          score: s.performanceScore,
          recommendationsCount: ((s.recommendations || []) as string[]).length,
        })),
        recommendations: topRecommendations,
        history: analysisHistory.map(a => ({
          score: a.overallScore,
          date: a.analyzedAt,
          themeName: a.themeName,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
