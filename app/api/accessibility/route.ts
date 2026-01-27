export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createShopifyClient } from '@/lib/shopify';
import { 
  analyzeAccessibility, 
  generateAccessibilityReport,
  SectionAccessibility,
} from '@/lib/accessibility';
import { captureError, measureAsync } from '@/lib/monitoring';
import { authenticateRequest, authErrorResponse } from '@/lib/auth';

async function runAccessibilityCheck(request: NextRequest): Promise<NextResponse> {
  // Authenticate using session token or cookie fallback
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }
  
  const { store } = authResult;

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

  const sectionResults: SectionAccessibility[] = [];
  const analyzedSections: string[] = [];
  const failedSections: string[] = [];

  async function fetchWithRetry(key: string, retries = 2): Promise<string | null> {
    for (let i = 0; i <= retries; i++) {
      try {
        const { asset } = await client.get<any>(
          `/themes/${activeTheme.id}/assets.json?asset[key]=${encodeURIComponent(key)}`
        );
        if (asset?.value) return asset.value;
      } catch (err) {
        if (i === retries) {
          console.warn(`Failed to fetch ${key} after ${retries + 1} attempts`);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    return null;
  }

  const themeContent = await fetchWithRetry('layout/theme.liquid');
  if (themeContent) {
    const themeResult = analyzeAccessibility('theme.liquid (Layout)', themeContent);
    sectionResults.push(themeResult);
    analyzedSections.push('theme.liquid (Layout)');
  } else {
    failedSections.push('layout/theme.liquid');
  }

  for (const file of sectionFiles) {
    const content = await fetchWithRetry(file.key);
    
    if (content) {
      const sectionName = file.key.replace('sections/', '').replace('.liquid', '');
      const result = analyzeAccessibility(sectionName, content);
      sectionResults.push(result);
      analyzedSections.push(sectionName);
    } else {
      failedSections.push(file.key);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`Accessibility: Analyzed ${analyzedSections.length} sections, failed: ${failedSections.length}`);
  if (failedSections.length > 0) {
    console.log('Failed sections:', failedSections.join(', '));
  }

  const report = generateAccessibilityReport(sectionResults);

  return NextResponse.json({
    theme: {
      id: activeTheme.id,
      name: activeTheme.name,
    },
    report,
    analyzedAt: new Date().toISOString(),
    debug: {
      sectionsAnalyzed: analyzedSections.length,
      sectionsFailed: failedSections.length,
      sectionsList: analyzedSections,
      failedList: failedSections,
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    return await measureAsync('accessibility-check', () => runAccessibilityCheck(request));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'GET' } });
    return NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await measureAsync('accessibility-check-post', () => runAccessibilityCheck(request));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'POST' } });
    return NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 });
  }
}
