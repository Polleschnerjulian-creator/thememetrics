export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { calculateThemeMetricsScore, SectionAnalysisData, ThemeData } from '@/lib/score';
import { withAuth, handleOptions } from '@/lib/auth';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (shop, store) => {
    try {
      const latestAnalysis = await db.query.themeAnalyses.findFirst({
        where: eq(schema.themeAnalyses.storeId, store.id),
        orderBy: [desc(schema.themeAnalyses.analyzedAt)],
      });

      if (!latestAnalysis) {
        return NextResponse.json({ hasData: false });
      }

      const sections = await db.query.sectionAnalyses.findMany({
        where: eq(schema.sectionAnalyses.analysisId, latestAnalysis.id),
      });

      const transformedSections = sections.map(s => ({
        name: s.sectionName,
        type: s.sectionType,
        category: s.category,
        performanceScore: s.performanceScore,
        performanceImpact: Math.round((100 - s.performanceScore) * 10),
        recommendations: s.recommendations || [],
        estimatedLoadTime: Math.round((100 - s.performanceScore) * 5 + 50), // Estimated
        hasVideo: s.sectionName.toLowerCase().includes('video') || s.sectionType === 'video',
        hasAnimations: s.sectionName.toLowerCase().includes('animation') || s.sectionName.toLowerCase().includes('slider'),
        hasLazyLoading: s.performanceScore > 70,
        linesOfCode: 100, // Estimated
      }));

      // Group sections by category for the Theme Analysis page
      const categorizedSections: Record<string, typeof transformedSections> = {};
      transformedSections.forEach(section => {
        const cat = section.category || 'Sonstiges';
        if (!categorizedSections[cat]) categorizedSections[cat] = [];
        categorizedSections[cat].push(section);
      });

      // Reconstruct Core Web Vitals from stored data
      const coreWebVitals = latestAnalysis.lcpMs ? {
        lcp: latestAnalysis.lcpMs,
        cls: parseFloat(latestAnalysis.clsScore as string) || 0.1,
        tbt: latestAnalysis.tbtMs || 300,
        fcp: latestAnalysis.fcpMs || 2000,
      } : null;

      // Create section analysis data for score calculation
      const sectionAnalysisData: SectionAnalysisData[] = sections.map(s => ({
        name: s.sectionName,
        type: s.sectionType,
        linesOfCode: 100, // Estimated
        complexityScore: 100 - s.performanceScore,
        hasVideo: s.sectionName.toLowerCase().includes('video') || s.sectionType === 'video',
        hasAnimations: false,
        hasLazyLoading: s.performanceScore > 70,
        hasResponsiveImages: s.performanceScore > 60,
        hasPreload: false,
        liquidLoops: Math.floor((100 - s.performanceScore) / 20),
        liquidAssigns: Math.floor((100 - s.performanceScore) / 10),
        liquidConditions: Math.floor((100 - s.performanceScore) / 15),
        externalScripts: s.sectionType === 'instagram' ? 1 : 0,
        inlineStyles: 0,
      }));

      // Theme data
      const themeData: ThemeData = {
        totalSections: latestAnalysis.totalSections,
        snippetsCount: 5, // Estimated
        hasTranslations: true,
        sectionsAboveFold: 3,
      };

      // Calculate ThemeMetrics Score
      const scoreBreakdown = calculateThemeMetricsScore(
        coreWebVitals,
        sectionAnalysisData,
        themeData,
        undefined
      );

      return NextResponse.json({
        hasData: true,
        theme: {
          id: latestAnalysis.themeId,
          name: latestAnalysis.themeName,
          analyzedAt: latestAnalysis.analyzedAt,
        },
        analysis: {
          id: latestAnalysis.id,
          totalSections: latestAnalysis.totalSections,
          sections: transformedSections,
          categorizedSections: categorizedSections,
          overallScore: latestAnalysis.overallScore,
          highImpactCount: sections.filter(s => s.performanceScore < 50).length,
        },
        score: {
          overall: scoreBreakdown.overall,
          speed: {
            score: scoreBreakdown.speed.score,
            coreWebVitals: scoreBreakdown.speed.coreWebVitals,
            sectionLoad: scoreBreakdown.speed.sectionLoad,
            details: coreWebVitals ? scoreBreakdown.speed.details : null,
            penalties: scoreBreakdown.speed.penalties,
          },
          quality: {
            score: scoreBreakdown.quality.score,
            liquidQuality: scoreBreakdown.quality.liquidQuality,
            bestPractices: scoreBreakdown.quality.bestPractices,
            architecture: scoreBreakdown.quality.architecture,
            issues: scoreBreakdown.quality.issues.slice(0, 5),
          },
          conversion: {
            score: scoreBreakdown.conversion.score,
            ecommerce: scoreBreakdown.conversion.ecommerce,
            mobile: scoreBreakdown.conversion.mobile,
            revenueImpact: scoreBreakdown.conversion.revenueImpact,
            estimatedMonthlyLoss: scoreBreakdown.conversion.estimatedMonthlyLoss,
          },
          hasRealData: !!coreWebVitals,
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
  });
}
