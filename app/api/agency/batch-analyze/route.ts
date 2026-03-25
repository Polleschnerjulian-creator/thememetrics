export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest, authErrorResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }
    const store = authResult.store;

    // Check if agency plan
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, store.id),
    });

    if (subscription?.plan !== 'agency') {
      return NextResponse.json({ error: 'Agency plan required' }, { status: 403 });
    }

    // Get agency
    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, store.id),
    });

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Get all workspaces for this agency
    const agencyWorkspaces = await db
      .select()
      .from(schema.workspaces)
      .where(
        and(
          eq(schema.workspaces.agencyId, agency.id),
          eq(schema.workspaces.isActive, true)
        )
      );

    if (agencyWorkspaces.length === 0) {
      return NextResponse.json({ 
        error: 'No workspaces found',
        message: 'Füge zuerst Workspaces hinzu, um Batch-Analysen durchzuführen.'
      }, { status: 400 });
    }

    // Start batch analysis
    const results: Array<{
      workspaceId: number;
      name: string;
      shopDomain: string;
      status: 'success' | 'error' | 'pending';
      score?: number;
      error?: string;
    }> = [];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thememetrics.de';

    // Analyze each workspace sequentially
    for (const workspace of agencyWorkspaces) {
      try {
        const analyzeResponse = await fetch(`${appUrl}/api/themes/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ shop: workspace.shopDomain }),
        });

        if (analyzeResponse.ok) {
          const data = await analyzeResponse.json();
          results.push({
            workspaceId: workspace.id,
            name: workspace.name,
            shopDomain: workspace.shopDomain,
            status: 'success',
            score: data.score?.overall || 0,
          });
        } else {
          const errorData = await analyzeResponse.json().catch(() => ({}));
          results.push({
            workspaceId: workspace.id,
            name: workspace.name,
            shopDomain: workspace.shopDomain,
            status: 'error',
            error: errorData.error || 'Analyse fehlgeschlagen',
          });
        }
      } catch (err) {
        results.push({
          workspaceId: workspace.id,
          name: workspace.name,
          shopDomain: workspace.shopDomain,
          status: 'error',
          error: 'Netzwerkfehler',
        });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `${successCount} von ${agencyWorkspaces.length} Analysen erfolgreich`,
      results,
      summary: {
        total: agencyWorkspaces.length,
        success: successCount,
        errors: errorCount,
        averageScore: successCount > 0 
          ? Math.round(results.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / successCount)
          : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  return NextResponse.json({
    message: 'Batch-Analysen werden synchron via POST ausgeführt.',
  });
}

export { OPTIONS } from '@/lib/auth';
