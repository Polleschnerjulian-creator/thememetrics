/**
 * Billing Module Tests
 *
 * Comprehensive tests for subscription management, plan features, usage limits,
 * and Shopify billing API interactions.
 *
 * All functions are imported from the REAL lib/billing module.
 */

// Mock external dependencies BEFORE importing the module under test
jest.mock('@/lib/shopify', () => ({
  createShopifyClient: jest.fn(),
}));

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}));

import {
  PLANS,
  PlanId,
  hasFeature,
  getPlanLimits,
  canPerformAction,
  getPlanDisplayInfo,
  getUpgradeBenefits,
  createSubscription,
  activateSubscription,
  getSubscriptionStatus,
  cancelSubscription,
} from '@/lib/billing';
import { createShopifyClient } from '@/lib/shopify';
import { captureError } from '@/lib/monitoring';

const mockCreateShopifyClient = createShopifyClient as jest.MockedFunction<typeof createShopifyClient>;
const mockCaptureError = captureError as jest.MockedFunction<typeof captureError>;

// ============================================
// PLANS CONSTANT — Structure & Values
// ============================================

describe('PLANS constant', () => {
  it('should contain exactly 4 plans: free, starter, pro, agency', () => {
    const planIds = Object.keys(PLANS);
    expect(planIds).toHaveLength(4);
    expect(planIds).toEqual(expect.arrayContaining(['free', 'starter', 'pro', 'agency']));
  });

  it('should have correct id fields matching the key', () => {
    expect(PLANS.free.id).toBe('free');
    expect(PLANS.starter.id).toBe('starter');
    expect(PLANS.pro.id).toBe('pro');
    expect(PLANS.agency.id).toBe('agency');
  });

  it('should have correct display names', () => {
    expect(PLANS.free.name).toBe('Free');
    expect(PLANS.starter.name).toBe('Starter');
    expect(PLANS.pro.name).toBe('Pro');
    expect(PLANS.agency.name).toBe('Agency');
  });

  it('should have correct and strictly increasing prices', () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.starter.price).toBe(29);
    expect(PLANS.pro.price).toBe(79);
    expect(PLANS.agency.price).toBe(249);

    expect(PLANS.starter.price).toBeGreaterThan(PLANS.free.price);
    expect(PLANS.pro.price).toBeGreaterThan(PLANS.starter.price);
    expect(PLANS.agency.price).toBeGreaterThan(PLANS.pro.price);
  });

  it('should have no trial for free, 7 days for paid plans', () => {
    expect(PLANS.free.trialDays).toBe(0);
    expect(PLANS.starter.trialDays).toBe(7);
    expect(PLANS.pro.trialDays).toBe(7);
    expect(PLANS.agency.trialDays).toBe(7);
  });

  it('should have increasing theme analysis limits', () => {
    expect(PLANS.free.features.themeAnalysisPerMonth).toBe(1);
    expect(PLANS.starter.features.themeAnalysisPerMonth).toBe(5);
    expect(PLANS.pro.features.themeAnalysisPerMonth).toBe(-1);
    expect(PLANS.agency.features.themeAnalysisPerMonth).toBe(-1);
  });

  it('should have increasing performance test limits', () => {
    expect(PLANS.free.features.performanceTestsPerMonth).toBe(1);
    expect(PLANS.starter.features.performanceTestsPerMonth).toBe(10);
    expect(PLANS.pro.features.performanceTestsPerMonth).toBe(-1);
    expect(PLANS.agency.features.performanceTestsPerMonth).toBe(-1);
  });

  it('should have correct boolean feature flags per plan', () => {
    // Free plan: very limited
    expect(PLANS.free.features.mobilePerformance).toBe(true);
    expect(PLANS.free.features.desktopPerformance).toBe(false);
    expect(PLANS.free.features.sectionDetails).toBe(false);
    expect(PLANS.free.features.codeFixes).toBe(false);
    expect(PLANS.free.features.scoreSimulator).toBe(false);
    expect(PLANS.free.features.pdfReport).toBe(false);
    expect(PLANS.free.features.pdfWhiteLabel).toBe(false);
    expect(PLANS.free.features.pdfCustomLogo).toBe(false);
    expect(PLANS.free.features.competitorBenchmark).toBe(false);
    expect(PLANS.free.features.apiAccess).toBe(false);
    expect(PLANS.free.features.whiteLabel).toBe(false);
    expect(PLANS.free.features.batchAnalysis).toBe(false);
    expect(PLANS.free.features.clientDashboard).toBe(false);
    expect(PLANS.free.features.onboardingCall).toBe(false);

    // Starter: adds desktop, sections, pdf
    expect(PLANS.starter.features.desktopPerformance).toBe(true);
    expect(PLANS.starter.features.sectionDetails).toBe(true);
    expect(PLANS.starter.features.pdfReport).toBe(true);
    expect(PLANS.starter.features.codeFixes).toBe(false);
    expect(PLANS.starter.features.scoreSimulator).toBe(false);
    expect(PLANS.starter.features.pdfWhiteLabel).toBe(false);

    // Pro: adds code fixes, score simulator, white-label PDFs, competitor benchmark
    expect(PLANS.pro.features.codeFixes).toBe(true);
    expect(PLANS.pro.features.scoreSimulator).toBe(true);
    expect(PLANS.pro.features.pdfWhiteLabel).toBe(true);
    expect(PLANS.pro.features.competitorBenchmark).toBe(true);
    expect(PLANS.pro.features.pdfCustomLogo).toBe(false);
    expect(PLANS.pro.features.apiAccess).toBe(false);
    expect(PLANS.pro.features.whiteLabel).toBe(false);

    // Agency: everything
    expect(PLANS.agency.features.pdfCustomLogo).toBe(true);
    expect(PLANS.agency.features.apiAccess).toBe(true);
    expect(PLANS.agency.features.whiteLabel).toBe(true);
    expect(PLANS.agency.features.batchAnalysis).toBe(true);
    expect(PLANS.agency.features.clientDashboard).toBe(true);
    expect(PLANS.agency.features.onboardingCall).toBe(true);
  });

  it('should have correct workspace and team limits', () => {
    expect(PLANS.free.features.workspaces).toBe(1);
    expect(PLANS.free.features.teamMembers).toBe(1);
    expect(PLANS.starter.features.workspaces).toBe(1);
    expect(PLANS.starter.features.teamMembers).toBe(1);
    expect(PLANS.pro.features.workspaces).toBe(1);
    expect(PLANS.pro.features.teamMembers).toBe(1);
    expect(PLANS.agency.features.workspaces).toBe(10);
    expect(PLANS.agency.features.teamMembers).toBe(5);
  });

  it('should have correct history days', () => {
    expect(PLANS.free.features.historyDays).toBe(0);
    expect(PLANS.starter.features.historyDays).toBe(30);
    expect(PLANS.pro.features.historyDays).toBe(90);
    expect(PLANS.agency.features.historyDays).toBe(-1); // unlimited
  });

  it('should have correct recommendations limits', () => {
    expect(PLANS.free.features.recommendations).toBe(3);
    expect(PLANS.starter.features.recommendations).toBe(-1);
    expect(PLANS.pro.features.recommendations).toBe(-1);
    expect(PLANS.agency.features.recommendations).toBe(-1);
  });

  it('should have correct support tiers', () => {
    expect(PLANS.free.features.support).toBe('community');
    expect(PLANS.starter.features.support).toBe('email');
    expect(PLANS.pro.features.support).toBe('priority');
    expect(PLANS.agency.features.support).toBe('dedicated');
  });
});

// ============================================
// hasFeature() — All plans x various features
// ============================================

describe('hasFeature', () => {
  const allPlans: PlanId[] = ['free', 'starter', 'pro', 'agency'];

  it('should return true for mobilePerformance on ALL plans', () => {
    allPlans.forEach((plan) => {
      expect(hasFeature(plan, 'mobilePerformance')).toBe(true);
    });
  });

  it('should return false for desktopPerformance on free, true on starter+', () => {
    expect(hasFeature('free', 'desktopPerformance')).toBe(false);
    expect(hasFeature('starter', 'desktopPerformance')).toBe(true);
    expect(hasFeature('pro', 'desktopPerformance')).toBe(true);
    expect(hasFeature('agency', 'desktopPerformance')).toBe(true);
  });

  it('should return false for codeFixes on free and starter, true on pro+', () => {
    expect(hasFeature('free', 'codeFixes')).toBe(false);
    expect(hasFeature('starter', 'codeFixes')).toBe(false);
    expect(hasFeature('pro', 'codeFixes')).toBe(true);
    expect(hasFeature('agency', 'codeFixes')).toBe(true);
  });

  it('should return false for apiAccess on free/starter/pro, true on agency', () => {
    expect(hasFeature('free', 'apiAccess')).toBe(false);
    expect(hasFeature('starter', 'apiAccess')).toBe(false);
    expect(hasFeature('pro', 'apiAccess')).toBe(false);
    expect(hasFeature('agency', 'apiAccess')).toBe(true);
  });

  it('should return false for pdfReport on free, true on starter+', () => {
    expect(hasFeature('free', 'pdfReport')).toBe(false);
    expect(hasFeature('starter', 'pdfReport')).toBe(true);
    expect(hasFeature('pro', 'pdfReport')).toBe(true);
    expect(hasFeature('agency', 'pdfReport')).toBe(true);
  });

  it('should return false for a feature with value 0 (historyDays on free)', () => {
    expect(hasFeature('free', 'historyDays')).toBe(false);
  });

  it('should return true for unlimited features (-1)', () => {
    expect(hasFeature('pro', 'themeAnalysisPerMonth')).toBe(true);
    expect(hasFeature('agency', 'historyDays')).toBe(true);
    expect(hasFeature('agency', 'performanceTestsPerMonth')).toBe(true);
  });

  it('should return true for numeric values > 0', () => {
    expect(hasFeature('free', 'themeAnalysisPerMonth')).toBe(true); // 1
    expect(hasFeature('free', 'recommendations')).toBe(true); // 3
    expect(hasFeature('starter', 'historyDays')).toBe(true); // 30
  });

  it('should return true for string values (support)', () => {
    expect(hasFeature('free', 'support')).toBe(true);
    expect(hasFeature('agency', 'support')).toBe(true);
  });

  it('should return false for a feature key that does not exist', () => {
    expect(hasFeature('free', 'nonExistentFeature')).toBe(false);
  });

  it('should handle whiteLabel correctly per plan', () => {
    expect(hasFeature('free', 'whiteLabel')).toBe(false);
    expect(hasFeature('starter', 'whiteLabel')).toBe(false);
    expect(hasFeature('pro', 'whiteLabel')).toBe(false);
    expect(hasFeature('agency', 'whiteLabel')).toBe(true);
  });
});

// ============================================
// getPlanLimits() — Returns features for each plan
// ============================================

describe('getPlanLimits', () => {
  it('should return the features object reference for each plan', () => {
    expect(getPlanLimits('free')).toBe(PLANS.free.features);
    expect(getPlanLimits('starter')).toBe(PLANS.starter.features);
    expect(getPlanLimits('pro')).toBe(PLANS.pro.features);
    expect(getPlanLimits('agency')).toBe(PLANS.agency.features);
  });

  it('should return correct numeric limits for free plan', () => {
    const limits = getPlanLimits('free');
    expect(limits.themeAnalysisPerMonth).toBe(1);
    expect(limits.performanceTestsPerMonth).toBe(1);
    expect(limits.recommendations).toBe(3);
    expect(limits.historyDays).toBe(0);
    expect(limits.workspaces).toBe(1);
    expect(limits.teamMembers).toBe(1);
  });

  it('should return correct numeric limits for starter plan', () => {
    const limits = getPlanLimits('starter');
    expect(limits.themeAnalysisPerMonth).toBe(5);
    expect(limits.performanceTestsPerMonth).toBe(10);
    expect(limits.recommendations).toBe(-1);
    expect(limits.historyDays).toBe(30);
  });

  it('should return correct numeric limits for pro plan', () => {
    const limits = getPlanLimits('pro');
    expect(limits.themeAnalysisPerMonth).toBe(-1);
    expect(limits.performanceTestsPerMonth).toBe(-1);
    expect(limits.historyDays).toBe(90);
  });

  it('should return correct numeric limits for agency plan', () => {
    const limits = getPlanLimits('agency');
    expect(limits.themeAnalysisPerMonth).toBe(-1);
    expect(limits.performanceTestsPerMonth).toBe(-1);
    expect(limits.historyDays).toBe(-1);
    expect(limits.workspaces).toBe(10);
    expect(limits.teamMembers).toBe(5);
    expect(limits.apiAccess).toBe(true);
  });
});

// ============================================
// canPerformAction() — All actions, all plans, boundary values
// ============================================

describe('canPerformAction', () => {
  describe('themeAnalysis', () => {
    it('should allow free plan below limit (usage=0, limit=1)', () => {
      const result = canPerformAction('free', 'themeAnalysis', 0);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny free plan at limit (usage=1, limit=1)', () => {
      const result = canPerformAction('free', 'themeAnalysis', 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('1 Theme-Analysen');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should deny free plan above limit (usage=5, limit=1)', () => {
      const result = canPerformAction('free', 'themeAnalysis', 5);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow starter plan below limit (usage=4, limit=5)', () => {
      const result = canPerformAction('starter', 'themeAnalysis', 4);
      expect(result.allowed).toBe(true);
    });

    it('should deny starter plan at limit (usage=5, limit=5)', () => {
      const result = canPerformAction('starter', 'themeAnalysis', 5);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('5 Theme-Analysen');
      expect(result.upgradeRequired).toBe('pro');
    });

    it('should deny starter plan above limit (usage=10, limit=5)', () => {
      const result = canPerformAction('starter', 'themeAnalysis', 10);
      expect(result.allowed).toBe(false);
    });

    it('should always allow pro plan (unlimited, -1)', () => {
      expect(canPerformAction('pro', 'themeAnalysis', 0).allowed).toBe(true);
      expect(canPerformAction('pro', 'themeAnalysis', 100).allowed).toBe(true);
      expect(canPerformAction('pro', 'themeAnalysis', 999999).allowed).toBe(true);
    });

    it('should always allow agency plan (unlimited, -1)', () => {
      expect(canPerformAction('agency', 'themeAnalysis', 0).allowed).toBe(true);
      expect(canPerformAction('agency', 'themeAnalysis', 1000).allowed).toBe(true);
    });

    it('should default currentUsage to 0 when not provided', () => {
      const result = canPerformAction('free', 'themeAnalysis');
      expect(result.allowed).toBe(true);
    });
  });

  describe('performanceTest', () => {
    it('should allow free plan below limit (usage=0, limit=1)', () => {
      const result = canPerformAction('free', 'performanceTest', 0);
      expect(result.allowed).toBe(true);
    });

    it('should deny free plan at limit (usage=1, limit=1)', () => {
      const result = canPerformAction('free', 'performanceTest', 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('1 Performance-Tests');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow starter plan below limit (usage=9, limit=10)', () => {
      const result = canPerformAction('starter', 'performanceTest', 9);
      expect(result.allowed).toBe(true);
    });

    it('should deny starter plan at limit (usage=10, limit=10)', () => {
      const result = canPerformAction('starter', 'performanceTest', 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('10 Performance-Tests');
      expect(result.upgradeRequired).toBe('pro');
    });

    it('should always allow pro plan (unlimited)', () => {
      expect(canPerformAction('pro', 'performanceTest', 999).allowed).toBe(true);
    });

    it('should always allow agency plan (unlimited)', () => {
      expect(canPerformAction('agency', 'performanceTest', 999).allowed).toBe(true);
    });

    it('should have no upgradeRequired for pro plan when denied (edge case: pro is unlimited so never denied)', () => {
      // Pro is unlimited, so it's never denied — confirm allowed is always true
      const result = canPerformAction('pro', 'performanceTest', 999999);
      expect(result.allowed).toBe(true);
      expect(result.upgradeRequired).toBeUndefined();
    });
  });

  describe('desktopPerformance', () => {
    it('should deny for free plan with correct reason and upgrade suggestion', () => {
      const result = canPerformAction('free', 'desktopPerformance');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Desktop Performance ist nur im Starter Plan oder höher verfügbar.');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow for starter plan', () => {
      const result = canPerformAction('starter', 'desktopPerformance');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow for pro plan', () => {
      expect(canPerformAction('pro', 'desktopPerformance').allowed).toBe(true);
    });

    it('should allow for agency plan', () => {
      expect(canPerformAction('agency', 'desktopPerformance').allowed).toBe(true);
    });

    it('should ignore currentUsage parameter (feature gate, not usage limit)', () => {
      const result = canPerformAction('free', 'desktopPerformance', 999);
      expect(result.allowed).toBe(false);
    });
  });

  describe('pdfReport', () => {
    it('should deny for free plan with correct reason', () => {
      const result = canPerformAction('free', 'pdfReport');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('PDF Reports sind nur im Starter Plan oder höher verfügbar.');
      expect(result.upgradeRequired).toBe('starter');
    });

    it('should allow for starter plan', () => {
      expect(canPerformAction('starter', 'pdfReport').allowed).toBe(true);
    });

    it('should allow for pro plan', () => {
      expect(canPerformAction('pro', 'pdfReport').allowed).toBe(true);
    });

    it('should allow for agency plan', () => {
      expect(canPerformAction('agency', 'pdfReport').allowed).toBe(true);
    });
  });

  describe('codeFixes', () => {
    it('should deny for free plan with upgradeRequired=pro', () => {
      const result = canPerformAction('free', 'codeFixes');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Code-Fixes sind nur im Pro Plan oder höher verfügbar.');
      expect(result.upgradeRequired).toBe('pro');
    });

    it('should deny for starter plan with upgradeRequired=pro', () => {
      const result = canPerformAction('starter', 'codeFixes');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Code-Fixes sind nur im Pro Plan oder höher verfügbar.');
      expect(result.upgradeRequired).toBe('pro');
    });

    it('should allow for pro plan', () => {
      expect(canPerformAction('pro', 'codeFixes').allowed).toBe(true);
    });

    it('should allow for agency plan', () => {
      expect(canPerformAction('agency', 'codeFixes').allowed).toBe(true);
    });
  });

  describe('unknown/default action', () => {
    it('should allow unknown actions by falling through to the default case', () => {
      // @ts-expect-error Testing unknown action
      const result = canPerformAction('free', 'unknownAction');
      expect(result.allowed).toBe(true);
    });
  });
});

// ============================================
// getPlanDisplayInfo() — Correct display info per plan
// ============================================

describe('getPlanDisplayInfo', () => {
  it('should return correct info for free plan (Kostenlos)', () => {
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
// getUpgradeBenefits() — Diffs between plan pairs
// ============================================

describe('getUpgradeBenefits', () => {
  it('should list benefits from free to starter', () => {
    const benefits = getUpgradeBenefits('free', 'starter');
    expect(benefits).toContain('5 Theme-Analysen/Monat (statt 1)');
    expect(benefits).toContain('Desktop Performance-Tests');
    expect(benefits).toContain('Detaillierte Section-Analyse');
    expect(benefits).toContain('PDF Reports');
    // codeFixes is still false on starter, so should NOT appear
    expect(benefits).not.toContain('Konkrete Code-Fixes');
  });

  it('should list benefits from starter to pro', () => {
    const benefits = getUpgradeBenefits('starter', 'pro');
    expect(benefits).toContain('Unbegrenzte Theme-Analysen');
    expect(benefits).toContain('Konkrete Code-Fixes');
    expect(benefits).toContain('Score-Simulator');
    expect(benefits).toContain('White-Label Reports');
    expect(benefits).toContain('Competitor Benchmarking');
    // Desktop is the same — should not be listed
    expect(benefits).not.toContain('Desktop Performance-Tests');
  });

  it('should list benefits from pro to agency', () => {
    const benefits = getUpgradeBenefits('pro', 'agency');
    expect(benefits).toContain('10 Workspaces (für mehrere Shops)');
    expect(benefits).toContain('API Zugang');
    // themeAnalysis is already unlimited in pro — should not appear
    expect(benefits).not.toContain('Unbegrenzte Theme-Analysen');
  });

  it('should list many benefits from free to agency (full leap)', () => {
    const benefits = getUpgradeBenefits('free', 'agency');
    expect(benefits.length).toBeGreaterThan(5);
    expect(benefits).toContain('Unbegrenzte Theme-Analysen');
    expect(benefits).toContain('Desktop Performance-Tests');
    expect(benefits).toContain('Detaillierte Section-Analyse');
    expect(benefits).toContain('Konkrete Code-Fixes');
    expect(benefits).toContain('Score-Simulator');
    expect(benefits).toContain('PDF Reports');
    expect(benefits).toContain('White-Label Reports');
    expect(benefits).toContain('Competitor Benchmarking');
    expect(benefits).toContain('10 Workspaces (für mehrere Shops)');
    expect(benefits).toContain('API Zugang');
  });

  it('should return empty array for same plan comparison', () => {
    expect(getUpgradeBenefits('free', 'free')).toHaveLength(0);
    expect(getUpgradeBenefits('starter', 'starter')).toHaveLength(0);
    expect(getUpgradeBenefits('pro', 'pro')).toHaveLength(0);
    expect(getUpgradeBenefits('agency', 'agency')).toHaveLength(0);
  });

  it('should return empty or near-empty for downgrades (nothing new is gained)', () => {
    const benefits = getUpgradeBenefits('agency', 'free');
    // Downgrading loses features, doesn't gain them
    expect(benefits.every((b) => !b.includes('Unbegrenzte'))).toBe(true);
  });

  it('should handle numerical increase text correctly (statt)', () => {
    const benefits = getUpgradeBenefits('free', 'starter');
    const analysisText = benefits.find((b) => b.includes('Theme-Analysen'));
    expect(analysisText).toBeDefined();
    expect(analysisText).toContain('5');
    expect(analysisText).toContain('statt 1');
  });

  it('should not list features that are the same in both plans', () => {
    const benefits = getUpgradeBenefits('starter', 'pro');
    // mobilePerformance and desktopPerformance are both true in starter and pro
    expect(benefits).not.toContain('Desktop Performance-Tests');
  });
});

// ============================================
// Shopify API — createSubscription
// ============================================

describe('createSubscription', () => {
  const shop = 'test-shop.myshopify.com';
  const accessToken = 'shpat_test_token';
  const returnUrl = 'https://app.example.com/billing/callback';

  it('should return null for free plan without calling Shopify', () => {
    const result = createSubscription(shop, accessToken, 'free', returnUrl);
    return expect(result).resolves.toBeNull();
  });

  it('should not create a Shopify client for free plan', async () => {
    await createSubscription(shop, accessToken, 'free', returnUrl);
    expect(mockCreateShopifyClient).not.toHaveBeenCalled();
  });

  it('should call Shopify API for starter plan and return confirmation URL + charge ID', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      recurring_application_charge: {
        id: 12345,
        confirmation_url: 'https://test-shop.myshopify.com/admin/charges/12345/confirm',
      },
    });
    mockCreateShopifyClient.mockReturnValue({ post: mockPost, get: jest.fn() } as any);

    const result = await createSubscription(shop, accessToken, 'starter', returnUrl);

    expect(mockCreateShopifyClient).toHaveBeenCalledWith(shop, accessToken);
    expect(mockPost).toHaveBeenCalledWith(
      '/recurring_application_charges.json',
      expect.objectContaining({
        recurring_application_charge: expect.objectContaining({
          name: 'ThemeMetrics Starter',
          price: 29,
          return_url: returnUrl,
          trial_days: 7,
        }),
      })
    );
    expect(result).toEqual({
      confirmationUrl: 'https://test-shop.myshopify.com/admin/charges/12345/confirm',
      chargeId: 12345,
    });
  });

  it('should call Shopify API for pro plan with correct price', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      recurring_application_charge: {
        id: 67890,
        confirmation_url: 'https://test-shop.myshopify.com/admin/charges/67890/confirm',
      },
    });
    mockCreateShopifyClient.mockReturnValue({ post: mockPost, get: jest.fn() } as any);

    const result = await createSubscription(shop, accessToken, 'pro', returnUrl);

    expect(mockPost).toHaveBeenCalledWith(
      '/recurring_application_charges.json',
      expect.objectContaining({
        recurring_application_charge: expect.objectContaining({
          name: 'ThemeMetrics Pro',
          price: 79,
          trial_days: 7,
        }),
      })
    );
    expect(result).toEqual({
      confirmationUrl: 'https://test-shop.myshopify.com/admin/charges/67890/confirm',
      chargeId: 67890,
    });
  });

  it('should call Shopify API for agency plan with correct price', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      recurring_application_charge: {
        id: 99999,
        confirmation_url: 'https://test-shop.myshopify.com/admin/charges/99999/confirm',
      },
    });
    mockCreateShopifyClient.mockReturnValue({ post: mockPost, get: jest.fn() } as any);

    const result = await createSubscription(shop, accessToken, 'agency', returnUrl);

    expect(mockPost).toHaveBeenCalledWith(
      '/recurring_application_charges.json',
      expect.objectContaining({
        recurring_application_charge: expect.objectContaining({
          name: 'ThemeMetrics Agency',
          price: 249,
          trial_days: 7,
        }),
      })
    );
    expect(result!.chargeId).toBe(99999);
  });
});

// ============================================
// Shopify API — activateSubscription
// ============================================

describe('activateSubscription', () => {
  const shop = 'test-shop.myshopify.com';
  const accessToken = 'shpat_test_token';
  const chargeId = 12345;

  it('should return true when charge status is accepted', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charge: { status: 'accepted' },
    });
    const mockPost = jest.fn().mockResolvedValue({});
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: mockPost } as any);

    const result = await activateSubscription(shop, accessToken, chargeId);

    expect(result).toBe(true);
    expect(mockGet).toHaveBeenCalledWith(`/recurring_application_charges/${chargeId}.json`);
    expect(mockPost).toHaveBeenCalledWith(
      `/recurring_application_charges/${chargeId}/activate.json`,
      {}
    );
  });

  it('should return false when charge status is declined', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charge: { status: 'declined' },
    });
    const mockPost = jest.fn();
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: mockPost } as any);

    const result = await activateSubscription(shop, accessToken, chargeId);

    expect(result).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should return false when charge status is pending', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charge: { status: 'pending' },
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await activateSubscription(shop, accessToken, chargeId);
    expect(result).toBe(false);
  });

  it('should return false and capture error on API failure', async () => {
    const apiError = new Error('Shopify API error: 500');
    const mockGet = jest.fn().mockRejectedValue(apiError);
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await activateSubscription(shop, accessToken, chargeId);

    expect(result).toBe(false);
    expect(mockCaptureError).toHaveBeenCalledWith(apiError);
  });
});

// ============================================
// Shopify API — getSubscriptionStatus
// ============================================

describe('getSubscriptionStatus', () => {
  const shop = 'test-shop.myshopify.com';
  const accessToken = 'shpat_test_token';

  it('should return free plan when no active charges exist', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 1, name: 'ThemeMetrics Starter', status: 'declined', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result).toEqual({
      active: true,
      plan: 'free',
      chargeId: null,
      trialEndsAt: null,
    });
  });

  it('should return free plan when charges array is empty', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result.plan).toBe('free');
    expect(result.active).toBe(true);
    expect(result.chargeId).toBeNull();
  });

  it('should detect Starter plan from active charge name', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 100, name: 'ThemeMetrics Starter', status: 'active', trial_ends_on: '2026-04-01' },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result).toEqual({
      active: true,
      plan: 'starter',
      chargeId: 100,
      trialEndsAt: '2026-04-01',
    });
  });

  it('should detect Pro plan from active charge name', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 200, name: 'ThemeMetrics Pro', status: 'active', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result.plan).toBe('pro');
    expect(result.chargeId).toBe(200);
  });

  it('should detect Agency plan from active charge name', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 300, name: 'ThemeMetrics Agency', status: 'active', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result.plan).toBe('agency');
    expect(result.chargeId).toBe(300);
  });

  it('should check Agency BEFORE Pro (priority order) to avoid false Pro match', async () => {
    // "Agency" contains neither "Pro" nor "Starter", so this is more about
    // verifying the order of checks: Agency is checked first.
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 400, name: 'ThemeMetrics Agency Pro Bundle', status: 'active', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    // Because "Agency" is checked first and the name includes "Agency", it should match agency
    expect(result.plan).toBe('agency');
  });

  it('should default to starter if active charge name matches none specifically', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 500, name: 'ThemeMetrics Basic', status: 'active', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    // The default is 'starter' when none of the name checks match
    expect(result.plan).toBe('starter');
    expect(result.chargeId).toBe(500);
  });

  it('should return free plan on API error', async () => {
    const apiError = new Error('Network error');
    const mockGet = jest.fn().mockRejectedValue(apiError);
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result).toEqual({
      active: true,
      plan: 'free',
      chargeId: null,
      trialEndsAt: null,
    });
    expect(mockCaptureError).toHaveBeenCalledWith(apiError);
  });

  it('should pick the first active charge when multiple exist', async () => {
    const mockGet = jest.fn().mockResolvedValue({
      recurring_application_charges: [
        { id: 1, name: 'ThemeMetrics Starter', status: 'declined', trial_ends_on: null },
        { id: 2, name: 'ThemeMetrics Pro', status: 'active', trial_ends_on: '2026-05-01' },
        { id: 3, name: 'ThemeMetrics Agency', status: 'pending', trial_ends_on: null },
      ],
    });
    mockCreateShopifyClient.mockReturnValue({ get: mockGet, post: jest.fn() } as any);

    const result = await getSubscriptionStatus(shop, accessToken);

    expect(result.plan).toBe('pro');
    expect(result.chargeId).toBe(2);
    expect(result.trialEndsAt).toBe('2026-05-01');
  });
});

// ============================================
// Shopify API — cancelSubscription
// ============================================

describe('cancelSubscription', () => {
  const shop = 'test-shop.myshopify.com';
  const accessToken = 'shpat_test_token';
  const chargeId = 12345;

  it('should return true on successful cancellation', async () => {
    const mockPost = jest.fn().mockResolvedValue({});
    mockCreateShopifyClient.mockReturnValue({ get: jest.fn(), post: mockPost } as any);

    const result = await cancelSubscription(shop, accessToken, chargeId);

    expect(result).toBe(true);
    expect(mockPost).toHaveBeenCalledWith(
      `/recurring_application_charges/${chargeId}/cancel.json`,
      {}
    );
  });

  it('should return false and capture error on failure', async () => {
    const apiError = new Error('Cancel failed');
    const mockPost = jest.fn().mockRejectedValue(apiError);
    mockCreateShopifyClient.mockReturnValue({ get: jest.fn(), post: mockPost } as any);

    const result = await cancelSubscription(shop, accessToken, chargeId);

    expect(result).toBe(false);
    expect(mockCaptureError).toHaveBeenCalledWith(apiError);
  });
});

// ============================================
// Integration / cross-function scenarios
// ============================================

describe('Billing integration scenarios', () => {
  it('should model a complete upgrade path: free -> starter -> pro -> agency', () => {
    // Free: limited
    expect(canPerformAction('free', 'themeAnalysis', 0).allowed).toBe(true);
    expect(canPerformAction('free', 'themeAnalysis', 1).allowed).toBe(false);
    expect(canPerformAction('free', 'desktopPerformance').allowed).toBe(false);
    expect(canPerformAction('free', 'pdfReport').allowed).toBe(false);
    expect(canPerformAction('free', 'codeFixes').allowed).toBe(false);

    // Starter: desktop + pdf unlocked
    const freeToStarterBenefits = getUpgradeBenefits('free', 'starter');
    expect(freeToStarterBenefits.length).toBeGreaterThan(0);
    expect(canPerformAction('starter', 'desktopPerformance').allowed).toBe(true);
    expect(canPerformAction('starter', 'pdfReport').allowed).toBe(true);
    expect(canPerformAction('starter', 'codeFixes').allowed).toBe(false);

    // Pro: code fixes + unlimited analyses
    const starterToProBenefits = getUpgradeBenefits('starter', 'pro');
    expect(starterToProBenefits.length).toBeGreaterThan(0);
    expect(canPerformAction('pro', 'codeFixes').allowed).toBe(true);
    expect(canPerformAction('pro', 'themeAnalysis', 999999).allowed).toBe(true);
    expect(hasFeature('pro', 'apiAccess')).toBe(false);

    // Agency: API, multi-workspace, all features
    const proToAgencyBenefits = getUpgradeBenefits('pro', 'agency');
    expect(proToAgencyBenefits.length).toBeGreaterThan(0);
    expect(hasFeature('agency', 'apiAccess')).toBe(true);
    expect(hasFeature('agency', 'whiteLabel')).toBe(true);
    expect(hasFeature('agency', 'batchAnalysis')).toBe(true);
  });

  it('should provide consistent upgrade suggestions (suggested plan actually unlocks the feature)', () => {
    const desktopResult = canPerformAction('free', 'desktopPerformance');
    expect(desktopResult.upgradeRequired).toBe('starter');
    expect(hasFeature('starter', 'desktopPerformance')).toBe(true);

    const codeFixResult = canPerformAction('free', 'codeFixes');
    expect(codeFixResult.upgradeRequired).toBe('pro');
    expect(hasFeature('pro', 'codeFixes')).toBe(true);

    const pdfResult = canPerformAction('free', 'pdfReport');
    expect(pdfResult.upgradeRequired).toBe('starter');
    expect(hasFeature('starter', 'pdfReport')).toBe(true);
  });
});
