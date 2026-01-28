/**
 * Test Fixtures and Mock Data
 *
 * Centralized mock data for consistent testing across all test suites.
 */

// ============================================
// Shop & Store Mocks
// ============================================

export const mockShop = {
  domain: 'test-shop.myshopify.com',
  accessToken: 'shpat_test_token_12345',
  id: 1,
};

export const mockStore = {
  id: 1,
  shopDomain: 'test-shop.myshopify.com',
  accessToken: 'shpat_test_token_12345',
  scope: 'read_themes,write_themes',
  plan: 'starter' as const,
  status: 'active' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ============================================
// Subscription Mocks
// ============================================

export const mockSubscription = {
  id: 1,
  storeId: 1,
  plan: 'starter' as const,
  status: 'active' as const,
  shopifyChargeId: 'charge_12345',
  trialEndsAt: null,
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockFreeSubscription = {
  ...mockSubscription,
  plan: 'free' as const,
  shopifyChargeId: null,
};

export const mockProSubscription = {
  ...mockSubscription,
  plan: 'pro' as const,
};

export const mockAgencySubscription = {
  ...mockSubscription,
  plan: 'agency' as const,
};

// ============================================
// Theme & Analysis Mocks
// ============================================

export const mockTheme = {
  id: 1,
  storeId: 1,
  shopifyThemeId: '123456789',
  name: 'Dawn',
  role: 'main',
  analyzedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-01'),
};

export const mockCoreWebVitals = {
  lcp: 2500,    // Largest Contentful Paint (ms)
  cls: 0.1,     // Cumulative Layout Shift
  fcp: 1800,    // First Contentful Paint (ms)
  tbt: 200,     // Total Blocking Time (ms)
  si: 3000,     // Speed Index (ms)
  tti: 3500,    // Time to Interactive (ms)
};

export const mockThemeAnalysis = {
  id: 1,
  storeId: 1,
  themeId: 1,
  overallScore: 75,
  speedScore: 80,
  qualityScore: 70,
  conversionScore: 75,
  coreWebVitals: mockCoreWebVitals,
  analyzedAt: new Date('2024-01-15'),
  report: {},
};

export const mockSectionAnalysis = {
  id: 1,
  analysisId: 1,
  sectionName: 'header',
  sectionType: 'section',
  liquidComplexity: 5,
  jsComplexity: 3,
  cssComplexity: 4,
  loopCount: 2,
  conditionalCount: 5,
  performanceScore: 80,
  recommendations: ['Reduce loop nesting', 'Optimize image loading'],
};

// ============================================
// Session Token Mocks
// ============================================

export function createMockSessionToken(options: {
  shop?: string;
  exp?: number;
  nbf?: number;
  aud?: string;
} = {}) {
  const {
    shop = 'test-shop.myshopify.com',
    exp = Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    nbf = Math.floor(Date.now() / 1000) - 60,   // 1 minute ago
    aud = process.env.SHOPIFY_API_KEY,
  } = options;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: `https://${shop}/admin`,
    dest: `https://${shop}`,
    aud,
    sub: '12345',
    exp,
    nbf,
    iat: nbf,
    jti: 'test-jti-12345',
    sid: 'test-session-id',
  };

  return { header, payload };
}

export const mockExpiredToken = createMockSessionToken({
  exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
});

export const mockFutureToken = createMockSessionToken({
  nbf: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
});

// ============================================
// PageSpeed API Mocks
// ============================================

export const mockPageSpeedResponse = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.85 },
    },
    audits: {
      'largest-contentful-paint': {
        id: 'largest-contentful-paint',
        numericValue: 2500,
        displayValue: '2.5 s',
      },
      'cumulative-layout-shift': {
        id: 'cumulative-layout-shift',
        numericValue: 0.1,
        displayValue: '0.1',
      },
      'first-contentful-paint': {
        id: 'first-contentful-paint',
        numericValue: 1800,
        displayValue: '1.8 s',
      },
      'total-blocking-time': {
        id: 'total-blocking-time',
        numericValue: 200,
        displayValue: '200 ms',
      },
      'speed-index': {
        id: 'speed-index',
        numericValue: 3000,
        displayValue: '3.0 s',
      },
      'interactive': {
        id: 'interactive',
        numericValue: 3500,
        displayValue: '3.5 s',
      },
    },
  },
};

// ============================================
// Shopify API Mocks
// ============================================

export const mockShopifyThemeResponse = {
  themes: [
    {
      id: 123456789,
      name: 'Dawn',
      role: 'main',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 987654321,
      name: 'Backup Theme',
      role: 'unpublished',
      created_at: '2023-12-01T00:00:00Z',
      updated_at: '2023-12-15T00:00:00Z',
    },
  ],
};

export const mockShopifyAssetResponse = {
  assets: [
    { key: 'sections/header.liquid', size: 5000 },
    { key: 'sections/footer.liquid', size: 3000 },
    { key: 'sections/product.liquid', size: 8000 },
    { key: 'snippets/cart-icon.liquid', size: 500 },
  ],
};

// ============================================
// Usage Tracking Mocks
// ============================================

export const mockUsageTracking = {
  id: 1,
  storeId: 1,
  month: '2024-01',
  themeAnalysesCount: 3,
  performanceTestsCount: 5,
  pdfReportsCount: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

// ============================================
// Email & Lead Mocks
// ============================================

export const mockEmailLead = {
  id: 1,
  email: 'test@example.com',
  shopDomain: 'test-shop.myshopify.com',
  firstName: 'Test',
  lastName: 'User',
  status: 'active' as const,
  source: 'signup',
  sequence: 'onboarding',
  sequenceStep: 1,
  lastEmailSentAt: new Date('2024-01-10'),
  createdAt: new Date('2024-01-01'),
};

// ============================================
// Agency Mocks
// ============================================

export const mockAgency = {
  id: 1,
  storeId: 1,
  name: 'Test Agency',
  logo: null,
  primaryColor: '#000000',
  createdAt: new Date('2024-01-01'),
};

export const mockWorkspace = {
  id: 1,
  agencyId: 1,
  name: 'Client Shop 1',
  shopDomain: 'client-shop.myshopify.com',
  accessToken: 'shpat_client_token',
  createdAt: new Date('2024-01-01'),
};

// ============================================
// HMAC & Webhook Mocks
// ============================================

export function createMockWebhookHeaders(topic: string, shop: string) {
  return {
    'x-shopify-topic': topic,
    'x-shopify-shop-domain': shop,
    'x-shopify-hmac-sha256': 'mock-hmac-signature',
    'x-shopify-webhook-id': 'webhook-12345',
  };
}

// ============================================
// Database Mock Helpers
// ============================================

export const mockDb = {
  query: {
    stores: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    subscriptions: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    themes: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    themeAnalyses: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    usageTracking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  returning: jest.fn(),
};
