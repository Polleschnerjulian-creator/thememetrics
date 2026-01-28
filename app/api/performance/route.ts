export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { PLANS, PlanId } from '@/lib/billing';
import { authenticateRequest, handleOptions, withCors } from '@/lib/auth';
import { captureError } from '@/lib/monitoring';
import { checkAndIncrementUsage } from '@/lib/usage';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
    };
    audits: {
      'largest-contentful-paint': { displayValue: string; numericValue: number };
      'cumulative-layout-shift': { displayValue: string; numericValue: number };
      'total-blocking-time': { displayValue: string; numericValue: number };
      'first-contentful-paint': { displayValue: string; numericValue: number };
      'speed-index': { displayValue: string; numericValue: number };
      'interactive': { displayValue: string; numericValue: number };
    };
  };
  loadingExperience?: {
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number; category: string };
      INTERACTION_TO_NEXT_PAINT?: { percentile: number; category: string };
      FIRST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
    };
    overall_category: string;
  };
}

// Check plan limits and update usage (atomic - no race conditions)
async function checkAndUpdateUsage(storeId: number, planId: PlanId, isDesktop: boolean): Promise<{ allowed: boolean; error?: string }> {
  const features = PLANS[planId].features;

  // Check desktop permission first
  if (isDesktop && !features.desktopPerformance) {
    return { allowed: false, error: 'Desktop Performance ist ab dem Starter Plan verfügbar.' };
  }

  // Atomic usage check and increment
  const result = await checkAndIncrementUsage(storeId, planId, 'performanceTest');
  return {
    allowed: result.allowed,
    error: result.error,
  };
}

// GET - Return latest performance data (for dashboard)
export async function GET(request: NextRequest) {
  try {
    // Authenticate using session token or cookie fallback
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return withCors(NextResponse.json({ error: authResult.error }, { status: authResult.status }));
    }
    
    const { store } = authResult;
    
    // Get latest theme analysis which contains performance data
    const latestAnalysis = await db.query.themeAnalyses.findFirst({
      where: eq(schema.themeAnalyses.storeId, store.id),
      orderBy: [desc(schema.themeAnalyses.analyzedAt)],
    });
    
    if (!latestAnalysis || !latestAnalysis.lcpMs) {
      return withCors(NextResponse.json({ 
        hasData: false,
        message: 'No performance data available. Run a theme analysis first.'
      }));
    }
    
    // Return cached performance data from theme analysis
    return withCors(NextResponse.json({
      hasData: true,
      mobile: {
        performance: latestAnalysis.overallScore,
        lcp: latestAnalysis.lcpMs,
        cls: parseFloat(latestAnalysis.clsScore as string) || 0,
        tbt: latestAnalysis.tbtMs,
        fcp: latestAnalysis.fcpMs,
      },
      analyzedAt: latestAnalysis.analyzedAt,
    }));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'performance', method: 'GET' } });
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    let { url, strategy = 'mobile', shop } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Auto-fix URL: add https:// if missing
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Validate strategy
    if (strategy !== 'mobile' && strategy !== 'desktop') {
      strategy = 'mobile';
    }

    // Check plan limits if shop is provided
    if (shop) {
      const store = await db.query.stores.findFirst({
        where: eq(schema.stores.shopDomain, shop),
      });

      if (store) {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.storeId, store.id),
        });

        const planId = (subscription?.plan || 'free') as PlanId;
        const usageCheck = await checkAndUpdateUsage(store.id, planId, strategy === 'desktop');

        if (!usageCheck.allowed) {
          return NextResponse.json({ 
            error: 'Plan limit reached',
            message: usageCheck.error,
            upgradeRequired: true,
          }, { status: 403 });
        }
      }
    }

    const apiKey = process.env.PAGESPEED_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'PageSpeed API key not configured' }, { status: 500 });
    }

    // Call PageSpeed Insights API
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('strategy', strategy);
    apiUrl.searchParams.append('category', 'performance');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');
    apiUrl.searchParams.append('category', 'seo');

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      captureError(new Error(`PageSpeed API error: ${errorData.error?.message || 'Unknown error'}`), { tags: { route: 'performance' } });
      return NextResponse.json({
        error: 'Failed to fetch PageSpeed data',
        details: errorData.error?.message || 'Unknown error'
      }, { status: response.status });
    }

    const data: PageSpeedResponse = await response.json();

    // Extract and format the data
    const lighthouse = data.lighthouseResult;
    const fieldData = data.loadingExperience;

    const result = {
      // Lighthouse Scores (0-100)
      scores: {
        performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
        accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),
        seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
      },
      
      // Core Web Vitals (Lab Data)
      labData: {
        lcp: {
          value: lighthouse.audits['largest-contentful-paint']?.numericValue || 0,
          displayValue: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
        },
        cls: {
          value: lighthouse.audits['cumulative-layout-shift']?.numericValue || 0,
          displayValue: lighthouse.audits['cumulative-layout-shift']?.displayValue || 'N/A',
        },
        tbt: {
          value: lighthouse.audits['total-blocking-time']?.numericValue || 0,
          displayValue: lighthouse.audits['total-blocking-time']?.displayValue || 'N/A',
        },
        fcp: {
          value: lighthouse.audits['first-contentful-paint']?.numericValue || 0,
          displayValue: lighthouse.audits['first-contentful-paint']?.displayValue || 'N/A',
        },
        speedIndex: {
          value: lighthouse.audits['speed-index']?.numericValue || 0,
          displayValue: lighthouse.audits['speed-index']?.displayValue || 'N/A',
        },
        tti: {
          value: lighthouse.audits['interactive']?.numericValue || 0,
          displayValue: lighthouse.audits['interactive']?.displayValue || 'N/A',
        },
      },

      // Field Data (Real User Metrics) - if available
      fieldData: fieldData ? {
        lcp: fieldData.metrics?.LARGEST_CONTENTFUL_PAINT_MS ? {
          value: fieldData.metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile,
          category: fieldData.metrics.LARGEST_CONTENTFUL_PAINT_MS.category,
        } : null,
        cls: fieldData.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE ? {
          value: fieldData.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
          category: fieldData.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
        } : null,
        inp: fieldData.metrics?.INTERACTION_TO_NEXT_PAINT ? {
          value: fieldData.metrics.INTERACTION_TO_NEXT_PAINT.percentile,
          category: fieldData.metrics.INTERACTION_TO_NEXT_PAINT.category,
        } : null,
        fcp: fieldData.metrics?.FIRST_CONTENTFUL_PAINT_MS ? {
          value: fieldData.metrics.FIRST_CONTENTFUL_PAINT_MS.percentile,
          category: fieldData.metrics.FIRST_CONTENTFUL_PAINT_MS.category,
        } : null,
        overallCategory: fieldData.overall_category,
      } : null,

      // Metadata
      analyzedUrl: url,
      strategy: strategy,
      timestamp: new Date().toISOString(),
    };

    return withCors(NextResponse.json(result));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'performance', method: 'POST' } });
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
