// Store types
export interface Store {
  id: string;
  shopDomain: string;
  accessToken: string;
  plan: 'starter' | 'fashion_pro' | 'agency';
  status: 'active' | 'inactive' | 'uninstalled';
  installedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Theme types
export interface Theme {
  id: string;
  storeId: string;
  shopifyThemeId: string;
  name: string;
  role: 'main' | 'unpublished' | 'demo';
  analyzedAt: Date | null;
  createdAt: Date;
}

// Section types
export type SectionType = 
  | 'hero'
  | 'product_grid'
  | 'featured_collection'
  | 'announcement'
  | 'newsletter'
  | 'testimonials'
  | 'image_with_text'
  | 'video'
  | 'instagram'
  | 'footer'
  | 'header'
  | 'custom';

export interface Section {
  id: string;
  themeId: string;
  name: string;
  type: SectionType;
  filePath: string;
  linesOfCode: number;
  complexityScore: number;
  estimatedLoadTimeMs: number;
  hasVideo: boolean;
  hasAnimations: boolean;
  hasLazyLoading: boolean;
  content?: string;
  createdAt: Date;
}

// Performance Snapshot
export interface PerformanceSnapshot {
  id: string;
  storeId: string;
  themeId: string;
  healthScore: number;
  loadTimeScore: number;
  mobileScore: number;
  complexityScore: number;
  totalSections: number;
  problematicSections: number;
  recordedAt: Date;
  createdAt: Date;
}

// Recommendation types
export type RecommendationSeverity = 'critical' | 'warning' | 'info';
export type RecommendationType = 'performance' | 'ux' | 'conversion';
export type RecommendationStatus = 'open' | 'dismissed' | 'completed';

export interface Recommendation {
  id: string;
  storeId: string;
  sectionId: string | null;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  fix: string;
  impactScore: number;
  effortScore: number;
  estimatedRevenueImpact: number | null;
  status: RecommendationStatus;
  createdAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  storeId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  plan: 'starter' | 'fashion_pro' | 'agency';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

// Benchmark types
export interface Benchmark {
  id: string;
  vertical: 'fashion' | 'beauty' | 'home' | 'general';
  metricName: string;
  avgValue: number;
  p25Value: number;
  p50Value: number;
  p75Value: number;
  p90Value: number;
  sampleSize: number;
  updatedAt: Date;
}

// Dashboard types
export interface DashboardStats {
  healthScore: number;
  healthScoreChange: number;
  loadTime: number;
  loadTimeChange: number;
  mobileScore: number;
  mobileScoreChange: number;
  totalSections: number;
  sectionsChange: number;
  criticalIssues: number;
  issuesChange: number;
}

export interface SectionWithStatus extends Section {
  status: 'optimal' | 'warning' | 'critical';
  benchmarkLoadTime: number;
}

// Shopify API types
export interface ShopifyTheme {
  id: number;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyAsset {
  key: string;
  value?: string;
  content_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

// Session type
export interface ShopifySession {
  shop: string;
  accessToken: string;
  scope: string;
}
