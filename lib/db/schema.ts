import { pgTable, text, timestamp, integer, serial, json, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  shopDomain: text('shop_domain').notNull().unique(),
  accessToken: text('access_token').notNull(),
  scope: text('scope'),
  plan: text('plan').default('starter'),
  status: text('status').default('active'),
  installedAt: timestamp('installed_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const storesRelations = relations(stores, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [stores.id],
    references: [subscriptions.storeId],
  }),
  themes: many(themes),
  recommendations: many(recommendations),
}));

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  plan: text('plan').default('starter'),
  status: text('status').default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  store: one(stores, {
    fields: [subscriptions.storeId],
    references: [stores.id],
  }),
}));

export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  shopifyThemeId: text('shopify_theme_id').notNull(),
  name: text('name').notNull(),
  role: text('role'),
  analyzedAt: timestamp('analyzed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const themesRelations = relations(themes, ({ one, many }) => ({
  store: one(stores, {
    fields: [themes.storeId],
    references: [stores.id],
  }),
  sections: many(sections),
  performanceSnapshots: many(performanceSnapshots),
}));

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').references(() => themes.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  filePath: text('file_path'),
  linesOfCode: integer('lines_of_code'),
  complexityScore: integer('complexity_score'),
  estimatedLoadTimeMs: integer('estimated_load_time_ms'),
  hasVideo: boolean('has_video').default(false),
  hasAnimations: boolean('has_animations').default(false),
  hasLazyLoading: boolean('has_lazy_loading').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sectionsRelations = relations(sections, ({ one }) => ({
  theme: one(themes, {
    fields: [sections.themeId],
    references: [themes.id],
  }),
}));

export const performanceSnapshots = pgTable('performance_snapshots', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').references(() => themes.id).notNull(),
  healthScore: integer('health_score'),
  mobileScore: integer('mobile_score'),
  desktopScore: integer('desktop_score'),
  totalLoadTimeMs: integer('total_load_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const performanceSnapshotsRelations = relations(performanceSnapshots, ({ one }) => ({
  theme: one(themes, {
    fields: [performanceSnapshots.themeId],
    references: [themes.id],
  }),
}));

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  sectionId: integer('section_id').references(() => sections.id),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  fix: text('fix'),
  impactScore: integer('impact_score'),
  effortScore: integer('effort_score'),
  estimatedRevenueImpact: decimal('estimated_revenue_impact'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  store: one(stores, {
    fields: [recommendations.storeId],
    references: [stores.id],
  }),
  section: one(sections, {
    fields: [recommendations.sectionId],
    references: [sections.id],
  }),
}));

export const themeAnalyses = pgTable('theme_analyses', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  themeId: text('theme_id').notNull(),
  themeName: text('theme_name').notNull(),
  totalSections: integer('total_sections').notNull(),
  overallScore: integer('overall_score').notNull(),
  scoreSource: text('score_source').default('heuristic'), // 'lighthouse' or 'heuristic'
  // Core Web Vitals (stored when available)
  lcpMs: integer('lcp_ms'), // Largest Contentful Paint in ms
  clsScore: decimal('cls_score'), // Cumulative Layout Shift
  tbtMs: integer('tbt_ms'), // Total Blocking Time in ms
  fcpMs: integer('fcp_ms'), // First Contentful Paint in ms
  analyzedAt: timestamp('analyzed_at').defaultNow(),
});

export const sectionAnalyses = pgTable('section_analyses', {
  id: serial('id').primaryKey(),
  analysisId: integer('analysis_id').references(() => themeAnalyses.id).notNull(),
  sectionName: text('section_name').notNull(),
  sectionType: text('section_type').notNull(),
  category: text('category').notNull(),
  performanceScore: integer('performance_score').notNull(),
  recommendations: json('recommendations').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Usage tracking for plan limits
export const usageTracking = pgTable('usage_tracking', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  month: text('month').notNull(), // Format: '2026-01'
  themeAnalysesCount: integer('theme_analyses_count').default(0),
  performanceTestsCount: integer('performance_tests_count').default(0),
  pdfReportsCount: integer('pdf_reports_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  store: one(stores, {
    fields: [usageTracking.storeId],
    references: [stores.id],
  }),
}));

// Promo codes for discounts and free upgrades
export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  plan: text('plan').notNull(), // 'starter', 'pro', 'agency'
  durationMonths: integer('duration_months').default(1), // How long the plan is valid
  maxUses: integer('max_uses').default(1), // Max number of times code can be used
  usedCount: integer('used_count').default(0),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Track which stores used which promo codes
export const promoCodeUses = pgTable('promo_code_uses', {
  id: serial('id').primaryKey(),
  promoCodeId: integer('promo_code_id').references(() => promoCodes.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  usedAt: timestamp('used_at').defaultNow(),
});

// Image optimization analysis storage
export const imageAnalyses = pgTable('image_analyses', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  themeId: text('theme_id').notNull(),
  themeName: text('theme_name').notNull(),
  score: integer('score').notNull(),
  totalImages: integer('total_images').default(0),
  issuesCount: integer('issues_count').default(0),
  potentialSavings: integer('potential_savings').default(0), // in bytes
  potentialSavingsPercent: integer('potential_savings_percent').default(0),
  estimatedTimeImprovement: decimal('estimated_time_improvement'), // in seconds
  criticalCount: integer('critical_count').default(0),
  highCount: integer('high_count').default(0),
  mediumCount: integer('medium_count').default(0),
  lowCount: integer('low_count').default(0),
  report: json('report'), // Full report JSON
  analyzedAt: timestamp('analyzed_at').defaultNow(),
});

export const imageAnalysesRelations = relations(imageAnalyses, ({ one }) => ({
  store: one(stores, {
    fields: [imageAnalyses.storeId],
    references: [stores.id],
  }),
}));

// Email Leads for marketing
export const emailLeads = pgTable('email_leads', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  shopUrl: text('shop_url'),
  source: text('source').default('speed-check'), // speed-check, newsletter, pdf-download
  status: text('status').default('subscribed'), // subscribed, unsubscribed, bounced
  speedScore: integer('speed_score'),
  performanceData: json('performance_data'),
  tags: text('tags').array(),
  utm_source: text('utm_source'),
  utm_medium: text('utm_medium'),
  utm_campaign: text('utm_campaign'),
  welcomeSequenceStep: integer('welcome_sequence_step').default(0),
  lastEmailSentAt: timestamp('last_email_sent_at'),
  convertedToUser: boolean('converted_to_user').default(false),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});