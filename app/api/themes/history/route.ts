export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { withAuth, handleOptions } from '@/lib/auth';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (shop, store) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '30');
      const compare = searchParams.get('compare') === 'true';

      // Get all analyses for this store, ordered by date
      const analyses = await db.query.themeAnalyses.findMany({
        where: eq(schema.themeAnalyses.storeId, store.id),
        orderBy: [desc(schema.themeAnalyses.analyzedAt)],
        limit: limit,
      });

      if (!analyses.length) {
        return NextResponse.json({ hasData: false, history: [] });
      }

      // Transform for chart display
      const history = analyses.slice().reverse().map(a => ({
        date: a.analyzedAt,
        score: a.overallScore,
        sections: a.totalSections,
        themeName: a.themeName,
      }));

      // Calculate trends
      const latestScore = analyses[0].overallScore;
      const previousScore = analyses[1]?.overallScore || latestScore;
      const scoreTrend = latestScore - previousScore;

      // Week over week comparison
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoAnalysis = analyses.find(a => 
        a.analyzedAt && new Date(a.analyzedAt) <= oneWeekAgo
      );
      const weekOverWeekTrend = weekAgoAnalysis 
        ? latestScore - weekAgoAnalysis.overallScore 
        : 0;

      // If compare=true, get detailed section comparison
      let comparison = null;
      if (compare && analyses.length >= 2) {
        const currentAnalysis = analyses[0];
        const previousAnalysis = analyses[1];

        // Get section analyses for both using correct field name
        const currentSections = await db.query.sectionAnalyses.findMany({
          where: eq(schema.sectionAnalyses.analysisId, currentAnalysis.id),
        });

        const previousSections = await db.query.sectionAnalyses.findMany({
          where: eq(schema.sectionAnalyses.analysisId, previousAnalysis.id),
        });

        // Map previous sections by name for comparison
        const previousSectionMap = new Map(
          previousSections.map(s => [s.sectionName, s])
        );

        // Find improvements and regressions
        const improvements: Array<{
          sectionName: string;
          previousScore: number;
          currentScore: number;
          improvement: number;
          fixApplied?: string;
        }> = [];

        const regressions: Array<{
          sectionName: string;
          previousScore: number;
          currentScore: number;
          regression: number;
          possibleCause?: string;
        }> = [];

        for (const currentSection of currentSections) {
          const previousSection = previousSectionMap.get(currentSection.sectionName);
          
          if (previousSection) {
            const scoreDiff = currentSection.performanceScore - previousSection.performanceScore;
            
            if (scoreDiff >= 5) {
              // Significant improvement - detect what might have been fixed
              let fixApplied = undefined;
              
              // We can infer fixes based on score improvement magnitude
              if (scoreDiff >= 15) {
                fixApplied = 'Große Optimierung durchgeführt';
              } else if (scoreDiff >= 10) {
                fixApplied = 'Performance verbessert';
              } else {
                fixApplied = 'Kleinere Optimierung';
              }

              improvements.push({
                sectionName: currentSection.sectionName,
                previousScore: previousSection.performanceScore,
                currentScore: currentSection.performanceScore,
                improvement: scoreDiff,
                fixApplied,
              });
            } else if (scoreDiff <= -5) {
              // Significant regression
              let possibleCause = undefined;

              if (scoreDiff <= -15) {
                possibleCause = 'Größere Änderung vorgenommen';
              } else if (scoreDiff <= -10) {
                possibleCause = 'Neue Elemente hinzugefügt';
              } else {
                possibleCause = 'Kleinere Änderung';
              }

              regressions.push({
                sectionName: currentSection.sectionName,
                previousScore: previousSection.performanceScore,
                currentScore: currentSection.performanceScore,
                regression: scoreDiff,
                possibleCause,
              });
            }
          }
        }

        // Sort by magnitude of change
        improvements.sort((a, b) => b.improvement - a.improvement);
        regressions.sort((a, b) => a.regression - b.regression);

        comparison = {
          previousScore: previousAnalysis.overallScore,
          currentScore: currentAnalysis.overallScore,
          previousAnalyzedAt: previousAnalysis.analyzedAt,
          currentAnalyzedAt: currentAnalysis.analyzedAt,
          improvements: improvements.slice(0, 5), // Top 5
          regressions: regressions.slice(0, 5), // Top 5
        };
      }

      return NextResponse.json({
        hasData: true,
        history,
        trends: {
          current: latestScore,
          previous: previousScore,
          change: scoreTrend,
          weekOverWeek: weekOverWeekTrend,
          totalAnalyses: analyses.length,
          firstAnalysis: analyses[analyses.length - 1].analyzedAt,
          lastAnalysis: analyses[0].analyzedAt,
        },
        ...(compare && { hasComparison: !!comparison, comparison }),
      });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
  });
}
