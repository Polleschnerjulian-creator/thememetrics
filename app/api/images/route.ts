export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { createShopifyClient } from '@/lib/shopify';
import { 
  analyzeImages, 
  generateImageReport,
  SectionImageAnalysis,
} from '@/lib/image-optimizer';
import { captureError, measureAsync } from '@/lib/monitoring';
import { authenticateRequest, authErrorResponse, handleOptions, withCors } from '@/lib/auth';

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

async function getOrCreateImageAnalysis(request: NextRequest, forceRefresh: boolean = false): Promise<NextResponse> {
  // Authenticate using session token or cookie fallback
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }
  
  const { store } = authResult;

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
      console.log('Image analysis cache not available, running fresh analysis');
    }
  }

  // Run fresh analysis
  const client = createShopifyClient(store.shopDomain, store.accessToken);

  const { themes } = await client.get<any>('/themes.json');
  const activeTheme = themes.find((t: any) => t.role === 'main');

  if (!activeTheme) {
    return NextResponse.json({ error: 'No active theme found' }, { status: 404 });
  }

  const { assets } = await client.get<any>(`/themes/${activeTheme.id}/assets.json`);
  const sectionFiles = assets
    .filter((a: any) => a.key.startsWith('sections/') && a.key.endsWith('.liquid'))
    .sort((a: any, b: any) => a.key.localeCompare(b.key))
    .slice(0, 30);

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

  const report = generateImageReport(sectionResults);
  const now = new Date();

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
    const refresh = searchParams.get('refresh') === 'true';
    
    const response = await getOrCreateImageAnalysis(request, refresh);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'images', method: 'GET' } });
    return withCors(NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await getOrCreateImageAnalysis(request, true);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'images', method: 'POST' } });
    return withCors(NextResponse.json({ error: 'Failed to analyze images' }, { status: 500 }));
  }
}
