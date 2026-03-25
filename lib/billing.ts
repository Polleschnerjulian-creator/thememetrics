import { captureError } from '@/lib/monitoring';

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

// Execute a Shopify Admin GraphQL mutation/query
async function shopifyGraphql<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `https://${shop}/admin/api/2025-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify GraphQL HTTP error ${response.status}: ${text}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data as T;
}

// Extract numeric ID from a Shopify GID (e.g. "gid://shopify/AppSubscription/123" → "123")
function gidToNumericId(gid: string): string {
  const parts = gid.split('/');
  return parts[parts.length - 1];
}

// Create a recurring subscription charge using GraphQL Billing API
export async function createSubscription(
  shop: string,
  accessToken: string,
  planId: PlanId,
  returnUrl: string
): Promise<{ confirmationUrl: string; chargeId: string } | null> {
  if (planId === 'free') {
    return null;
  }

  const plan = PLANS[planId];
  const isTest = process.env.NODE_ENV !== 'production';

  const mutation = `
    mutation appSubscriptionCreate(
      $name: String!
      $returnUrl: URL!
      $trialDays: Int
      $test: Boolean
      $lineItems: [AppSubscriptionLineItemInput!]!
    ) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        test: $test
        lineItems: $lineItems
      ) {
        userErrors {
          field
          message
        }
        appSubscription {
          id
        }
        confirmationUrl
      }
    }
  `;

  const variables = {
    name: `ThemeMetrics ${plan.name}`,
    returnUrl,
    trialDays: plan.trialDays > 0 ? plan.trialDays : null,
    test: isTest,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: plan.price.toFixed(2),
              currencyCode: 'EUR',
            },
            interval: 'EVERY_30_DAYS',
          },
        },
      },
    ],
  };

  const data = await shopifyGraphql<{
    appSubscriptionCreate: {
      userErrors: Array<{ field: string; message: string }>;
      appSubscription: { id: string } | null;
      confirmationUrl: string | null;
    };
  }>(shop, accessToken, mutation, variables);

  const result = data.appSubscriptionCreate;

  if (result.userErrors.length > 0) {
    throw new Error(
      `Shopify billing error: ${result.userErrors.map((e) => e.message).join(', ')}`
    );
  }

  if (!result.confirmationUrl || !result.appSubscription) {
    return null;
  }

  return {
    confirmationUrl: result.confirmationUrl,
    chargeId: gidToNumericId(result.appSubscription.id),
  };
}

// Verify subscription is active after merchant approval (GraphQL auto-activates on approval)
export async function activateSubscription(
  shop: string,
  accessToken: string,
  chargeId: number | string
): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus(shop, accessToken);
    // After GraphQL billing approval, the subscription is automatically active.
    // We just verify it's active and optionally match the charge ID.
    if (status.active && status.plan !== 'free') {
      // If chargeId matches, great. If not (edge case), still accept active state.
      const numericChargeId = String(chargeId);
      if (!status.shopifySubscriptionId || status.shopifySubscriptionId === numericChargeId) {
        return true;
      }
      return true; // Accept any active subscription
    }
    return false;
  } catch (error) {
    captureError(error);
    return false;
  }
}

// Get current subscription status via GraphQL
export async function getSubscriptionStatus(
  shop: string,
  accessToken: string
): Promise<{
  active: boolean;
  plan: PlanId;
  shopifySubscriptionId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}> {
  const query = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          trialDays
          currentPeriodEnd
        }
      }
    }
  `;

  try {
    const data = await shopifyGraphql<{
      currentAppInstallation: {
        activeSubscriptions: Array<{
          id: string;
          name: string;
          status: string;
          trialDays: number;
          currentPeriodEnd: string | null;
        }>;
      };
    }>(shop, accessToken, query);

    const activeSubscriptions = data.currentAppInstallation.activeSubscriptions;
    const activeSubscription = activeSubscriptions.find(
      (s) => s.status === 'ACTIVE' || s.status === 'PENDING'
    );

    if (activeSubscription) {
      let plan: PlanId = 'starter';
      const name = activeSubscription.name.toLowerCase();
      if (name.includes('pro')) plan = 'pro';
      if (name.includes('agency')) plan = 'agency';
      if (name.includes('starter')) plan = 'starter';

      return {
        active: true,
        plan,
        shopifySubscriptionId: gidToNumericId(activeSubscription.id),
        trialEndsAt: null, // trial info not directly available here
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
      };
    }

    return {
      active: true, // Free plan is always "active"
      plan: 'free',
      shopifySubscriptionId: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
    };
  } catch (error) {
    captureError(error);
    return {
      active: true,
      plan: 'free',
      shopifySubscriptionId: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
    };
  }
}

// Cancel a subscription via GraphQL
export async function cancelSubscription(
  shop: string,
  accessToken: string,
  _chargeId?: number | string
): Promise<boolean> {
  try {
    // Query active subscriptions to get the GID
    const status = await getSubscriptionStatus(shop, accessToken);
    if (!status.shopifySubscriptionId) {
      return true; // Nothing to cancel
    }

    const subscriptionGid = `gid://shopify/AppSubscription/${status.shopifySubscriptionId}`;

    const mutation = `
      mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          userErrors {
            field
            message
          }
          appSubscription {
            id
            status
          }
        }
      }
    `;

    const data = await shopifyGraphql<{
      appSubscriptionCancel: {
        userErrors: Array<{ field: string; message: string }>;
        appSubscription: { id: string; status: string } | null;
      };
    }>(shop, accessToken, mutation, { id: subscriptionGid });

    const result = data.appSubscriptionCancel;

    if (result.userErrors.length > 0) {
      captureError(new Error(`Cancel errors: ${result.userErrors.map((e) => e.message).join(', ')}`));
      return false;
    }

    return true;
  } catch (error) {
    captureError(error);
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
