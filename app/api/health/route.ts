export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 *
 * GET /api/health - Returns system health status
 * GET /api/health?detailed=true - Returns detailed metrics (requires secret)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHealthStatus, getAggregatedMetrics } from '@/lib/monitoring';
import { cacheHealthCheck } from '@/lib/cache';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Verify admin secret for detailed metrics
function verifySecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === process.env.HEALTH_CHECK_SECRET;
}

export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get('detailed') === 'true';

  // Basic health status - always available
  const healthStatus = getHealthStatus();

  // Check actual component health
  const [dbHealthy, cacheHealthy] = await Promise.all([
    checkDatabaseHealth(),
    cacheHealthCheck(),
  ]);

  healthStatus.components.database = dbHealthy;
  healthStatus.components.cache = cacheHealthy;

  // Update overall status based on component health
  if (!dbHealthy) {
    healthStatus.status = 'unhealthy';
  } else if (!cacheHealthy && healthStatus.status === 'healthy') {
    healthStatus.status = 'degraded';
  }

  // If not detailed, return simple status
  if (!detailed) {
    return NextResponse.json({
      status: healthStatus.status,
      timestamp: healthStatus.timestamp,
    });
  }

  // Detailed metrics require secret
  if (!verifySecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Return detailed health status
  const aggregated = getAggregatedMetrics(60);

  return NextResponse.json({
    ...healthStatus,
    aggregated,
  });
}

// Check database connectivity
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
