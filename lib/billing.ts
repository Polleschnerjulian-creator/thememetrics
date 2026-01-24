import { createShopifyClient } from './shopify';

// Pricing Plans - Based on 2026 Pricing Strategy
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    trialDays: 0,
    features: {
      themeAnalysisPerMonth: 1,
      performanceTestsPerMonth: 1,
      mobilePerformance: true,
      desktopPerformance: false,
      sectionDetails: false,
      recommendations: 3, // Only top 3
      codeFixes: false,
      scoreSimulator: false,
      pdfReport: false,
      pdfWhiteLabel: false,
      pdfCustomLogo: false,
      historyDays: 0,
      competitorBenchmark: false,
      workspaces: 1,
      teamMembers: 1,
      apiAccess: false,
      support: 'community',
      whiteLabel: false,
      batchAnalysis: false,
      clientDashboard: false,
      onboardingCall: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    trialDays: 7,
    features: {
      themeAnalysisPerMonth: 5,
      performanceTestsPerMonth: 10,
      mobilePerformance: true,
      desktopPerformance: true,
      sectionDetails: true,
      recommendations: -1, // unlimited
      codeFixes: false,
      scoreSimulator: false,
      pdfReport: true, // with ThemeMetrics branding
      pdfWhiteLabel: false,
      pdfCustomLogo: false,
      historyDays: 30,
      competitorBenchmark: false,
      workspaces: 1,
      teamMembers: 1,
      apiAccess: false,
      support: 'email',
      whiteLabel: false,
      batchAnalysis: false,
      clientDashboard: false,
      onboardingCall: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 79,
    trialDays: 7,
    features: {
      themeAnalysisPerMonth: -1, // unlimited
      performanceTestsPerMonth: -1, // unlimited
      mobilePerformance: true,
      desktopPerformance: true,
      sectionDetails: true,
      recommendations: -1,
      codeFixes: true,
      scoreSimulator: true,
      pdfReport: true,
      pdfWhiteLabel: true, // no branding
      pdfCustomLogo: false,
      historyDays: 90,
      competitorBenchmark: true,
      workspaces: 1,
      teamMembers: 1,
      apiAccess: false,
      support: 'priority',
      whiteLabel: false,
      batchAnalysis: false,
      clientDashboard: false,
      onboardingCall: false,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 249,
    trialDays: 7,
    features: {
      themeAnalysisPerMonth: -1,
      performanceTestsPerMonth: -1,
      mobilePerformance: true,
      desktopPerformance: true,
      sectionDetails: true,
      recommendations: -1,
      codeFixes: true,
      scoreSimulator: true,
      pdfReport: true,
      pdfWhiteLabel: true,
      pdfCustomLogo: true, // custom agency logo
      historyDays: -1, // unlimited
      competitorBenchmark: true,
      workspaces: 10,
      teamMembers: 5,
      apiAccess: true,
      support: 'dedicated',
      whiteLabel: true,
      batchAnalysis: true,
      clientDashboard: true,
      onboardingCall: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Create a recurring subscription charge (not for free plan)
export async function createSubscription(
  shop: string,
  accessToken: string,
  planId: PlanId,
  returnUrl: string
): Promise<{ confirmationUrl: string; chargeId: number } | null> {
  // Free plan doesn't need Shopify billing
  if (planId === 'free') {
    return null;
  }

  const plan = PLANS[planId];
  const client = createShopifyClient(shop, accessToken);
  
  const response = await client.post<{
    recurring_application_charge: {
      id: number;
      confirmation_url: string;
    };
  }>('/recurring_application_charges.json', {
    recurring_application_charge: {
      name: `ThemeMetrics ${plan.name}`,
      price: plan.price,
      return_url: returnUrl,
      trial_days: plan.trialDays,
      test: process.env.NODE_ENV !== 'production', // Test mode for dev
    },
  });

  return {
    confirmationUrl: response.recurring_application_charge.confirmation_url,
    chargeId: response.recurring_application_charge.id,
  };
}

// Activate a subscription after merchant approval
export async function activateSubscription(
  shop: string,
  accessToken: string,
  chargeId: number
): Promise<boolean> {
  const client = createShopifyClient(shop, accessToken);
  
  try {
    // Get the charge to check its status
    const charge = await client.get<{
      recurring_application_charge: {
        status: string;
      };
    }>(`/recurring_application_charges/${chargeId}.json`);

    if (charge.recurring_application_charge.status === 'accepted') {
      // Activate the charge
      await client.post(`/recurring_application_charges/${chargeId}/activate.json`, {});
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to activate subscription:', error);
    return false;
  }
}

// Get current subscription status
export async function getSubscriptionStatus(
  shop: string,
  accessToken: string
): Promise<{
  active: boolean;
  plan: PlanId;
  chargeId: number | null;
  trialEndsAt: string | null;
}> {
  const client = createShopifyClient(shop, accessToken);
  
  try {
    const response = await client.get<{
      recurring_application_charges: Array<{
        id: number;
        name: string;
        status: string;
        trial_ends_on: string | null;
      }>;
    }>('/recurring_application_charges.json');

    const activeCharge = response.recurring_application_charges.find(
      (c) => c.status === 'active'
    );

    if (activeCharge) {
      // Determine plan from charge name
      let plan: PlanId = 'starter';
      if (activeCharge.name.includes('Pro')) plan = 'pro';
      if (activeCharge.name.includes('Agency')) plan = 'agency';

      return {
        active: true,
        plan,
        chargeId: activeCharge.id,
        trialEndsAt: activeCharge.trial_ends_on,
      };
    }

    // No active subscription = Free plan
    return {
      active: true, // Free plan is always "active"
      plan: 'free',
      chargeId: null,
      trialEndsAt: null,
    };
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    // Default to free plan on error
    return {
      active: true,
      plan: 'free',
      chargeId: null,
      trialEndsAt: null,
    };
  }
}

// Cancel a subscription
export async function cancelSubscription(
  shop: string,
  accessToken: string,
  chargeId: number
): Promise<boolean> {
  const client = createShopifyClient(shop, accessToken);
  
  try {
    await client.post(`/recurring_application_charges/${chargeId}/cancel.json`, {});
    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}

// Check if a feature is available for a plan
export function hasFeature(planId: PlanId, feature: string): boolean {
  const plan = PLANS[planId];
  const features = plan.features as Record<string, unknown>;
  return feature in features && features[feature] !== false && features[feature] !== 0;
}

// Get usage limits for a plan
export function getPlanLimits(planId: PlanId) {
  return PLANS[planId].features;
}

// Check if user can perform action based on plan limits
export function canPerformAction(
  planId: PlanId,
  action: 'themeAnalysis' | 'performanceTest' | 'desktopPerformance' | 'pdfReport' | 'codeFixes',
  currentUsage: number = 0
): { allowed: boolean; reason?: string; upgradeRequired?: PlanId } {
  const limits = PLANS[planId].features;

  switch (action) {
    case 'themeAnalysis':
      if (limits.themeAnalysisPerMonth === -1) return { allowed: true };
      if (currentUsage >= limits.themeAnalysisPerMonth) {
        return {
          allowed: false,
          reason: `Du hast dein Limit von ${limits.themeAnalysisPerMonth} Theme-Analysen erreicht.`,
          upgradeRequired: planId === 'free' ? 'starter' : planId === 'starter' ? 'pro' : undefined,
        };
      }
      return { allowed: true };

    case 'performanceTest':
      if (limits.performanceTestsPerMonth === -1) return { allowed: true };
      if (currentUsage >= limits.performanceTestsPerMonth) {
        return {
          allowed: false,
          reason: `Du hast dein Limit von ${limits.performanceTestsPerMonth} Performance-Tests erreicht.`,
          upgradeRequired: planId === 'free' ? 'starter' : planId === 'starter' ? 'pro' : undefined,
        };
      }
      return { allowed: true };

    case 'desktopPerformance':
      if (!limits.desktopPerformance) {
        return {
          allowed: false,
          reason: 'Desktop Performance ist nur im Starter Plan oder höher verfügbar.',
          upgradeRequired: 'starter',
        };
      }
      return { allowed: true };

    case 'pdfReport':
      if (!limits.pdfReport) {
        return {
          allowed: false,
          reason: 'PDF Reports sind nur im Starter Plan oder höher verfügbar.',
          upgradeRequired: 'starter',
        };
      }
      return { allowed: true };

    case 'codeFixes':
      if (!limits.codeFixes) {
        return {
          allowed: false,
          reason: 'Code-Fixes sind nur im Pro Plan oder höher verfügbar.',
          upgradeRequired: 'pro',
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

// Get plan display info for UI
export function getPlanDisplayInfo(planId: PlanId) {
  const plan = PLANS[planId];
  return {
    name: plan.name,
    price: plan.price,
    priceDisplay: plan.price === 0 ? 'Kostenlos' : `€${plan.price}/Monat`,
    trialDays: plan.trialDays,
    isFreePlan: planId === 'free',
  };
}

// Compare plans for upgrade prompts
export function getUpgradeBenefits(fromPlan: PlanId, toPlan: PlanId): string[] {
  const from = PLANS[fromPlan].features;
  const to = PLANS[toPlan].features;
  const benefits: string[] = [];

  if (to.themeAnalysisPerMonth === -1 && from.themeAnalysisPerMonth !== -1) {
    benefits.push('Unbegrenzte Theme-Analysen');
  } else if (to.themeAnalysisPerMonth > from.themeAnalysisPerMonth) {
    benefits.push(`${to.themeAnalysisPerMonth} Theme-Analysen/Monat (statt ${from.themeAnalysisPerMonth})`);
  }

  if (to.desktopPerformance && !from.desktopPerformance) {
    benefits.push('Desktop Performance-Tests');
  }

  if (to.sectionDetails && !from.sectionDetails) {
    benefits.push('Detaillierte Section-Analyse');
  }

  if (to.codeFixes && !from.codeFixes) {
    benefits.push('Konkrete Code-Fixes');
  }

  if (to.scoreSimulator && !from.scoreSimulator) {
    benefits.push('Score-Simulator');
  }

  if (to.pdfReport && !from.pdfReport) {
    benefits.push('PDF Reports');
  }

  if (to.pdfWhiteLabel && !from.pdfWhiteLabel) {
    benefits.push('White-Label Reports');
  }

  if (to.competitorBenchmark && !from.competitorBenchmark) {
    benefits.push('Competitor Benchmarking');
  }

  if (to.workspaces > from.workspaces) {
    benefits.push(`${to.workspaces} Workspaces (für mehrere Shops)`);
  }

  if (to.apiAccess && !from.apiAccess) {
    benefits.push('API Zugang');
  }

  return benefits;
}
