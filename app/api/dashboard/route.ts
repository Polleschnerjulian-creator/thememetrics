export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const shopSession = cookieStore.get('shop_session')?.value;
    
    if (!shopSession) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const store = await db.query.stores.findFirst({
      where: eq(schema.stores.shopDomain, shopSession),
      with: {
        subscription: true,
      },
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    const theme = await db.query.themes.findFirst({
      where: eq(schema.themes.storeId, store.id),
      orderBy: [desc(schema.themes.createdAt)],
    });
    
    if (!theme) {
      return NextResponse.json({
        store: {
          id: store.id,
          domain: store.shopDomain,
          plan: store.plan,
        },
        needsAnalysis: true,
      });
    }
    
    const latestSnapshot = await db.query.performanceSnapshots.findFirst({
      where: eq(schema.performanceSnapshots.themeId, theme.id),
      orderBy: [desc(schema.performanceSnapshots.createdAt)],
    });
    
    const sections = await db.query.sections.findMany({
      where: eq(schema.sections.themeId, theme.id),
    });
    
    const recommendations = await db.query.recommendations.findMany({
      where: and(
        eq(schema.recommendations.storeId, store.id),
        eq(schema.recommendations.status, 'open')
      ),
      orderBy: [desc(schema.recommendations.impactScore)],
      limit: 10,
    });
    
    const totalLoadTime = sections.reduce((sum, s) => sum + (s.estimatedLoadTimeMs || 0), 0);
    const criticalIssues = recommendations.filter(r => r.severity === 'critical').length;
    
    return NextResponse.json({
      store: {
        id: store.id,
        domain: store.shopDomain,
        plan: store.plan,
        subscription: store.subscription,
      },
      theme: {
        id: theme.id,
        name: theme.name,
        analyzedAt: theme.analyzedAt,
      },
      stats: {
        healthScore: latestSnapshot?.healthScore || 0,
        healthScoreChange: 0,
        loadTime: totalLoadTime,
        loadTimeChange: 0,
        mobileScore: latestSnapshot?.mobileScore || 0,
        mobileScoreChange: 0,
        totalSections: sections.length,
        sectionsChange: 0,
        criticalIssues,
        issuesChange: 0,
      },
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        complexityScore: s.complexityScore,
        estimatedLoadTimeMs: s.estimatedLoadTimeMs,
        hasVideo: s.hasVideo,
        hasAnimations: s.hasAnimations,
      })),
      recommendations: recommendations.map(r => ({
        id: r.id,
        type: r.type,
        severity: r.severity,
        title: r.title,
        description: r.description,
        fix: r.fix,
        impactScore: r.impactScore,
        effortScore: r.effortScore,
        estimatedRevenueImpact: r.estimatedRevenueImpact,
      })),
      needsAnalysis: !theme.analyzedAt,
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
