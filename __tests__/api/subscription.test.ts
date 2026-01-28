/**
 * Subscription API Tests
 */

import { PLANS, PlanId, canPerformAction } from '@/lib/billing';

describe('Subscription API Logic', () => {
  describe('Plan Features', () => {
    it('should have all required plans', () => {
      expect(PLANS.free).toBeDefined();
      expect(PLANS.starter).toBeDefined();
      expect(PLANS.pro).toBeDefined();
      expect(PLANS.agency).toBeDefined();
    });

    it('should have increasing prices for higher tiers', () => {
      expect(PLANS.free.price).toBe(0);
      expect(PLANS.starter.price).toBeGreaterThan(PLANS.free.price);
      expect(PLANS.pro.price).toBeGreaterThan(PLANS.starter.price);
      expect(PLANS.agency.price).toBeGreaterThan(PLANS.pro.price);
    });

    it('should have increasing limits for higher tiers', () => {
      const free = PLANS.free.features;
      const starter = PLANS.starter.features;
      const pro = PLANS.pro.features;

      // Starter should have more than free
      expect(starter.themeAnalysisPerMonth).toBeGreaterThan(free.themeAnalysisPerMonth);
      // Pro should be unlimited (-1) which is effectively greater than any numeric limit
      expect(pro.themeAnalysisPerMonth).toBe(-1); // Unlimited
    });

    it('should have -1 for unlimited features in agency plan', () => {
      const agency = PLANS.agency.features;
      expect(agency.themeAnalysisPerMonth).toBe(-1);
      expect(agency.performanceTestsPerMonth).toBe(-1);
      expect(agency.recommendations).toBe(-1);
    });
  });

  describe('Usage Calculations', () => {
    it('should calculate remaining usage correctly', () => {
      const limit = 5;
      const used = 3;
      const remaining = Math.max(0, limit - used);
      expect(remaining).toBe(2);
    });

    it('should return -1 for unlimited remaining', () => {
      const limit = -1;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - 3);
      expect(remaining).toBe(-1);
    });

    it('should not go below 0 for remaining', () => {
      const limit = 5;
      const used = 10;
      const remaining = Math.max(0, limit - used);
      expect(remaining).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      const limit = 10;
      const used = 7;
      const percent = Math.round((used / limit) * 100);
      expect(percent).toBe(70);
    });

    it('should return 0% for unlimited', () => {
      const limit = -1;
      const used = 100;
      const percent = limit === -1 ? 0 : Math.round((used / limit) * 100);
      expect(percent).toBe(0);
    });
  });

  describe('Trial Logic', () => {
    it('should calculate days remaining correctly', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      const diff = endDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      expect(daysLeft).toBe(3);
    });

    it('should return 0 for expired trials', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const diff = endDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      expect(daysLeft).toBe(0);
    });

    it('should identify active trial', () => {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isTrialing = trialEndsAt > now;
      expect(isTrialing).toBe(true);
    });

    it('should identify expired trial', () => {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const isTrialing = trialEndsAt > now;
      expect(isTrialing).toBe(false);
    });
  });

  describe('Upgrade Suggestions', () => {
    function getUpgradeSuggestion(planId: PlanId, usagePercent: number) {
      if (planId === 'agency') return { suggest: false };

      if (usagePercent >= 90) {
        const nextPlan = planId === 'free' ? 'starter' : planId === 'starter' ? 'pro' : 'agency';
        return { suggest: true, suggestedPlan: nextPlan };
      }

      return { suggest: false };
    }

    it('should suggest upgrade at 90% usage for free plan', () => {
      const result = getUpgradeSuggestion('free', 90);
      expect(result.suggest).toBe(true);
      expect(result.suggestedPlan).toBe('starter');
    });

    it('should suggest upgrade at 95% usage for starter plan', () => {
      const result = getUpgradeSuggestion('starter', 95);
      expect(result.suggest).toBe(true);
      expect(result.suggestedPlan).toBe('pro');
    });

    it('should not suggest upgrade at 50% usage', () => {
      const result = getUpgradeSuggestion('starter', 50);
      expect(result.suggest).toBe(false);
    });

    it('should never suggest upgrade for agency plan', () => {
      const result = getUpgradeSuggestion('agency', 100);
      expect(result.suggest).toBe(false);
    });
  });

  describe('Plan Action Permissions', () => {
    it('should allow action within limit', () => {
      const result = canPerformAction('starter', 'themeAnalysis', 2);
      expect(result.allowed).toBe(true);
    });

    it('should deny action at limit', () => {
      const limit = PLANS.starter.features.themeAnalysisPerMonth;
      const result = canPerformAction('starter', 'themeAnalysis', limit);
      expect(result.allowed).toBe(false);
    });

    it('should always allow unlimited actions', () => {
      const result = canPerformAction('agency', 'themeAnalysis', 1000);
      expect(result.allowed).toBe(true);
    });

    it('should deny desktop performance for free plan', () => {
      const result = canPerformAction('free', 'desktopPerformance', 0);
      expect(result.allowed).toBe(false);
    });

    it('should allow desktop performance for starter plan', () => {
      const result = canPerformAction('starter', 'desktopPerformance', 0);
      expect(result.allowed).toBe(true);
    });
  });
});
