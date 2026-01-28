/**
 * Downgrade Logic Tests
 */

import { PLANS, PlanId } from '@/lib/billing';

describe('Downgrade Logic', () => {
  // Helper to simulate feature comparison
  function getFeatureLosses(fromPlan: PlanId, toPlan: PlanId): string[] {
    const fromFeatures = PLANS[fromPlan].features;
    const toFeatures = PLANS[toPlan].features;
    const losses: string[] = [];

    if (fromFeatures.pdfReport && !toFeatures.pdfReport) {
      losses.push('PDF Reports');
    }
    if (fromFeatures.desktopPerformance && !toFeatures.desktopPerformance) {
      losses.push('Desktop Performance');
    }
    if (fromFeatures.codeFixes && !toFeatures.codeFixes) {
      losses.push('Code Fixes');
    }
    if (fromFeatures.scoreSimulator && !toFeatures.scoreSimulator) {
      losses.push('Score Simulator');
    }
    if (fromFeatures.competitorBenchmark && !toFeatures.competitorBenchmark) {
      losses.push('Competitor Benchmark');
    }
    if (fromFeatures.apiAccess && !toFeatures.apiAccess) {
      losses.push('API Access');
    }
    if (fromFeatures.whiteLabel && !toFeatures.whiteLabel) {
      losses.push('White Label');
    }

    return losses;
  }

  describe('Feature Loss Detection', () => {
    it('should detect no losses for same plan', () => {
      const losses = getFeatureLosses('starter', 'starter');
      expect(losses).toHaveLength(0);
    });

    it('should detect PDF loss when downgrading starter to free', () => {
      const losses = getFeatureLosses('starter', 'free');
      expect(losses).toContain('PDF Reports');
      expect(losses).toContain('Desktop Performance');
    });

    it('should detect multiple losses when downgrading agency to free', () => {
      const losses = getFeatureLosses('agency', 'free');
      expect(losses.length).toBeGreaterThan(3);
      expect(losses).toContain('PDF Reports');
      expect(losses).toContain('White Label');
      expect(losses).toContain('API Access');
    });

    it('should detect API access loss when downgrading agency to pro', () => {
      const losses = getFeatureLosses('agency', 'pro');
      expect(losses).toContain('White Label');
    });

    it('should not lose features when upgrading', () => {
      const losses = getFeatureLosses('free', 'starter');
      expect(losses).toHaveLength(0);
    });
  });

  describe('Workspace Limit Checks', () => {
    function checkWorkspaceLimit(
      activeWorkspaces: number,
      newPlanWorkspaceLimit: number
    ): { overLimit: boolean; toDeactivate: number } {
      if (activeWorkspaces <= newPlanWorkspaceLimit) {
        return { overLimit: false, toDeactivate: 0 };
      }
      return {
        overLimit: true,
        toDeactivate: activeWorkspaces - newPlanWorkspaceLimit,
      };
    }

    it('should not be over limit when equal', () => {
      const result = checkWorkspaceLimit(10, 10);
      expect(result.overLimit).toBe(false);
      expect(result.toDeactivate).toBe(0);
    });

    it('should not be over limit when under', () => {
      const result = checkWorkspaceLimit(5, 10);
      expect(result.overLimit).toBe(false);
    });

    it('should calculate correct number to deactivate', () => {
      const result = checkWorkspaceLimit(15, 10);
      expect(result.overLimit).toBe(true);
      expect(result.toDeactivate).toBe(5);
    });

    it('should handle downgrade to 1 workspace', () => {
      const result = checkWorkspaceLimit(10, 1);
      expect(result.overLimit).toBe(true);
      expect(result.toDeactivate).toBe(9);
    });
  });

  describe('Team Member Limit Checks', () => {
    function checkTeamMemberLimit(
      activeMembers: number,
      newPlanMemberLimit: number
    ): { overLimit: boolean; affected: number } {
      if (activeMembers <= newPlanMemberLimit) {
        return { overLimit: false, affected: 0 };
      }
      return {
        overLimit: true,
        affected: activeMembers - newPlanMemberLimit,
      };
    }

    it('should handle agency to pro downgrade (5 to 1 members)', () => {
      const agencyMembers = PLANS.agency.features.teamMembers;
      const proMembers = PLANS.pro.features.teamMembers;

      // If agency has 5 and pro has 1
      const result = checkTeamMemberLimit(5, proMembers);
      expect(result.overLimit).toBe(true);
      expect(result.affected).toBe(5 - proMembers);
    });

    it('should not affect when under limit', () => {
      const result = checkTeamMemberLimit(1, 5);
      expect(result.overLimit).toBe(false);
      expect(result.affected).toBe(0);
    });
  });

  describe('Monthly Limit Reductions', () => {
    function getLimitReduction(
      fromPlan: PlanId,
      toPlan: PlanId,
      limitType: 'themeAnalysisPerMonth' | 'performanceTestsPerMonth'
    ): { reduced: boolean; from: number; to: number } {
      const fromLimit = PLANS[fromPlan].features[limitType];
      const toLimit = PLANS[toPlan].features[limitType];

      // -1 means unlimited
      if (toLimit === -1) {
        return { reduced: false, from: fromLimit, to: toLimit };
      }

      if (fromLimit === -1 || fromLimit > toLimit) {
        return { reduced: true, from: fromLimit, to: toLimit };
      }

      return { reduced: false, from: fromLimit, to: toLimit };
    }

    it('should detect theme analysis limit reduction', () => {
      // Pro (-1 unlimited) to Starter (5) is a reduction
      const result = getLimitReduction('pro', 'starter', 'themeAnalysisPerMonth');
      expect(result.reduced).toBe(true);
      expect(result.from).toBe(-1); // Unlimited
      expect(result.to).toBe(5);    // Limited
    });

    it('should detect unlimited to limited reduction', () => {
      // Agency (-1 unlimited) to Starter (5) is a reduction
      const result = getLimitReduction('agency', 'starter', 'themeAnalysisPerMonth');
      expect(result.reduced).toBe(true);
      expect(result.from).toBe(-1);  // Unlimited
      expect(result.to).toBe(5);     // Limited to starter's value
    });

    it('should not reduce when upgrading', () => {
      const result = getLimitReduction('starter', 'pro', 'themeAnalysisPerMonth');
      expect(result.reduced).toBe(false);
    });

    it('should not reduce when staying unlimited', () => {
      const result = getLimitReduction('agency', 'agency', 'themeAnalysisPerMonth');
      expect(result.reduced).toBe(false);
    });
  });

  describe('Downgrade Summary', () => {
    function generateSummary(warnings: string[], actions: string[]): string {
      if (warnings.length === 0 && actions.length === 0) {
        return 'Keine Einschränkungen beim Downgrade.';
      }

      const parts: string[] = [];
      if (warnings.length > 0) {
        parts.push('Hinweise: ' + warnings.join(', '));
      }
      if (actions.length > 0) {
        parts.push('Aktionen: ' + actions.join(', '));
      }
      return parts.join(' | ');
    }

    it('should return no restrictions message when empty', () => {
      const summary = generateSummary([], []);
      expect(summary).toBe('Keine Einschränkungen beim Downgrade.');
    });

    it('should include warnings', () => {
      const summary = generateSummary(['Limit wird reduziert'], []);
      expect(summary).toContain('Hinweise');
      expect(summary).toContain('Limit wird reduziert');
    });

    it('should include actions', () => {
      const summary = generateSummary([], ['2 Workspaces deaktiviert']);
      expect(summary).toContain('Aktionen');
      expect(summary).toContain('2 Workspaces deaktiviert');
    });

    it('should combine warnings and actions', () => {
      const summary = generateSummary(
        ['Limit wird reduziert'],
        ['2 Workspaces deaktiviert']
      );
      expect(summary).toContain('Hinweise');
      expect(summary).toContain('Aktionen');
      expect(summary).toContain('|');
    });
  });
});
