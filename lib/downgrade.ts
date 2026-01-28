/**
 * Downgrade Handling
 *
 * Handles graceful downgrade when a user switches to a lower plan.
 * Checks for resources over limit and provides warnings/actions.
 */

import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { PLANS, PlanId } from '@/lib/billing';

export interface DowngradeCheck {
  canDowngrade: boolean;
  warnings: string[];
  actions: {
    type: 'deactivate_workspaces' | 'deactivate_team_members' | 'lose_feature';
    count?: number;
    description: string;
  }[];
}

/**
 * Check what happens when downgrading from one plan to another.
 */
export async function checkDowngradeImpact(
  storeId: number,
  fromPlan: PlanId,
  toPlan: PlanId
): Promise<DowngradeCheck> {
  const result: DowngradeCheck = {
    canDowngrade: true,
    warnings: [],
    actions: [],
  };

  // Same plan = no impact
  if (fromPlan === toPlan) return result;

  const fromFeatures = PLANS[fromPlan].features;
  const toFeatures = PLANS[toPlan].features;

  // Check workspaces limit (Agency feature)
  if (fromFeatures.workspaces > toFeatures.workspaces) {
    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, storeId),
    });

    if (agency) {
      const workspaces = await db.query.workspaces.findMany({
        where: eq(schema.workspaces.agencyId, agency.id),
      });

      const activeWorkspaces = workspaces.filter(w => w.isActive);

      if (activeWorkspaces.length > toFeatures.workspaces) {
        const toDeactivate = activeWorkspaces.length - toFeatures.workspaces;
        result.warnings.push(
          `Du hast ${activeWorkspaces.length} aktive Workspaces, aber der ${PLANS[toPlan].name} Plan erlaubt nur ${toFeatures.workspaces}.`
        );
        result.actions.push({
          type: 'deactivate_workspaces',
          count: toDeactivate,
          description: `${toDeactivate} Workspace(s) werden deaktiviert`,
        });
      }
    }
  }

  // Check team members limit (Agency feature)
  if (fromFeatures.teamMembers > toFeatures.teamMembers) {
    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, storeId),
    });

    if (agency) {
      const teamMembers = await db.query.teamMembers.findMany({
        where: eq(schema.teamMembers.agencyId, agency.id),
      });

      const activeMembers = teamMembers.filter(m => m.inviteStatus === 'accepted');

      if (activeMembers.length > toFeatures.teamMembers) {
        const toDeactivate = activeMembers.length - toFeatures.teamMembers;
        result.warnings.push(
          `Du hast ${activeMembers.length} Team-Mitglieder, aber der ${PLANS[toPlan].name} Plan erlaubt nur ${toFeatures.teamMembers}.`
        );
        result.actions.push({
          type: 'deactivate_team_members',
          count: toDeactivate,
          description: `${toDeactivate} Team-Mitglied(er) verlieren den Zugang`,
        });
      }
    }
  }

  // Check feature losses
  const featureLosses: string[] = [];

  if (fromFeatures.pdfReport && !toFeatures.pdfReport) {
    featureLosses.push('PDF Reports');
  }
  if (fromFeatures.desktopPerformance && !toFeatures.desktopPerformance) {
    featureLosses.push('Desktop Performance Tests');
  }
  if (fromFeatures.codeFixes && !toFeatures.codeFixes) {
    featureLosses.push('Code Fixes');
  }
  if (fromFeatures.scoreSimulator && !toFeatures.scoreSimulator) {
    featureLosses.push('Score Simulator');
  }
  if (fromFeatures.competitorBenchmark && !toFeatures.competitorBenchmark) {
    featureLosses.push('Wettbewerber-Benchmarks');
  }
  if (fromFeatures.apiAccess && !toFeatures.apiAccess) {
    featureLosses.push('API Zugang');
  }
  if (fromFeatures.whiteLabel && !toFeatures.whiteLabel) {
    featureLosses.push('White-Label Branding');
  }

  if (featureLosses.length > 0) {
    result.actions.push({
      type: 'lose_feature',
      description: `Du verlierst: ${featureLosses.join(', ')}`,
    });
  }

  // Check monthly limit reductions
  if (toFeatures.themeAnalysisPerMonth !== -1 &&
      (fromFeatures.themeAnalysisPerMonth === -1 || fromFeatures.themeAnalysisPerMonth > toFeatures.themeAnalysisPerMonth)) {
    result.warnings.push(
      `Theme-Analysen werden auf ${toFeatures.themeAnalysisPerMonth}/Monat begrenzt`
    );
  }

  if (toFeatures.performanceTestsPerMonth !== -1 &&
      (fromFeatures.performanceTestsPerMonth === -1 || fromFeatures.performanceTestsPerMonth > toFeatures.performanceTestsPerMonth)) {
    result.warnings.push(
      `Performance-Tests werden auf ${toFeatures.performanceTestsPerMonth}/Monat begrenzt`
    );
  }

  return result;
}

/**
 * Execute downgrade actions (deactivate excess resources)
 */
export async function executeDowngrade(
  storeId: number,
  toPlan: PlanId
): Promise<{ success: boolean; actionsExecuted: string[] }> {
  const actionsExecuted: string[] = [];
  const toFeatures = PLANS[toPlan].features;

  try {
    // Get agency if exists
    const agency = await db.query.agencies.findFirst({
      where: eq(schema.agencies.ownerStoreId, storeId),
    });

    if (agency) {
      // Deactivate excess workspaces (keep most recent ones active)
      const workspaces = await db.query.workspaces.findMany({
        where: eq(schema.workspaces.agencyId, agency.id),
      });

      const activeWorkspaces = workspaces
        .filter(w => w.isActive)
        .sort((a, b) => {
          // Sort by updatedAt DESC (most recently used first)
          const aDate = a.updatedAt || a.createdAt || new Date(0);
          const bDate = b.updatedAt || b.createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });

      if (activeWorkspaces.length > toFeatures.workspaces) {
        const toDeactivate = activeWorkspaces.slice(toFeatures.workspaces);

        for (const ws of toDeactivate) {
          await db.update(schema.workspaces)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(schema.workspaces.id, ws.id));
        }

        actionsExecuted.push(`${toDeactivate.length} Workspace(s) deaktiviert`);
      }

      // Note: We don't delete team members, they just can't access anymore
      // The access check happens at query time based on plan limits
    }

    // Update subscription and store plan
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.storeId, storeId),
    });

    if (subscription) {
      await db.update(schema.subscriptions)
        .set({ plan: toPlan, updatedAt: new Date() })
        .where(eq(schema.subscriptions.id, subscription.id));
    }

    await db.update(schema.stores)
      .set({ plan: toPlan, updatedAt: new Date() })
      .where(eq(schema.stores.id, storeId));

    actionsExecuted.push(`Plan geändert zu ${PLANS[toPlan].name}`);

    return { success: true, actionsExecuted };
  } catch (error) {
    return { success: false, actionsExecuted };
  }
}

/**
 * Get a human-readable downgrade summary
 */
export function getDowngradeSummary(check: DowngradeCheck): string {
  if (check.warnings.length === 0 && check.actions.length === 0) {
    return 'Keine Einschränkungen beim Downgrade.';
  }

  const parts: string[] = [];

  if (check.warnings.length > 0) {
    parts.push('Hinweise: ' + check.warnings.join(' '));
  }

  if (check.actions.length > 0) {
    parts.push('Aktionen: ' + check.actions.map(a => a.description).join(', '));
  }

  return parts.join(' | ');
}
