export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { scheduleLeadNurtureSequence } from '@/lib/email/service';
import { sendEmail } from '@/lib/email/resend';
import { captureError } from '@/lib/monitoring';
import { z } from 'zod';
import { cacheIncrement } from '@/lib/cache';

// Zod schemas for input validation
const leadPostSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').max(320),
  shopUrl: z.string().min(3, 'Ungültige Shop-URL').max(500),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
});

// PageSpeed Insights API (kostenlos, kein API Key nötig für basic usage)
const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// Rate limiting via Upstash Redis (works across serverless instances)
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per IP per minute

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:leads:${ip}`;
  const count = await cacheIncrement(key, 60); // 60 second TTL

  // If Redis is unavailable, allow the request (graceful degradation)
  if (count === null) {
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  if (count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - count };
}

function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

interface PageSpeedResult {
  score: number;
  lcp: number;
  fcp: number;
  cls: number;
  tbt: number;
  speedIndex: number;
  issues: string[];
  opportunities: { title: string; savings: string }[];
}

async function getPageSpeedData(url: string): Promise<PageSpeedResult | null> {
  try {
    // Clean and normalize URL
    let fullUrl = url.trim().toLowerCase();
    
    // Remove trailing slashes
    fullUrl = fullUrl.replace(/\/+$/, '');
    
    // Ensure URL has protocol
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }
    
    // If it's just a shop name without TLD, add .myshopify.com
    const urlWithoutProtocol = fullUrl.replace(/^https?:\/\//, '');
    if (!urlWithoutProtocol.includes('.')) {
      fullUrl = `https://${urlWithoutProtocol}.myshopify.com`;
    }

    const apiKey = process.env.PAGESPEED_API_KEY;
    const apiUrl = new URL(PAGESPEED_API);
    apiUrl.searchParams.set('url', fullUrl);
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');
    if (apiKey) {
      apiUrl.searchParams.set('key', apiKey);
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Try with www. prefix if it failed
      if (!fullUrl.includes('www.')) {
        const wwwUrl = fullUrl.replace('https://', 'https://www.');
        const retryApiUrl = new URL(PAGESPEED_API);
        retryApiUrl.searchParams.set('url', wwwUrl);
        retryApiUrl.searchParams.set('strategy', 'mobile');
        retryApiUrl.searchParams.set('category', 'performance');
        if (apiKey) {
          retryApiUrl.searchParams.set('key', apiKey);
        }

        const retryResponse = await fetch(retryApiUrl.toString());
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.lighthouseResult) {
            return extractPageSpeedData(retryData);
          }
        }
      }

      return null;
    }

    const data = await response.json();
    return extractPageSpeedData(data);
  } catch (error) {
    captureError(error as Error, { tags: { function: 'getPageSpeedData' } });
    return null;
  }
}

function extractPageSpeedData(data: any): PageSpeedResult | null {
  try {
    const lighthouse = data.lighthouseResult;
    if (!lighthouse) return null;

    const categories = lighthouse.categories;
    const audits = lighthouse.audits;

    // Extract score (0-100)
    const score = Math.round((categories?.performance?.score || 0) * 100);

    // Extract Core Web Vitals
    const lcp = audits?.['largest-contentful-paint']?.numericValue || 0;
    const fcp = audits?.['first-contentful-paint']?.numericValue || 0;
    const cls = audits?.['cumulative-layout-shift']?.numericValue || 0;
    const tbt = audits?.['total-blocking-time']?.numericValue || 0;
    const speedIndex = audits?.['speed-index']?.numericValue || 0;

    // Extract issues (failed audits)
    const issues: string[] = [];
    const opportunities: { title: string; savings: string }[] = [];

    // Check for common issues
    if (audits?.['render-blocking-resources']?.score < 1) {
      issues.push('Render-blockierende Ressourcen');
      const savings = audits['render-blocking-resources']?.numericValue;
      if (savings) {
        opportunities.push({ 
          title: 'Render-blockierende Ressourcen entfernen', 
          savings: `${Math.round(savings)}ms` 
        });
      }
    }

    if (audits?.['uses-optimized-images']?.score < 1) {
      issues.push('Bilder nicht optimiert');
      opportunities.push({ 
        title: 'Bilder optimieren', 
        savings: audits['uses-optimized-images']?.displayValue || 'Potenzial vorhanden' 
      });
    }

    if (audits?.['uses-webp-images']?.score < 1) {
      issues.push('Kein WebP/AVIF Format');
      opportunities.push({ 
        title: 'Moderne Bildformate nutzen', 
        savings: audits['uses-webp-images']?.displayValue || 'Potenzial vorhanden' 
      });
    }

    if (audits?.['offscreen-images']?.score < 1) {
      issues.push('Fehlendes Lazy Loading');
      opportunities.push({ 
        title: 'Lazy Loading für Bilder', 
        savings: audits['offscreen-images']?.displayValue || 'Potenzial vorhanden' 
      });
    }

    if (audits?.['unminified-css']?.score < 1) {
      issues.push('CSS nicht minifiziert');
    }

    if (audits?.['unminified-javascript']?.score < 1) {
      issues.push('JavaScript nicht minifiziert');
    }

    if (audits?.['unused-css-rules']?.score < 1) {
      issues.push('Unbenutztes CSS');
      opportunities.push({ 
        title: 'Unbenutztes CSS entfernen', 
        savings: audits['unused-css-rules']?.displayValue || 'Potenzial vorhanden' 
      });
    }

    if (audits?.['unused-javascript']?.score < 1) {
      issues.push('Unbenutztes JavaScript');
      opportunities.push({ 
        title: 'Unbenutztes JavaScript entfernen', 
        savings: audits['unused-javascript']?.displayValue || 'Potenzial vorhanden' 
      });
    }

    if (audits?.['third-party-summary']?.score < 1) {
      const thirdPartyTime = audits['third-party-summary']?.numericValue;
      if (thirdPartyTime && thirdPartyTime > 500) {
        issues.push('Langsame Third-Party Scripts');
      }
    }

    if (lcp > 2500) {
      issues.push('Langsamer LCP (Largest Contentful Paint)');
    }

    if (cls > 0.1) {
      issues.push('Hoher CLS (Layout Shift)');
    }

    if (tbt > 300) {
      issues.push('Hoher TBT (Total Blocking Time)');
    }

    return {
      score,
      lcp: Math.round(lcp),
      fcp: Math.round(fcp),
      cls: Math.round(cls * 1000) / 1000,
      tbt: Math.round(tbt),
      speedIndex: Math.round(speedIndex),
      issues: issues.slice(0, 5), // Top 5 issues
      opportunities: opportunities.slice(0, 3), // Top 3 opportunities
    };
  } catch (error) {
    captureError(error as Error, { tags: { function: 'extractPageSpeedData' } });
    return null;
  }
}

function calculateEstimatedRevenueLoss(score: number, monthlyRevenue: number = 50000): number {
  // Basierend auf Studien: 1 Sekunde Verzögerung = 7% weniger Conversions
  // Score < 50 = ~4 Sekunden Ladezeit
  // Score 50-70 = ~2-3 Sekunden
  // Score 70-90 = ~1-2 Sekunden
  // Score 90+ = optimal
  
  let conversionLossPercent = 0;
  
  if (score < 30) {
    conversionLossPercent = 25; // Sehr langsam
  } else if (score < 50) {
    conversionLossPercent = 18;
  } else if (score < 70) {
    conversionLossPercent = 10;
  } else if (score < 90) {
    conversionLossPercent = 4;
  } else {
    conversionLossPercent = 0;
  }
  
  return Math.round(monthlyRevenue * (conversionLossPercent / 100));
}

export async function POST(request: NextRequest) {
  // Rate limiting via Upstash Redis
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte eine Minute.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' }
      }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const parsed = leadPostSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Ungültige Eingabe';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, shopUrl, utm_source, utm_medium, utm_campaign } = parsed.data;

    // Check if email already exists
    let existingLead;
    try {
      existingLead = await db.query.emailLeads.findFirst({
        where: eq(schema.emailLeads.email, email.toLowerCase().trim()),
      });
    } catch (dbError) {
      captureError(dbError as Error, { tags: { route: 'leads', action: 'queryExistingLead' } });
      // Continue anyway - we'll try to insert
    }

    // Get PageSpeed data
    const pageSpeedData = await getPageSpeedData(shopUrl);
    
    // Save lead regardless of PageSpeed result
    try {
      if (existingLead) {
        await db.update(schema.emailLeads)
          .set({
            shopUrl: shopUrl.trim(),
            speedScore: pageSpeedData?.score || null,
            performanceData: pageSpeedData || null,
            updatedAt: new Date(),
          })
          .where(eq(schema.emailLeads.id, existingLead.id));
      } else {
        const [newLead] = await db.insert(schema.emailLeads).values({
          email: email.toLowerCase().trim(),
          shopUrl: shopUrl.trim(),
          source: 'speed-check',
          speedScore: pageSpeedData?.score || null,
          performanceData: pageSpeedData || null,
          utm_source,
          utm_medium,
          utm_campaign,
        }).returning();

        // Schedule lead nurture sequence for new leads
        if (newLead) {
          try {
            await scheduleLeadNurtureSequence(newLead.id, newLead.email);
          } catch (nurturError) {
            captureError(nurturError as Error, { tags: { route: 'leads', action: 'scheduleNurtureSequence' } });
          }
        }
      }
    } catch (dbError) {
      captureError(dbError as Error, { tags: { route: 'leads', action: 'insertUpdateLead' } });
      // Continue - we still want to show results if we have them
    }

    // If PageSpeed failed, return a helpful response
    if (!pageSpeedData) {
      return NextResponse.json({
        success: true,
        analysisAvailable: false,
        message: 'Wir konnten deinen Shop gerade nicht automatisch analysieren. Das kann passieren wenn der Shop noch nicht live ist oder die URL nicht stimmt. Wir haben dich aber auf unsere Liste gesetzt und melden uns mit Performance-Tipps!',
        tip: 'Für eine vollständige Analyse installiere die ThemeMetrics App direkt in deinem Shopify Store.',
      });
    }

    const estimatedLoss = calculateEstimatedRevenueLoss(pageSpeedData.score);

    // TODO: Trigger email sending via Loops/Resend
    // await sendSpeedCheckEmail(email, pageSpeedData, estimatedLoss);

    return NextResponse.json({
      success: true,
      analysisAvailable: true,
      report: {
        score: pageSpeedData.score,
        grade: pageSpeedData.score >= 90 ? 'A' : pageSpeedData.score >= 70 ? 'B' : pageSpeedData.score >= 50 ? 'C' : pageSpeedData.score >= 30 ? 'D' : 'F',
        lcp: pageSpeedData.lcp,
        fcp: pageSpeedData.fcp,
        cls: pageSpeedData.cls,
        tbt: pageSpeedData.tbt,
        topIssues: pageSpeedData.issues,
        opportunities: pageSpeedData.opportunities,
        estimatedMonthlyLoss: estimatedLoss,
      },
      message: 'Dein Speed Report wurde erstellt! Check deine E-Mails für den vollständigen Report.',
    });
  } catch (error) {
    captureError(error as Error, { tags: { route: 'leads', method: 'POST' } });
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' }, { status: 500 });
  }
}

export { OPTIONS } from '@/lib/auth';
