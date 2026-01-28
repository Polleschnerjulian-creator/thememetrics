/**
 * Atomic Usage Tracking
 *
 * Uses PostgreSQL's ON CONFLICT for race-condition-free usage counting.
 * Requires the unique index: idx_usage_store_month_unique(store_id, month)
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { canPerformAction, PlanId, PLANS } from '@/lib/billing';

// Get current month in format '2026-01'
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Actions that have monthly limits (count-based)
export type UsageAction = 'themeAnalysis' | 'performanceTest';

// Map action to column name
const ACTION_COLUMNS: Record<UsageAction, string> = {
  themeAnalysis: 'theme_analyses_count',
  performanceTest: 'performance_tests_count',
};

// Map action to plan limit key
const ACTION_LIMITS: Record<UsageAction, 'themeAnalysisPerMonth' | 'performanceTestsPerMonth'> = {
  themeAnalysis: 'themeAnalysisPerMonth',
  performanceTest: 'performanceTestsPerMonth',
};

// Get limit for an action based on plan
function getActionLimit(planId: PlanId, action: UsageAction): number {
  const limitKey = ACTION_LIMITS[action];
  return PLANS[planId].features[limitKey];
}

interface UsageResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  error?: string;
}

/**
 * Atomically check and increment usage for a specific action.
 * Uses ON CONFLICT to prevent race conditions.
 *
 * @param storeId - The store ID
 * @param planId - The current plan (free, starter, pro, agency)
 * @param action - The action type to track
 * @returns Whether the action is allowed and the current count
 */
export async function checkAndIncrementUsage(
  storeId: number,
  planId: PlanId,
  action: UsageAction
): Promise<UsageResult> {
  const currentMonth = getCurrentMonth();
  const column = ACTION_COLUMNS[action];

  // First, check the current count without incrementing
  const checkResult = await db.execute<{ count: number }>(sql`
    SELECT COALESCE(${sql.raw(column)}, 0) as count
    FROM usage_tracking
    WHERE store_id = ${storeId} AND month = ${currentMonth}
  `);

  const currentCount = checkResult.rows[0]?.count ?? 0;
  const limit = getActionLimit(planId, action);

  // Check if action is allowed
  const check = canPerformAction(planId, action, currentCount);

  if (!check.allowed) {
    return {
      allowed: false,
      currentCount,
      limit,
      error: check.reason || 'Monatliches Limit erreicht',
    };
  }

  // Atomically increment the counter using UPSERT
  const result = await db.execute<{ new_count: number }>(sql`
    INSERT INTO usage_tracking (store_id, month, ${sql.raw(column)}, created_at, updated_at)
    VALUES (${storeId}, ${currentMonth}, 1, NOW(), NOW())
    ON CONFLICT (store_id, month)
    DO UPDATE SET
      ${sql.raw(column)} = COALESCE(usage_tracking.${sql.raw(column)}, 0) + 1,
      updated_at = NOW()
    RETURNING ${sql.raw(column)} as new_count
  `);

  const newCount = result.rows[0]?.new_count ?? 1;

  // Double-check the limit after increment (belt and suspenders)
  const postCheck = canPerformAction(planId, action, newCount - 1);

  return {
    allowed: postCheck.allowed,
    currentCount: newCount,
    limit,
  };
}

/**
 * Get current usage for a store without incrementing.
 */
export async function getCurrentUsage(storeId: number): Promise<{
  themeAnalyses: number;
  performanceTests: number;
  pdfReports: number;
  month: string;
}> {
  const currentMonth = getCurrentMonth();

  const result = await db.execute<{
    theme_analyses_count: number;
    performance_tests_count: number;
    pdf_reports_count: number;
  }>(sql`
    SELECT
      COALESCE(theme_analyses_count, 0) as theme_analyses_count,
      COALESCE(performance_tests_count, 0) as performance_tests_count,
      COALESCE(pdf_reports_count, 0) as pdf_reports_count
    FROM usage_tracking
    WHERE store_id = ${storeId} AND month = ${currentMonth}
  `);

  const row = result.rows[0];

  return {
    themeAnalyses: row?.theme_analyses_count ?? 0,
    performanceTests: row?.performance_tests_count ?? 0,
    pdfReports: row?.pdf_reports_count ?? 0,
    month: currentMonth,
  };
}

/**
 * Reset usage for a store (admin function).
 */
export async function resetUsage(storeId: number, month?: string): Promise<void> {
  const targetMonth = month || getCurrentMonth();

  await db.execute(sql`
    UPDATE usage_tracking
    SET
      theme_analyses_count = 0,
      performance_tests_count = 0,
      pdf_reports_count = 0,
      updated_at = NOW()
    WHERE store_id = ${storeId} AND month = ${targetMonth}
  `);
}
