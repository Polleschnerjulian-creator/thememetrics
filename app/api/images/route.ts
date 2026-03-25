export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import {
  fetchThemes,
  fetchThemeFileList,
  fetchThemeFileContents,
  gidToId,
} from '@/lib/shopify';
import {
  analyzeImages,
  generateImageReport,
  SectionImageAnalysis,
} from '@/lib/image-optimizer';
import { captureError, measureAsync } from '@/lib/monitoring';
import { authenticateRequest, authErrorResponse, handleOptions, withCors } from '@/lib/auth';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

async function getOrCreateImageAnalysis(
  request: NextRequest,
  forceRefresh: boolean = false
): Promise<NextResponse> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const { store } = authResult;

  // Return cached analysis if fresh enough
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
            theme: { id: cachedAnalysis.themeId, name: cachedAnalysis.themeName },
            report: cachedAnalysis.report,
            analyzedAt: cachedAnalysis.analyzedAt,
            cached: true,
          });
        }
      }
    } catch {
      // Cache retrieval failed — run fresh analysis
    }
  }

  // Fetch themes via GraphQL
  const themes = await fetchThemes(store.shopDomain, store.accessToken);
  const activeTheme = themes.find((t) => t.role === 'MAIN') ?? themes[0];

  if (!activeTheme) {
    return NextResponse.json({ error: 'No active theme found' }, { status: 404 });
  }

  // Fetch file list
  const allFiles = await fetchThemeFileList(
    store.shopDomain,
    store.accessToken,
    activeTheme.id
  );

  // Section files (up to 30)
  const sectionFilenames = allFiles
    .filter((f) => f.filename.startsWith('sections/') && f.filename.endsWith('.liquid'))
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .slice(0, 30)
    .map((f) => f.filename);

  // Image-related snippet files (up to 10)
  const snippetFilenames = allFiles
    .filter(
      (f) =>
        f.filename.startsWith('snippets/') &&
        f.filename.endsWith('.liquid') &&
        (f.filename.toLowerCase().includes('image') ||
          f.filename.toLowerCase().includes('img') ||
          f.filename.toLowerCase().includes('media') ||
          f.filename.toLowerCase().includes('picture'))
    )
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .slice(0, 10)
    .map((f) => f.filename);

  const targetFilenames = [...sectionFilenames, ...snippetFilenames];

  // Batch fetch all file contents in a single GraphQL call
  const fileContents = await fetchThemeFileContents(
    store.shopDomain,
    store.accessToken,
    activeTheme.id,
    targetFilenames
  );

  const sectionResults: SectionImageAnalysis[] = [];

  for (const file of fileContents) {
    const content = file.body?.content;
    if (!content) continue;

    const isSnippet = file.filename.startsWith('snippets/');
    const displayName =
      file.filename
        .replace('sections/', '')
        .replace('snippets/', '')
        .replace('.liquid', '') + (isSnippet ? ' (snippet)' : '');

    const result = analyzeImages(displayName, content);

    // Only include snippets that actually have image issues
    if (!isSnippet || result.issues.length > 0 || result.imageCount > 0) {
      sectionResults.push(result);
    }
  }

  const report = generateImageReport(sectionResults);
  const now = new Date();
  const themeNumericId = gidToId(activeTheme.id);

  try {
    await db.insert(schema.imageAnalyses).values({
      storeId: store.id,
      themeId: themeNumericId,
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
    captureError(err as Error, { tags: { route: 'images', function: 'saveAnalysis' } });
  }

  return NextResponse.json({
    theme: { id: themeNumericId, name: activeTheme.name },
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
