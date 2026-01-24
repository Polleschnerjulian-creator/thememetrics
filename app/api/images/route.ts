export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { createShopifyClient } from '@/lib/shopify';
import { 
  analyzeImages, 
  generateImageReport,
  SectionImageAnalysis,
} from '@/lib/image-optimizer';
import { isValidShopDomain, sanitizeShopDomain } from '@/lib/security';
import { captureError, measureAsync } from '@/lib/monitoring';

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

async function getOrCreateImageAnalysis(shop: string, forceRefresh: boolean = false): Promise<NextResponse> {
  const cookieStore = await cookies();
  const shopSession = shop || cookieStore.get('shop_session')?.value;

  // Validate shop domain
  if (!shopSession || !isValidShopDomain(shopSession)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sanitizedShop = sanitizeShopDomain(shopSession);
  if (!sanitizedShop) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }

  const store = await db.query.stores.findFirst({
    where: eq(schema.stores.shopDomain, sanitizedShop),
  });

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Check for cached analysis (unless force refresh)
  if (!forceRefresh) {
    try {
      const cachedAnalysis = await db.query.imageAnalyses.findFirst({
        where: eq(schema.imageAnalyses.storeId, store.id),
        orderBy: desc(schema.imageAnalyses.analyzedAt),
      });

      if (cachedAnalysis) {
        const cacheAge = Date.now() - new Date(cachedAnalysis.analyzedAt!).getTime();
        if (cacheAge < CACHE_DURATION_MS) {
          return NextResponse.json({
            theme: {
              id: cachedAnalysis.themeId,
              name: cachedAnalysis.themeName,
            },
            report: cachedAnalysis.report,
            analyzedAt: cachedAnalysis.analyzedAt,
            cached: true,
          });
        }
      }
    } catch (err) {
      // Table might not exist yet, continue with fresh analysis
      console.log('Image analysis cache not available, running fresh analysis');
    }
  }

  // Run fresh analysis
  const client = createShopifyClient(store.shopDomain, store.accessToken);

  // Get active theme
  const { themes } = await client.get<any>('/themes.json');
  const activeTheme = themes.find((t: any) => t.role === 'main');

  if (!activeTheme) {
    return NextResponse.json({ error: 'No active theme found' }, { status: 404 });
  }

  // Get all section files - sort alphabetically for consistent results
  const { assets } = await client.get<any>(`/themes/${activeTheme.id}/assets.json`);
  const sectionFiles = assets
    .filter((a: any) => a.key.startsWith('sections/') && a.key.endsWith('.liquid'))
    .sort((a: any, b: any) => a.key.localeCompare(b.key))
    .slice(0, 30);

  // Helper function to fetch with retry
  async function fetchWithRetry(key: string, retries = 2): Promise<string | null> {
    for (let i = 0; i <= retries; i++) {
      try {
        const { asset } = await client.get<any>(
          `/themes/${activeTheme.id}/assets.json?asset[key]=${encodeURIComponent(key)}`
        );
        if (asset?.value) return asset.value;
      } catch (err) {
        if (i === retries) return null;
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    return null;
  }

  // Analyze each section
  const sectionResults: SectionImageAnalysis[] = [];

  for (const file of sectionFiles) {
    const content = await fetchWithRetry(file.key);
    if (content) {
      const sectionName = file.key.replace('sections/', '').replace('.liquid', '');
      const result = analyzeImages(sectionName, content);
      sectionResults.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Also check snippets for image-related code
  const snippetFiles = assets
    .filter((a: any) => a.key.startsWith('snippets/') && a.key.endsWith('.liquid'))
    .filter((a: any) => 
      a.key.toLowerCase().includes('image') || 
      a.key.toLowerCase().includes('img') ||
      a.key.toLowerCase().includes('media') ||
      a.key.toLowerCase().includes('picture')
    )
    .sort((a: any, b: any) => a.key.localeCompare(b.key))
    .slice(0, 10);

  for (const file of snippetFiles) {
    const content = await fetchWithRetry(file.key);
    if (content) {
      const snippetName = file.key.replace('snippets/', '').replace('.liquid', '') + ' (snippet)';
      const result = analyzeImages(snippetName, content);
      if (result.issues.length > 0 || result.imageCount > 0) {
        sectionResults.push(result);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Generate report
  const report = generateImageReport(sectionResults);
  const now = new Date();

  // Save to database
  try {
    await db.insert(schema.imageAnalyses).values({
      storeId: store.id,
      themeId: String(activeTheme.id),
      themeName: activeTheme.name,
      score: report.score,
      totalImages: report.totalImages,
      issuesCount: report.issuesCount,
      potentialSavings: report.potentialSavings,
      potentialSavingsPercent: report.potentialSavingsPercent,
      estimatedTimeImprovement: String(report.estimatedTimeImprovement),
      criticalCount: report.criticalCount,
      highCount: report.highCount,
      mediumCount: report.mediumCount,
      lowCount: report.lowCount,
      report: report,
      analyzedAt: now,
    });
  } catch (err) {
    console.error('Failed to save image analysis:', err);
    // Continue anyway - we still have the report
  }

  return NextResponse.json({
    theme: {
      id: activeTheme.id,
      name: activeTheme.name,
    },
    report,
    analyzedAt: now.toISOString(),
    cached: false,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop') || undefined;
    const refresh = searchParams.get('refresh') === 'true';
    
    return await measureAsync('image-analysis', () => 
      getOrCreateImageAnalysis(shop || '', refresh)
    );
  } catch (error) {
    captureError(error as Error, { tags: { route: 'images', method: 'GET' } });
    return NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.shop && !isValidShopDomain(body.shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }
    
    return await measureAsync('image-analysis-post', () => 
      getOrCreateImageAnalysis(body.shop || '', true)
    );
  } catch (error) {
    captureError(error as Error, { tags: { route: 'images', method: 'POST' } });
    return NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 });
  }
}
