import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, themeAnalyses, sectionAnalyses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createShopifyClient } from '@/lib/shopify';
import { captureError } from '@/lib/monitoring';

// Industry benchmarks for conversion impact
const PERFORMANCE_BENCHMARKS = {
  // Conversion loss per second of load time (industry average: 7%)
  conversionLossPerSecond: 0.07,
  // Score to load time mapping (approximate)
  scoreToLoadTime: (score: number) => {
    // Score 100 = 1.5s, Score 50 = 4s, Score 0 = 6s
    return 6 - (score / 100) * 4.5;
  },
  // Fashion industry average conversion rate
  industryAvgConversionRate: 0.021, // 2.1%
  // Average order value for fashion
  industryAvgAOV: 85,
};

interface ShopAnalytics {
  monthlyRevenue: number;
  monthlySessions: number;
  conversionRate: number;
  averageOrderValue: number;
  ordersCount: number;
}

interface RevenueImpact {
  // Current state
  currentScore: number;
  currentLoadTime: number;
  currentConversionRate: number;
  
  // Projected state after optimization
  projectedScore: number;
  projectedLoadTime: number;
  projectedConversionRate: number;
  
  // Shop metrics
  monthlyRevenue: number;
  monthlySessions: number;
  averageOrderValue: number;
  
  // Impact calculations
  monthlyRevenueLoss: number;
  potentialMonthlyGain: number;
  potentialYearlyGain: number;
  conversionRateIncrease: number;
  
  // Per section breakdown
  sectionImpacts: Array<{
    name: string;
    currentScore: number;
    potentialScore: number;
    monthlyImpact: number;
    issue: string;
  }>;
  
  // Data source
  dataSource: 'shopify' | 'estimated';
}

// Fetch shop analytics from Shopify
async function getShopAnalytics(shop: string, accessToken: string): Promise<ShopAnalytics | null> {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    // Get orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ordersResponse = await client.get<{ orders: any[] }>(
      `/orders.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}&limit=250`
    );
    
    const orders = ordersResponse.orders || [];
    const ordersCount = orders.length;
    
    // Calculate metrics
    const monthlyRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);
    
    const averageOrderValue = ordersCount > 0 ? monthlyRevenue / ordersCount : PERFORMANCE_BENCHMARKS.industryAvgAOV;
    
    // Estimate sessions based on industry conversion rate if we don't have analytics access
    // Shopify Plus has analytics API, regular stores need estimation
    const estimatedConversionRate = ordersCount > 0 
      ? Math.min(0.05, Math.max(0.005, ordersCount / (ordersCount / PERFORMANCE_BENCHMARKS.industryAvgConversionRate)))
      : PERFORMANCE_BENCHMARKS.industryAvgConversionRate;
    
    const estimatedSessions = ordersCount > 0 
      ? Math.round(ordersCount / estimatedConversionRate)
      : 5000; // Default estimate
    
    return {
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      monthlySessions: estimatedSessions,
      conversionRate: Math.round(estimatedConversionRate * 10000) / 100, // As percentage
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      ordersCount,
    };
  } catch (error) {
    captureError(error as Error, { tags: { function: 'getShopAnalytics' } });
    return null;
  }
}

// Calculate revenue impact
function calculateRevenueImpact(
  analytics: ShopAnalytics,
  currentScore: number,
  sections: any[],
  dataSource: 'shopify' | 'estimated'
): RevenueImpact {
  // Calculate load times from scores
  const currentLoadTime = PERFORMANCE_BENCHMARKS.scoreToLoadTime(currentScore);
  
  // Calculate potential score (optimized)
  const potentialScore = Math.min(95, currentScore + 25); // Realistic improvement
  const projectedLoadTime = PERFORMANCE_BENCHMARKS.scoreToLoadTime(potentialScore);
  
  // Load time improvement
  const loadTimeImprovement = currentLoadTime - projectedLoadTime;
  
  // Conversion rate impact
  const conversionRateIncrease = loadTimeImprovement * PERFORMANCE_BENCHMARKS.conversionLossPerSecond;
  const currentConversionRate = analytics.conversionRate / 100;
  const projectedConversionRate = currentConversionRate * (1 + conversionRateIncrease);
  
  // Revenue calculations
  const currentMonthlyOrders = analytics.monthlySessions * currentConversionRate;
  const projectedMonthlyOrders = analytics.monthlySessions * projectedConversionRate;
  const additionalOrders = projectedMonthlyOrders - currentMonthlyOrders;
  
  const potentialMonthlyGain = Math.round(additionalOrders * analytics.averageOrderValue);
  const potentialYearlyGain = potentialMonthlyGain * 12;
  
  // Calculate what they're currently losing vs optimal (score 95)
  const optimalLoadTime = PERFORMANCE_BENCHMARKS.scoreToLoadTime(95);
  const currentLossFromOptimal = (currentLoadTime - optimalLoadTime) * PERFORMANCE_BENCHMARKS.conversionLossPerSecond;
  const monthlyRevenueLoss = Math.round(analytics.monthlyRevenue * currentLossFromOptimal);
  
  // Per section impact calculation
  const sectionImpacts = sections
    .filter(s => s.performanceScore < 80)
    .map(section => {
      // Estimate section's contribution to overall load time
      const sectionWeight = 1 / sections.length;
      const sectionScoreGain = Math.min(30, 80 - section.performanceScore);
      const sectionLoadTimeGain = (sectionScoreGain / 100) * 1.5 * sectionWeight;
      const sectionConversionGain = sectionLoadTimeGain * PERFORMANCE_BENCHMARKS.conversionLossPerSecond;
      const sectionMonthlyImpact = Math.round(
        analytics.monthlySessions * currentConversionRate * sectionConversionGain * analytics.averageOrderValue
      );
      
      return {
        name: section.name,
        currentScore: section.performanceScore,
        potentialScore: Math.min(95, section.performanceScore + sectionScoreGain),
        monthlyImpact: Math.max(50, sectionMonthlyImpact), // Minimum €50 to show value
        issue: section.recommendations?.[0] || 'Performance-Optimierung empfohlen',
      };
    })
    .sort((a, b) => b.monthlyImpact - a.monthlyImpact)
    .slice(0, 5); // Top 5 sections
  
  return {
    currentScore,
    currentLoadTime: Math.round(currentLoadTime * 10) / 10,
    currentConversionRate: Math.round(currentConversionRate * 10000) / 100,
    
    projectedScore: potentialScore,
    projectedLoadTime: Math.round(projectedLoadTime * 10) / 10,
    projectedConversionRate: Math.round(projectedConversionRate * 10000) / 100,
    
    monthlyRevenue: analytics.monthlyRevenue,
    monthlySessions: analytics.monthlySessions,
    averageOrderValue: analytics.averageOrderValue,
    
    monthlyRevenueLoss,
    potentialMonthlyGain,
    potentialYearlyGain,
    conversionRateIncrease: Math.round(conversionRateIncrease * 10000) / 100,
    
    sectionImpacts,
    dataSource,
  };
}

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }
  
  try {
    // Get store from database
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.shopDomain, shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`))
      .limit(1);
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    // Get latest analysis
    const [latestAnalysis] = await db
      .select()
      .from(themeAnalyses)
      .where(eq(themeAnalyses.storeId, store.id))
      .orderBy(desc(themeAnalyses.analyzedAt))
      .limit(1);
    
    if (!latestAnalysis) {
      return NextResponse.json({ 
        error: 'No analysis found',
        message: 'Führe zuerst eine Theme-Analyse durch'
      }, { status: 404 });
    }
    
    // Get sections from sectionAnalyses table
    const sectionData = await db
      .select()
      .from(sectionAnalyses)
      .where(eq(sectionAnalyses.analysisId, latestAnalysis.id));
    
    const currentScore = latestAnalysis.overallScore || 50;
    const sections = sectionData.map(s => ({
      name: s.sectionName,
      type: s.sectionType,
      performanceScore: s.performanceScore,
      recommendations: s.recommendations || [],
    }));
    
    // Try to get real analytics from Shopify
    let analytics: ShopAnalytics | null = null;
    let dataSource: 'shopify' | 'estimated' = 'estimated';
    
    if (store.accessToken) {
      analytics = await getShopAnalytics(
        store.shopDomain,
        store.accessToken
      );
      if (analytics && analytics.ordersCount > 0) {
        dataSource = 'shopify';
      }
    }
    
    // Fallback to estimated data
    if (!analytics) {
      analytics = {
        monthlyRevenue: 15000, // Conservative estimate
        monthlySessions: 8000,
        conversionRate: 2.1,
        averageOrderValue: 85,
        ordersCount: 0,
      };
    }
    
    // Calculate revenue impact
    const impact = calculateRevenueImpact(analytics, currentScore, sections, dataSource);
    
    return NextResponse.json(impact);

  } catch (error) {
    captureError(error as Error, { tags: { route: 'revenue', method: 'GET' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
