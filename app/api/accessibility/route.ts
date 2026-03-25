export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchThemes,
  fetchThemeFileList,
  fetchThemeFileContents,
  gidToId,
} from '@/lib/shopify';
import {
  analyzeAccessibility,
  generateAccessibilityReport,
  SectionAccessibility,
} from '@/lib/accessibility';
import { captureError, measureAsync } from '@/lib/monitoring';
import { authenticateRequest, authErrorResponse, handleOptions, withCors } from '@/lib/auth';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

async function runAccessibilityCheck(request: NextRequest): Promise<NextResponse> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  const { store } = authResult;

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

  // Select sections + the main layout file
  const targetFilenames = [
    'layout/theme.liquid',
    ...allFiles
      .filter((f) => f.filename.startsWith('sections/') && f.filename.endsWith('.liquid'))
      .sort((a, b) => a.filename.localeCompare(b.filename))
      .slice(0, 29) // +1 for layout = 30 total
      .map((f) => f.filename),
  ];

  // Batch fetch all file contents in a single GraphQL call
  const fileContents = await fetchThemeFileContents(
    store.shopDomain,
    store.accessToken,
    activeTheme.id,
    targetFilenames
  );

  const sectionResults: SectionAccessibility[] = [];
  const analyzedSections: string[] = [];
  const failedSections: string[] = [];

  for (const file of fileContents) {
    const content = file.body?.content;
    if (content) {
      const displayName =
        file.filename === 'layout/theme.liquid'
          ? 'theme.liquid (Layout)'
          : file.filename.replace('sections/', '').replace('.liquid', '');

      const result = analyzeAccessibility(displayName, content);
      sectionResults.push(result);
      analyzedSections.push(displayName);
    } else {
      failedSections.push(file.filename);
    }
  }

  // Note files that weren't returned at all
  for (const filename of targetFilenames) {
    if (!fileContents.find((f) => f.filename === filename)) {
      failedSections.push(filename);
    }
  }

  const report = generateAccessibilityReport(sectionResults);

  return NextResponse.json({
    theme: {
      id: gidToId(activeTheme.id),
      name: activeTheme.name,
    },
    report,
    analyzedAt: new Date().toISOString(),
    debug: {
      sectionsAnalyzed: analyzedSections.length,
      sectionsFailed: failedSections.length,
      sectionsList: analyzedSections,
      failedList: failedSections,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const response = await runAccessibilityCheck(request);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'GET' } });
    return withCors(NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await runAccessibilityCheck(request);
    return withCors(response);
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'POST' } });
    return withCors(NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 }));
  }
}
