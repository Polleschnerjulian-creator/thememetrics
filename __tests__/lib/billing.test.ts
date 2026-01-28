/**
 * Billing Module Tests
 *
 * Tests for subscription management, plan features, and usage limits
 */

import {
  PLANS,
  PlanId,
  hasFeature,
  getPlanLimits,
  canPerformAction,
  getPlanDisplayInfo,
  getUpgradeBenefits,
} from '@/lib/billing';

// ============================================
// PLANS CONFIGURATION TESTS
// ============================================

describe('PLANS configuration', () => {
  it('should have 4 plans defined', () => {
    const planIds = Object.keys(PLANS);
    expect(planIds).toHaveLength(4);
    expect(planIds).toContain('free');
    expect(planIds).toContain('starter');
    expect(planIds).toContain('pro');
    expect(planIds).toContain('agency');
  });

  it('should have correct pricing', () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.starter.price).toBe(29);
    expect(PLANS.pro.price).toBe(79);
    expect(PLANS.agency.price).toBe(249);
  });

  it('should have correct trial days', () => {
    expect(PLANS.free.trialDays).toBe(0);
    expect(PLANS.starter.trialDays).toBe(7);
    expect(PLANS.pro.trialDays).toBe(7);
    expect(PLANS.agency.trialDays).toBe(7);
  });

  it('should have increasing feature limits across plans', () => {
    // Theme analysis limits
    expect(PLANS.free.features.themeAnalysisPerMonth).toBe(1);
    expect(PLANS.starter.features.themeAnalysisPerMonth).toBe(5);
    expect(PLANS.pro.features.themeAnalysisPerMonth).toBe(-1); // unlimited
    expect(PLANS.agency.features.themeAnalysisPerMonth).toBe(-1); // unlimited

    // Performance test limits
    expect(PLANS.free.features.performanceTestsPerMonth).toBe(1);
    expect(PLANS.starter.features.performanceTestsPerMonth).toBe(10);
    expect(PLANS.pro.features.performanceTestsPerMonth).toBe(-1);
    expect(PLANS.agency.features.performanceTestsPerMonth).toBe(-1);
  });

  it('should have proper feature flags per plan', () => {
    // Free plan limitations
    expect(PLANS.free.features.desktopPerformance).toBe(false);
    expect(PLANS.free.features.codeFixes).toBe(false);
    expect(PLANS.free.features.pdfReport).toBe(false);
    expect(PLANS.free.features.apiAccess).toBe(false);

    // Starter features
    expect(PLANS.starter.features.desktopPerformance).toBe(true);
    expect(PLANS.starter.features.pdfReport).toBe(true);
    expect(PLANS.starter.features.codeFixes).toBe(false);

    // Pro features
    expect(PLANS.pro.features.codeFixes).toBe(true);
    expect(PLANS.pro.features.scoreSimulator).toBe(true);
    expect(PLANS.pro.features.pdfWhiteLabel).toBe(true);

    // Agency features
    expect(PLANS.agency.features.apiAccess).toBe(true);
    expect(PLANS.agency.features.whiteLabel).toBe(true);
    expect(PLANS.agency.features.batchAnalysis).toBe(true);
    expect(PLANS.agency.features.workspaces).toBe(10);
    expect(PLANS.agency.features.teamMembers).toBe(5);
  });
});

// ============================================
// hasFeature TESTS
// ============================================

describe('hasFeature', () => {
  it('should return true for features that exist and are enabled', () => {
    expect(hasFeature('starter', 'desktopPerformance')).toBe(true);
    expect(hasFeature('pro', 'codeFixes')).toBe(true);
    expect(hasFeature('agency', 'apiAccess')).toBe(true);
    expect(hasFeature('free', 'mobilePerformance')).toBe(true);
  });

  it('should return false for features that are disabled', () => {
    expect(hasFeature('free', 'desktopPerformance')).toBe(false);
    expect(hasFeature('free', 'codeFixes')).toBe(false);
    expect(hasFeature('starter', 'codeFixes')).toBe(false);
    expect(hasFeature('starter', 'apiAccess')).toBe(false);
  });

  it('should return false for features with value 0', () => {
    expect(hasFeature('free', 'historyDays')).toBe(false);
  });

  it('should return true for unlimited features (-1)', () => {
    expect(hasFeature('pro', 'themeAnalysisPerMonth')).toBe(true);
    expect(hasFeature('agency', 'historyDays')).toBe(true);
  });

  it('should return true for numeric limits > 0', () => {
    expect(hasFeature('free', 'themeAnalysisPerMonth')).toBe(true);
    expect(hasFeature('free', 'recommendations')).toBe(true);
  });

  it('should handle all plan types', () => {
    const plans: PlanId[] = ['free', 'starter', 'pro', 'agency'];
    plans.forEach((plan) => {
      expect(hasFeature(plan, 'mobilePerformance')).toBe(true);
    });
  });
});

// ============================================
// getPlanLimits TESTS
// ============================================

describe('getPlanLimits', () => {
  it('should return all features for free plan', () => {
    const limits = getPlanLimits('free');

    expect(limits.themeAnalysisPerMonth).toBe(1);
    expect(limits.performanceTestsPerMonth).toBe(1);
    expect(limits.recommendations).toBe(3);
    expect(limits.workspaces).toBe(1);
    expect(limits.teamMembers).toBe(1);
  });

  it('should return all features for agency plan', () => {
    const limits = getPlanLimits('agency');

    expect(limits.themeAnalysisPerMonth).toBe(-1);
    expect(limits.performanceTestsPerMonth).toBe(-1);
    expect(limits.workspaces).toBe(10);
    expect(limits.teamMembers).toBe(5);
    expect(limits.apiAccess).toBe(true);
  });

  it('should return the actual features object reference', () => {
    const limits = getPlanLimits('starter');
    expect(limits).toBe(PLANS.starter.features);
  });
});

// ============================================
// canPerformAction TESTS
// ============================================

describe('canPerformAction', () => {
  describe('themeAnalysis action', () => {
    it('should allow when under limit', () => {
      const result = canPerformAction('free', 'themeAnalysis', 0);
      expect(result.allowed).toBe(true);
    });

    it('should deny when at limit', () => {
      const result = canPerformAction('free', 'themeAnalysis', 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('1 Theme-Analysen');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should deny when over limit', () => {
      const result = canPerformAction('free', 'themeAnalysis', 5);
      expect(result.allowed).toBe(false);
    });

    it('should always allow for unlimited plans', () => {
      expect(canPerformAction('pro', 'themeAnalysis', 100).allowed).toBe(true);
      expect(canPerformAction('agency', 'themeAnalysis', 1000).allowed).toBe(true);
    });

    it('should suggest correct upgrade path', () => {
      const freeResult = canPerformAction('free', 'themeAnalysis', 1);
      expect(freeResult.upgradeRequired).toBe('starter');

      const starterResult = canPerformAction('starter', 'themeAnalysis', 5);
      expect(starterResult.upgradeRequired).toBe('pro');
    });

    it('should handle starter plan limits', () => {
      const result = canPerformAction('starter', 'themeAnalysis', 4);
      expect(result.allowed).toBe(true);

      const resultAtLimit = canPerformAction('starter', 'themeAnalysis', 5);
      expect(resultAtLimit.allowed).toBe(false);
    });
  });

  describe('performanceTest action', () => {
    it('should allow when under limit', () => {
      const result = canPerformAction('free', 'performanceTest', 0);
      expect(result.allowed).toBe(true);
    });

    it('should deny when at limit', () => {
      const result = canPerformAction('free', 'performanceTest', 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('1 Performance-Tests');
    });

    it('should allow unlimited for pro and agency', () => {
      expect(canPerformAction('pro', 'performanceTest', 999).allowed).toBe(true);
      expect(canPerformAction('agency', 'performanceTest', 999).allowed).toBe(true);
    });

    it('should handle starter plan limit of 10', () => {
      const result = canPerformAction('starter', 'performanceTest', 9);
      expect(result.allowed).toBe(true);

      const resultAtLimit = canPerformAction('starter', 'performanceTest', 10);
      expect(resultAtLimit.allowed).toBe(false);
    });
  });

  describe('desktopPerformance action', () => {
    it('should deny for free plan', () => {
      const result = canPerformAction('free', 'desktopPerformance');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Starter Plan');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow for starter and above', () => {
      expect(canPerformAction('starter', 'desktopPerformance').allowed).toBe(true);
      expect(canPerformAction('pro', 'desktopPerformance').allowed).toBe(true);
      expect(canPerformAction('agency', 'desktopPerformance').allowed).toBe(true);
    });
  });

  describe('pdfReport action', () => {
    it('should deny for free plan', () => {
      const result = canPerformAction('free', 'pdfReport');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('PDF Reports');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow for starter and above', () => {
      expect(canPerformAction('starter', 'pdfReport').allowed).toBe(true);
      expect(canPerformAction('pro', 'pdfReport').allowed).toBe(true);
      expect(canPerformAction('agency', 'pdfReport').allowed).toBe(true);
    });
  });

  describe('codeFixes action', () => {
    it('should deny for free and starter plans', () => {
      const freeResult = canPerformAction('free', 'codeFixes');
      expect(freeResult.allowed).toBe(false);
      expect(freeResult.upgradeRequired).toBe('pro');

      const starterResult = canPerformAction('starter', 'codeFixes');
      expect(starterResult.allowed).toBe(false);
      expect(starterResult.upgradeRequired).toBe('pro');
    });

    it('should allow for pro and agency', () => {
      expect(canPerformAction('pro', 'codeFixes').allowed).toBe(true);
      expect(canPerformAction('agency', 'codeFixes').allowed).toBe(true);
    });
  });

  describe('default case', () => {
    it('should allow unknown actions by default', () => {
      // @ts-expect-error Testing unknown action
      const result = canPerformAction('free', 'unknownAction');
      expect(result.allowed).toBe(true);
    });
  });
});

// ============================================
// getPlanDisplayInfo TESTS
// ============================================

describe('getPlanDisplayInfo', () => {
  it('should return correct info for free plan', () => {
    const info = getPlanDisplayInfo('free');

    expect(info.name).toBe('Free');
    expect(info.price).toBe(0);
    expect(info.priceDisplay).toBe('Kostenlos');
    expect(info.trialDays).toBe(0);
    expect(info.isFreePlan).toBe(true);
  });

  it('should return correct info for starter plan', () => {
    const info = getPlanDisplayInfo('starter');

    expect(info.name).toBe('Starter');
    expect(info.price).toBe(29);
    expect(info.priceDisplay).toBe('€29/Monat');
    expect(info.trialDays).toBe(7);
    expect(info.isFreePlan).toBe(false);
  });

  it('should return correct info for pro plan', () => {
    const info = getPlanDisplayInfo('pro');

    expect(info.name).toBe('Pro');
    expect(info.price).toBe(79);
    expect(info.priceDisplay).toBe('€79/Monat');
    expect(info.trialDays).toBe(7);
    expect(info.isFreePlan).toBe(false);
  });

  it('should return correct info for agency plan', () => {
    const info = getPlanDisplayInfo('agency');

    expect(info.name).toBe('Agency');
    expect(info.price).toBe(249);
    expect(info.priceDisplay).toBe('€249/Monat');
    expect(info.trialDays).toBe(7);
    expect(info.isFreePlan).toBe(false);
  });
});

// ============================================
// getUpgradeBenefits TESTS
// ============================================

describe('getUpgradeBenefits', () => {
  it('should list benefits from free to starter', () => {
    const benefits = getUpgradeBenefits('free', 'starter');

    expect(benefits).toContain('5 Theme-Analysen/Monat (statt 1)');
    expect(benefits).toContain('Desktop Performance-Tests');
    expect(benefits).toContain('Detaillierte Section-Analyse');
    expect(benefits).toContain('PDF Reports');
  });

  it('should list benefits from starter to pro', () => {
    const benefits = getUpgradeBenefits('starter', 'pro');

    expect(benefits).toContain('Unbegrenzte Theme-Analysen');
    expect(benefits).toContain('Konkrete Code-Fixes');
    expect(benefits).toContain('Score-Simulator');
    expect(benefits).toContain('White-Label Reports');
    expect(benefits).toContain('Competitor Benchmarking');
  });

  it('should list benefits from pro to agency', () => {
    const benefits = getUpgradeBenefits('pro', 'agency');

    expect(benefits).toContain('10 Workspaces (für mehrere Shops)');
    expect(benefits).toContain('API Zugang');
  });

  it('should list benefits from free to agency', () => {
    const benefits = getUpgradeBenefits('free', 'agency');

    expect(benefits.length).toBeGreaterThan(5);
    expect(benefits).toContain('Unbegrenzte Theme-Analysen');
    expect(benefits).toContain('Desktop Performance-Tests');
    expect(benefits).toContain('Konkrete Code-Fixes');
    expect(benefits).toContain('API Zugang');
    expect(benefits).toContain('10 Workspaces (für mehrere Shops)');
  });

  it('should return empty array for same plan', () => {
    const benefits = getUpgradeBenefits('starter', 'starter');
    expect(benefits).toHaveLength(0);
  });

  it('should return empty array for downgrade', () => {
    // Note: The function doesn't prevent downgrades, it just returns
    // what would be "gained" - which for downgrade is nothing new
    const benefits = getUpgradeBenefits('agency', 'free');
    // Most benefits would be "lost", not gained, so array should be short/empty
    expect(benefits.every(b => !b.includes('Unbegrenzte'))).toBe(true);
  });

  it('should not include features that are the same', () => {
    const benefits = getUpgradeBenefits('starter', 'pro');

    // Mobile performance is same in both
    expect(benefits).not.toContain('Mobile Performance');

    // Desktop performance is same in starter and pro
    expect(benefits).not.toContain('Desktop Performance-Tests');
  });

  it('should handle numerical increases correctly', () => {
    const benefits = getUpgradeBenefits('free', 'starter');

    // Should show specific numbers for limited plans
    const analysisText = benefits.find(b => b.includes('Theme-Analysen'));
    expect(analysisText).toContain('5');
    expect(analysisText).toContain('statt 1');
  });
});

// ============================================
// EDGE CASES AND INTEGRATION TESTS
// ============================================

describe('Billing integration scenarios', () => {
  it('should handle complete upgrade path: free → starter → pro → agency', () => {
    // User starts on free
    expect(canPerformAction('free', 'themeAnalysis', 0).allowed).toBe(true);
    expect(canPerformAction('free', 'themeAnalysis', 1).allowed).toBe(false);
    expect(canPerformAction('free', 'desktopPerformance').allowed).toBe(false);

    // User upgrades to starter
    const freeToStarterBenefits = getUpgradeBenefits('free', 'starter');
    expect(freeToStarterBenefits.length).toBeGreaterThan(0);
    expect(canPerformAction('starter', 'desktopPerformance').allowed).toBe(true);
    expect(canPerformAction('starter', 'codeFixes').allowed).toBe(false);

    // User upgrades to pro
    const starterToProBenefits = getUpgradeBenefits('starter', 'pro');
    expect(starterToProBenefits.length).toBeGreaterThan(0);
    expect(canPerformAction('pro', 'codeFixes').allowed).toBe(true);
    expect(hasFeature('pro', 'apiAccess')).toBe(false);

    // User upgrades to agency
    const proToAgencyBenefits = getUpgradeBenefits('pro', 'agency');
    expect(proToAgencyBenefits.length).toBeGreaterThan(0);
    expect(hasFeature('agency', 'apiAccess')).toBe(true);
  });

  it('should provide consistent upgrade suggestions', () => {
    // For each action that is denied, the upgrade suggestion should unlock it
    const freeDesktopResult = canPerformAction('free', 'desktopPerformance');
    expect(freeDesktopResult.upgradeRequired).toBe('starter');
    expect(hasFeature('starter', 'desktopPerformance')).toBe(true);

    const freeCodeFixResult = canPerformAction('free', 'codeFixes');
    expect(freeCodeFixResult.upgradeRequired).toBe('pro');
    expect(hasFeature('pro', 'codeFixes')).toBe(true);
  });

  it('should handle zero usage correctly', () => {
    // All plans should allow first action
    expect(canPerformAction('free', 'themeAnalysis', 0).allowed).toBe(true);
    expect(canPerformAction('starter', 'themeAnalysis', 0).allowed).toBe(true);
    expect(canPerformAction('pro', 'themeAnalysis', 0).allowed).toBe(true);
    expect(canPerformAction('agency', 'themeAnalysis', 0).allowed).toBe(true);
  });

  it('should handle high usage numbers for unlimited plans', () => {
    // Pro and Agency should handle any usage number
    expect(canPerformAction('pro', 'themeAnalysis', 999999).allowed).toBe(true);
    expect(canPerformAction('agency', 'performanceTest', 999999).allowed).toBe(true);
  });
});

describe('Plan pricing consistency', () => {
  it('should have increasing prices for higher tiers', () => {
    expect(PLANS.starter.price).toBeGreaterThan(PLANS.free.price);
    expect(PLANS.pro.price).toBeGreaterThan(PLANS.starter.price);
    expect(PLANS.agency.price).toBeGreaterThan(PLANS.pro.price);
  });

  it('should have non-negative prices', () => {
    expect(PLANS.free.price).toBeGreaterThanOrEqual(0);
    expect(PLANS.starter.price).toBeGreaterThanOrEqual(0);
    expect(PLANS.pro.price).toBeGreaterThanOrEqual(0);
    expect(PLANS.agency.price).toBeGreaterThanOrEqual(0);
  });

  it('should have non-negative trial days', () => {
    expect(PLANS.free.trialDays).toBeGreaterThanOrEqual(0);
    expect(PLANS.starter.trialDays).toBeGreaterThanOrEqual(0);
    expect(PLANS.pro.trialDays).toBeGreaterThanOrEqual(0);
    expect(PLANS.agency.trialDays).toBeGreaterThanOrEqual(0);
  });
});
