export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    let { url, strategy = 'mobile' } = await request.json();
    
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
      console.error('PageSpeed API error:', errorData);
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
