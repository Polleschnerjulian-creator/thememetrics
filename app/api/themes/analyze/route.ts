export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { createShopifyClient } from '@/lib/shopify';
import { analyzeSection, calculateHealthScore } from '@/lib/parser';
import { generateRecommendations, countProblematicSections } from '@/lib/recommendations';
import { PLANS, PlanId, canPerformAction } from '@/lib/billing';
import { calculateThemeMetricsScore, CoreWebVitals, SectionAnalysisData, ThemeData } from '@/lib/score';
import { checkApiRateLimit, checkDailyAnalysisLimit, rateLimitResponse } from '@/lib/rate-limit';
import { isValidShopDomain, sanitizeShopDomain } from '@/lib/security';
import { captureError, captureMessage, measureAsync, setUserContext } from '@/lib/monitoring';
import { sendEmail } from '@/lib/email/resend';
import { analysisCompleteEmail } from '@/lib/email/templates';
import { emailSubscriptions } from '@/lib/db/schema';
import { authenticateRequest, authErrorResponse } from '@/lib/auth';

// Get current month in format '2026-01'
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Fetch Core Web Vitals from Google PageSpeed API
async function fetchCoreWebVitals(shopDomain: string): Promise<CoreWebVitals | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    console.warn('PageSpeed API key not configured');
    return null;
  }

  try {
    // Build shop URL
    const shopUrl = shopDomain.includes('://') 
      ? shopDomain 
      : `https://${shopDomain.replace('.myshopify.com', '')}.myshopify.com`;

    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', shopUrl);
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');

    console.log(`Fetching PageSpeed for ${shopUrl}...`);

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      console.error('PageSpeed API error:', response.status);
      return null;
    }

    const data = await response.json();
    const audits = data.lighthouseResult?.audits;

    if (!audits) {
      console.error('No audits in PageSpeed response');
      return null;
    }

    return {
      lcp: audits['largest-contentful-paint']?.numericValue || 3000,
      cls: audits['cumulative-layout-shift']?.numericValue || 0.1,
      fcp: audits['first-contentful-paint']?.numericValue || 2000,
      tbt: audits['total-blocking-time']?.numericValue || 300,
    };
  } catch (error) {
    console.error('PageSpeed fetch error:', error);
    return null;
  }
}

// Check plan limits and update usage
async function checkAndUpdateUsage(storeId: number, planId: PlanId): Promise<{ allowed: boolean; error?: string }> {
  const currentMonth = getCurrentMonth();
  
  let usage = await db.query.usageTracking.findFirst({
    where: and(
      eq(schema.usageTracking.storeId, storeId),
      eq(schema.usageTracking.month, currentMonth)
    ),
  });

  if (!usage) {
    const [newUsage] = await db.insert(schema.usageTracking)
      .values({
        storeId,
        month: currentMonth,
        themeAnalysesCount: 0,
        performanceTestsCount: 0,
        pdfReportsCount: 0,
      })
      .returning();
    usage = newUsage;
  }

  const check = canPerformAction(planId, 'themeAnalysis', usage.themeAnalysesCount || 0);
  
  if (!check.allowed) {
    return { allowed: false, error: check.reason || 'Limit erreicht' };
  }

  await db.update(schema.usageTracking)
    .set({ 
      themeAnalysesCount: (usage.themeAnalysesCount || 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(schema.usageTracking.id, usage.id));

  return { allowed: true };
}

// Count snippets in theme
async function countSnippets(client: any, themeId: string): Promise<number> {
  try {
    const response = await client.get(`/themes/${themeId}/assets.json`);
    const assets = response.assets || [];
    return assets.filter((a: any) => a.key.startsWith('snippets/') && a.key.endsWith('.liquid')).length;
  } catch {
    return 0;
  }
}

// Check if theme uses translations
async function hasTranslations(client: any, themeId: string): Promise<boolean> {
  try {
    const response = await client.get(`/themes/${themeId}/assets.json`);
    const assets = response.assets || [];
    return assets.some((a: any) => a.key.startsWith('locales/'));
  } catch {
    return false;
  }
}

async function runAnalysis(request: NextRequest, bodyShop?: string) {
  // Authenticate request using session token or cookie fallback
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }
  
  const { shop: sanitizedShop, store } = authResult;

  // Check API rate limit (per minute)
  const apiLimit = checkApiRateLimit(sanitizedShop, 'free');
  if (!apiLimit.allowed) {
    return rateLimitResponse(apiLimit.resetIn);
  }

  // Set user context for error tracking
  setUserContext({ id: String(store.id), shop: store.shopDomain });

  // Get subscription to check plan
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.storeId, store.id),
  });
  
  const currentPlan = (subscription?.plan || 'free') as PlanId;

  // Check daily analysis limit
  const dailyLimit = await checkDailyAnalysisLimit(store.id, currentPlan as any);
  if (!dailyLimit.allowed) {
    return NextResponse.json({ 
      error: 'daily_limit_reached',
      message: `Du hast dein tägliches Limit von ${dailyLimit.limit} Analysen erreicht. Nächster Reset: ${dailyLimit.resetAt.toLocaleString('de-DE')}`,
      upgradeRequired: true,
      currentPlan,
      used: dailyLimit.used,
      limit: dailyLimit.limit,
    }, { status: 403 });
  }

  // Check usage limits (monthly)
  const usageCheck = await checkAndUpdateUsage(store.id, currentPlan);
  if (!usageCheck.allowed) {
    return NextResponse.json({ 
      error: 'limit_reached',
      message: usageCheck.error,
      upgradeRequired: true,
      currentPlan,
    }, { status: 403 });
  }

  captureMessage(`Analysis started for ${store.shopDomain}`, { 
    tags: { plan: currentPlan } 
  });

  const client = createShopifyClient(store.shopDomain, store.accessToken);
  const { themes: shopifyThemes } = await client.get<any>('/themes.json');
  const mainTheme = shopifyThemes.find((t: any) => t.role === 'main') || shopifyThemes[0];

  if (!mainTheme) {
    return NextResponse.json({ error: 'No theme found' }, { status: 404 });
  }

  let theme = await db.query.themes.findFirst({
    where: and(
      eq(schema.themes.storeId, store.id),
      eq(schema.themes.shopifyThemeId, mainTheme.id.toString())
    ),
  });

  if (!theme) {
    const [newTheme] = await db.insert(schema.themes).values({
      storeId: store.id,
      shopifyThemeId: mainTheme.id.toString(),
      name: mainTheme.name,
      role: mainTheme.role,
    }).returning();
    theme = newTheme;
  }

  // Fetch all theme assets - sort alphabetically for consistent results
  const { assets } = await client.get<any>(`/themes/${mainTheme.id}/assets.json`);
  const sectionAssets = assets
    .filter((a: any) => a.key.startsWith('sections/') && a.key.endsWith('.liquid'))
    .sort((a: any, b: any) => a.key.localeCompare(b.key));

  // Analyze sections
  const analyzedSections: SectionAnalysisData[] = [];
  for (const asset of sectionAssets.slice(0, 25)) { // Analyze up to 25 sections
    try {
      const { asset: fullAsset } = await client.get<any>(
        `/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(asset.key)}`
      );
      if (fullAsset?.value) {
        const analysis = analyzeSection(asset.key, fullAsset.value);
        analyzedSections.push({
          name: analysis.name,
          type: analysis.type,
          linesOfCode: analysis.linesOfCode,
          complexityScore: analysis.complexityScore,
          hasVideo: analysis.hasVideo,
          hasAnimations: analysis.hasAnimations,
          hasLazyLoading: analysis.hasLazyLoading,
          hasResponsiveImages: analysis.hasResponsiveImages,
          hasPreload: analysis.hasPreload,
          liquidLoops: analysis.liquidLoops,
          liquidAssigns: analysis.liquidAssigns,
          liquidConditions: analysis.liquidConditions,
          externalScripts: analysis.externalScripts,
          inlineStyles: analysis.inlineStyles,
        });
      }
    } catch (err) {
      console.error(`Error fetching asset ${asset.key}:`, err);
    }
  }

  // Fetch Core Web Vitals from Google (parallel with theme data)
  const [coreWebVitals, snippetsCount, usesTranslations] = await Promise.all([
    fetchCoreWebVitals(store.shopDomain),
    countSnippets(client, mainTheme.id),
    hasTranslations(client, mainTheme.id),
  ]);

  // Prepare theme data
  const themeData: ThemeData = {
    totalSections: analyzedSections.length,
    snippetsCount,
    hasTranslations: usesTranslations,
    sectionsAboveFold: Math.min(3, analyzedSections.length), // Assume first 3 are above fold
  };

  // Calculate ThemeMetrics Score
  console.log('Calculating ThemeMetrics Score...');
  const scoreBreakdown = calculateThemeMetricsScore(
    coreWebVitals,
    analyzedSections,
    themeData,
    undefined // No revenue data yet
  );
  
  console.log(`ThemeMetrics Score: ${scoreBreakdown.overall} (Speed: ${scoreBreakdown.speed.score}, Quality: ${scoreBreakdown.quality.score}, Conversion: ${scoreBreakdown.conversion.score})`);

  // Check plan features
  const planFeatures = PLANS[currentPlan].features;
  const showSectionDetails = planFeatures.sectionDetails;
  const maxRecommendations = planFeatures.recommendations;

  // Prepare sections with recommendations
  const sectionsWithRecs = analyzedSections.map(section => {
    const performanceScore = 100 - (section.complexityScore || 0);
    const recs = generateRecommendations([section as any]).map(r => r.title);
    return {
      name: section.name,
      type: section.type,
      category: section.type,
      performanceScore,
      performanceImpact: Math.round((100 - performanceScore) * 10), // Estimated ms impact
      recommendations: recs,
      // Additional data for score breakdown
      hasVideo: section.hasVideo,
      hasLazyLoading: section.hasLazyLoading,
      complexityScore: section.complexityScore,
    };
  });

  // Save to database
  const [savedAnalysis] = await db.insert(schema.themeAnalyses).values({
    storeId: store.id,
    themeId: mainTheme.id.toString(),
    themeName: mainTheme.name,
    totalSections: analyzedSections.length,
    overallScore: scoreBreakdown.overall,
    scoreSource: coreWebVitals ? 'thememetrics' : 'thememetrics-estimated',
    lcpMs: coreWebVitals?.lcp ? Math.round(coreWebVitals.lcp) : null,
    clsScore: coreWebVitals?.cls?.toString() ?? null,
    tbtMs: coreWebVitals?.tbt ? Math.round(coreWebVitals.tbt) : null,
    fcpMs: coreWebVitals?.fcp ? Math.round(coreWebVitals.fcp) : null,
  }).returning();

  // Save section analyses
  if (sectionsWithRecs.length > 0) {
    await db.insert(schema.sectionAnalyses).values(
      sectionsWithRecs.map(s => ({
        analysisId: savedAnalysis.id,
        sectionName: s.name,
        sectionType: s.type,
        category: s.category,
        performanceScore: s.performanceScore,
        recommendations: s.recommendations,
      }))
    );
  }

  // Update theme analyzedAt
  await db.update(schema.themes).set({ analyzedAt: new Date() }).where(eq(schema.themes.id, theme.id));

  // Send analysis complete email (async, don't block response)
  (async () => {
    try {
      const [subscription] = await db
        .select()
        .from(emailSubscriptions)
        .where(eq(emailSubscriptions.storeId, store.id));

      if (subscription && subscription.status === 'active') {
        const storeName = store.shopDomain.replace('.myshopify.com', '');
        const criticalCount = sectionsWithRecs.filter(s => s.performanceScore < 50).length;
        const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

        const html = analysisCompleteEmail({
          storeName,
          themeName: mainTheme.name,
          score: scoreBreakdown.overall,
          criticalCount,
          dashboardUrl,
        });

        await sendEmail({
          to: subscription.email,
          subject: `Analyse fertig: Score ${scoreBreakdown.overall} für ${mainTheme.name} 📊`,
          html,
        });
      }
    } catch (emailError) {
      console.error('Failed to send analysis complete email:', emailError);
    }
  })();

  // Limit data based on plan
  let responseSections = sectionsWithRecs.map(s => ({
    name: s.name,
    type: s.type,
    category: s.category,
    performanceScore: s.performanceScore,
    performanceImpact: showSectionDetails ? s.performanceImpact : 0,
    recommendations: maxRecommendations === -1 
      ? s.recommendations 
      : s.recommendations.slice(0, maxRecommendations),
    hasVideo: s.hasVideo,
    hasLazyLoading: s.hasLazyLoading,
  }));

  // Build response
  return NextResponse.json({
    theme: { 
      id: theme.id, 
      name: theme.name, 
      role: theme.role, 
      analyzedAt: new Date().toISOString() 
    },
    analysis: {
      id: savedAnalysis.id,
      totalSections: analyzedSections.length,
      sections: responseSections,
      highImpactCount: countProblematicSections(analyzedSections as any),
    },
    // ThemeMetrics Score (the main attraction!)
    score: {
      overall: scoreBreakdown.overall,
      speed: {
        score: scoreBreakdown.speed.score,
        coreWebVitals: scoreBreakdown.speed.coreWebVitals,
        sectionLoad: scoreBreakdown.speed.sectionLoad,
        details: coreWebVitals ? scoreBreakdown.speed.details : null,
        penalties: showSectionDetails ? scoreBreakdown.speed.penalties : [],
      },
      quality: {
        score: scoreBreakdown.quality.score,
        liquidQuality: scoreBreakdown.quality.liquidQuality,
        bestPractices: scoreBreakdown.quality.bestPractices,
        architecture: scoreBreakdown.quality.architecture,
        issues: showSectionDetails ? scoreBreakdown.quality.issues.slice(0, 5) : [],
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
    plan: {
      current: currentPlan,
      showSectionDetails,
      maxRecommendations,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    return await measureAsync('analyze-theme-get', () => runAnalysis(request));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'themes/analyze', method: 'GET' } });
    return NextResponse.json({ error: 'Failed to analyze theme' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (body.shop && !isValidShopDomain(body.shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }
    
    return await measureAsync('analyze-theme-post', () => runAnalysis(request, body.shop));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'themes/analyze', method: 'POST' } });
    return NextResponse.json({ error: 'Failed to analyze theme' }, { status: 500 });
  }
}
