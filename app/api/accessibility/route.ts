export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createShopifyClient } from '@/lib/shopify';
import { 
  analyzeAccessibility, 
  generateAccessibilityReport,
  SectionAccessibility,
  AccessibilityReport 
} from '@/lib/accessibility';
import { isValidShopDomain, sanitizeShopDomain } from '@/lib/security';
import { captureError, measureAsync } from '@/lib/monitoring';

async function runAccessibilityCheck(shop?: string): Promise<NextResponse> {
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
    .sort((a: any, b: any) => a.key.localeCompare(b.key)) // Sort alphabetically
    .slice(0, 30); // Limit to 30 sections

  // Analyze each section with retry logic
  const sectionResults: SectionAccessibility[] = [];
  const analyzedSections: string[] = [];
  const failedSections: string[] = [];

  // Helper function to fetch with retry
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
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    return null;
  }

  // First, always fetch theme.liquid - this is critical
  const themeContent = await fetchWithRetry('layout/theme.liquid');
  if (themeContent) {
    const themeResult = analyzeAccessibility('theme.liquid (Layout)', themeContent);
    sectionResults.push(themeResult);
    analyzedSections.push('theme.liquid (Layout)');
  } else {
    failedSections.push('layout/theme.liquid');
  }

  // Fetch sections sequentially with small delay to avoid rate limiting
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
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Log for debugging
  console.log(`Accessibility: Analyzed ${analyzedSections.length} sections, failed: ${failedSections.length}`);
  if (failedSections.length > 0) {
    console.log('Failed sections:', failedSections.join(', '));
  }

  // Generate report
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
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop') || undefined;
    
    return await measureAsync('accessibility-check', () => runAccessibilityCheck(shop));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'GET' } });
    return NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.shop && !isValidShopDomain(body.shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }
    
    return await measureAsync('accessibility-check-post', () => runAccessibilityCheck(body.shop));
  } catch (error) {
    captureError(error as Error, { tags: { route: 'accessibility', method: 'POST' } });
    return NextResponse.json({ error: 'Failed to check accessibility' }, { status: 500 });
  }
}
