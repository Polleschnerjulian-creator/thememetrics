export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
  fetchThemes,
  fetchThemeFileList,
  fetchThemeFileContents,
  gidToId,
} from '@/lib/shopify';
import { analyzeSection, calculateHealthScore } from '@/lib/parser';
import { generateRecommendations, countProblematicSections } from '@/lib/recommendations';
import { PLANS, PlanId } from '@/lib/billing';
import { checkAndIncrementUsage } from '@/lib/usage';
import { calculateThemeMetricsScore, CoreWebVitals, SectionAnalysisData, ThemeData } from '@/lib/score';
import { checkApiRateLimit, checkDailyAnalysisLimit, rateLimitResponse } from '@/lib/rate-limit';
import { isValidShopDomain, sanitizeShopDomain } from '@/lib/security';
import { captureError, captureMessage, measureAsync, setUserContext } from '@/lib/monitoring';
import { sendEmail } from '@/lib/email/resend';
import { analysisCompleteEmail } from '@/lib/email/templates';
import { emailSubscriptions } from '@/lib/db/schema';
import { authenticateRequest, authErrorResponse, handleOptions, withCors } from '@/lib/auth';
import { getCachedPageSpeed, setCachedPageSpeed, cacheScore, CACHE_TTL } from '@/lib/cache';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

// Get current month in format '2026-01'
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Fetch Core Web Vitals from Google PageSpeed API (with 24h caching)
async function fetchCoreWebVitals(shopDomain: string): Promise<CoreWebVitals | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Check cache first (24h TTL)
  const cached = await getCachedPageSpeed<CoreWebVitals>(shopDomain, 'mobile');
  if (cached) {
    return cached;
  }

  try {
    const shopUrl = shopDomain.includes('://')
      ? shopDomain
      : `https://${shopDomain.replace('.myshopify.com', '')}.myshopify.com`;

    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', shopUrl);
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const audits = data.lighthouseResult?.audits;

    if (!audits) {
      return null;
    }

    const vitals: CoreWebVitals = {
      lcp: audits['largest-contentful-paint']?.numericValue || 3000,
      cls: audits['cumulative-layout-shift']?.numericValue || 0.1,
      fcp: audits['first-contentful-paint']?.numericValue || 2000,
      tbt: audits['total-blocking-time']?.numericValue || 300,
    };

    await setCachedPageSpeed(shopDomain, 'mobile', vitals);
    return vitals;
  } catch (error) {
    captureError(error as Error, { tags: { function: 'fetchCoreWebVitals' } });
    return null;
  }
}

// Check plan limits and update usage (atomic)
async function checkAndUpdateUsage(
  storeId: number,
  planId: PlanId
): Promise<{ allowed: boolean; error?: string }> {
  const result = await checkAndIncrementUsage(storeId, planId, 'themeAnalysis');
  return { allowed: result.allowed, error: result.error };
}

async function runAnalysis(request: NextRequest): Promise<NextResponse> {
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

  setUserContext({ id: String(store.id), shop: store.shopDomain });

  // Get subscription to check plan
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.storeId, store.id),
  });

  const currentPlan = (subscription?.plan || 'free') as PlanId;

  // Check daily analysis limit
  const dailyLimit = await checkDailyAnalysisLimit(store.id, currentPlan as any);
  if (!dailyLimit.allowed) {
    return NextResponse.json(
      {
        error: 'daily_limit_reached',
        message: `Du hast dein tägliches Limit von ${dailyLimit.limit} Analysen erreicht. Nächster Reset: ${dailyLimit.resetAt.toLocaleString('de-DE')}`,
        upgradeRequired: true,
        currentPlan,
        used: dailyLimit.used,
        limit: dailyLimit.limit,
      },
      { status: 403 }
    );
  }

  // Check monthly usage limits
  const usageCheck = await checkAndUpdateUsage(store.id, currentPlan);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: usageCheck.error,
        upgradeRequired: true,
        currentPlan,
      },
      { status: 403 }
    );
  }

  captureMessage(`Analysis started for ${store.shopDomain}`, {
    tags: { plan: currentPlan },
  });

  // ---- Fetch themes via GraphQL ----
  const themes = await fetchThemes(store.shopDomain, store.accessToken);
  const mainGqlTheme =
    themes.find((t) => t.role === 'MAIN') ?? themes[0];

  if (!mainGqlTheme) {
    return NextResponse.json({ error: 'No theme found' }, { status: 404 });
  }

  const mainThemeNumericId = gidToId(mainGqlTheme.id);

  // Upsert theme record in DB
  let theme = await db.query.themes.findFirst({
    where: and(
      eq(schema.themes.storeId, store.id),
      eq(schema.themes.shopifyThemeId, mainThemeNumericId)
    ),
  });

  if (!theme) {
    const [newTheme] = await db
      .insert(schema.themes)
      .values({
        storeId: store.id,
        shopifyThemeId: mainThemeNumericId,
        name: mainGqlTheme.name,
        role: mainGqlTheme.role.toLowerCase(),
      })
      .returning();
    theme = newTheme;
  }

  // ---- Fetch file list via GraphQL ----
  const allFiles = await fetchThemeFileList(
    store.shopDomain,
    store.accessToken,
    mainGqlTheme.id
  );

  const sectionFilenames = allFiles
    .filter((f) => f.filename.startsWith('sections/') && f.filename.endsWith('.liquid'))
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .slice(0, 25) // Analyze up to 25 sections
    .map((f) => f.filename);

  const snippetsCount = allFiles.filter(
    (f) => f.filename.startsWith('snippets/') && f.filename.endsWith('.liquid')
  ).length;

  const hasTranslations = allFiles.some((f) => f.filename.startsWith('locales/'));

  // ---- Fetch section file contents in one GraphQL call ----
  const sectionFileContents = await fetchThemeFileContents(
    store.shopDomain,
    store.accessToken,
    mainGqlTheme.id,
    sectionFilenames
  );

  // ---- Analyze sections ----
  const analyzedSections: SectionAnalysisData[] = [];

  for (const file of sectionFileContents) {
    try {
      const content = file.body?.content;
      if (content) {
        const analysis = analyzeSection(file.filename, content);
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
      captureError(err as Error, {
        tags: { function: 'analyzeSection', assetKey: file.filename },
      });
    }
  }

  // ---- Fetch Core Web Vitals in parallel ----
  const coreWebVitals = await fetchCoreWebVitals(store.shopDomain);

  // ---- Prepare theme data ----
  const themeData: ThemeData = {
    totalSections: analyzedSections.length,
    snippetsCount,
    hasTranslations,
    sectionsAboveFold: Math.min(3, analyzedSections.length),
  };

  const scoreBreakdown = calculateThemeMetricsScore(
    coreWebVitals,
    analyzedSections,
    themeData,
    undefined
  );

  const planFeatures = PLANS[currentPlan].features;
  const showSectionDetails = planFeatures.sectionDetails;
  const maxRecommendations = planFeatures.recommendations;

  const sectionsWithRecs = analyzedSections.map((section) => {
    const performanceScore = 100 - (section.complexityScore || 0);
    const recs = generateRecommendations([section as any]).map((r) => r.title);
    return {
      name: section.name,
      type: section.type,
      category: section.type,
      performanceScore,
      performanceImpact: Math.round((100 - performanceScore) * 10),
      recommendations: recs,
      hasVideo: section.hasVideo,
      hasLazyLoading: section.hasLazyLoading,
      complexityScore: section.complexityScore,
    };
  });

  // ---- Save to database ----
  const [savedAnalysis] = await db
    .insert(schema.themeAnalyses)
    .values({
      storeId: store.id,
      themeId: mainThemeNumericId,
      themeName: mainGqlTheme.name,
      totalSections: analyzedSections.length,
      overallScore: scoreBreakdown.overall,
      scoreSource: coreWebVitals ? 'thememetrics' : 'thememetrics-estimated',
      lcpMs: coreWebVitals?.lcp ? Math.round(coreWebVitals.lcp) : null,
      clsScore: coreWebVitals?.cls?.toString() ?? null,
      tbtMs: coreWebVitals?.tbt ? Math.round(coreWebVitals.tbt) : null,
      fcpMs: coreWebVitals?.fcp ? Math.round(coreWebVitals.fcp) : null,
    })
    .returning();

  cacheScore(savedAnalysis.id, scoreBreakdown).catch(() => {});

  if (sectionsWithRecs.length > 0) {
    await db.insert(schema.sectionAnalyses).values(
      sectionsWithRecs.map((s) => ({
        analysisId: savedAnalysis.id,
        sectionName: s.name,
        sectionType: s.type,
        category: s.category,
        performanceScore: s.performanceScore,
        recommendations: s.recommendations,
      }))
    );
  }

  await db
    .update(schema.themes)
    .set({ analyzedAt: new Date() })
    .where(eq(schema.themes.id, theme.id));

  // Send analysis complete email async (non-blocking)
  (async () => {
    try {
      const [emailSub] = await db
        .select()
        .from(emailSubscriptions)
        .where(eq(emailSubscriptions.storeId, store.id));

      if (emailSub && emailSub.status === 'active') {
        const storeName = store.shopDomain.replace('.myshopify.com', '');
        const criticalCount = sectionsWithRecs.filter((s) => s.performanceScore < 50).length;
        const dashboardUrl = `https://thememetrics.de/dashboard?shop=${store.shopDomain}`;

        const html = analysisCompleteEmail({
          storeName,
          themeName: mainGqlTheme.name,
          score: scoreBreakdown.overall,
          criticalCount,
          dashboardUrl,
        });

        await sendEmail({
          to: emailSub.email,
          subject: `Analyse fertig: Score ${scoreBreakdown.overall} für ${mainGqlTheme.name} 📊`,
          html,
        });
      }
    } catch (emailError) {
      captureError(emailError as Error, {
        tags: { function: 'sendAnalysisCompleteEmail' },
      });
    }
  })();

  // Limit data based on plan
  const responseSections = sectionsWithRecs.map((s) => ({
    name: s.name,
    type: s.type,
    category: s.category,
    performanceScore: s.performanceScore,
    performanceImpact: showSectionDetails ? s.performanceImpact : 0,
    recommendations:
      maxRecommendations === -1
        ? s.recommendations
        : s.recommendations.slice(0, maxRecommendations),
    hasVideo: s.hasVideo,
    hasLazyLoading: s.hasLazyLoading,
  }));

  return NextResponse.json({
    theme: {
      id: theme.id,
      name: theme.name,
      role: theme.role,
      analyzedAt: new Date().toISOString(),
    },
    analysis: {
      id: savedAnalysis.id,
      totalSections: analyzedSections.length,
      sections: responseSections,
      highImpactCount: countProblematicSections(analyzedSections as any),
    },
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
    const response = await runAnalysis(request);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'themes/analyze', method: 'GET' } });
    return withCors(NextResponse.json({ error: 'Failed to analyze theme' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.shop && !isValidShopDomain(body.shop)) {
      return withCors(NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 }));
    }

    const response = await runAnalysis(request);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'themes/analyze', method: 'POST' } });
    return withCors(NextResponse.json({ error: 'Failed to analyze theme' }, { status: 500 }));
  }
}
