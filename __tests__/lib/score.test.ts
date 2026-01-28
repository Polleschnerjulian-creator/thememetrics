/**
 * Score Calculator Tests
 *
 * Tests for the ThemeMetrics scoring algorithm
 * Covers Core Web Vitals scoring, quality analysis, and conversion metrics
 */

import {
  CoreWebVitals,
  SectionAnalysisData,
  ThemeData,
  ScoreBreakdown,
  calculateThemeMetricsScore,
  getScoreStatus,
  formatMetricValue,
} from '@/lib/score';

// ============================================
// TEST FIXTURES
// ============================================

const createMockVitals = (overrides: Partial<CoreWebVitals> = {}): CoreWebVitals => ({
  lcp: 2500,  // Good threshold
  cls: 0.1,   // Good threshold
  fcp: 1800,  // Good threshold
  tbt: 200,   // Good threshold
  ...overrides,
});

const createMockSection = (overrides: Partial<SectionAnalysisData> = {}): SectionAnalysisData => ({
  name: 'test-section',
  type: 'section',
  linesOfCode: 100,
  complexityScore: 30,
  hasVideo: false,
  hasAnimations: false,
  hasLazyLoading: true,
  hasResponsiveImages: true,
  hasPreload: false,
  liquidLoops: 1,
  liquidAssigns: 5,
  liquidConditions: 3,
  externalScripts: 0,
  inlineStyles: 0,
  ...overrides,
});

const createMockTheme = (overrides: Partial<ThemeData> = {}): ThemeData => ({
  totalSections: 8,
  snippetsCount: 5,
  hasTranslations: true,
  sectionsAboveFold: 2,
  ...overrides,
});

// ============================================
// CORE WEB VITALS SCORING TESTS
// ============================================

describe('Core Web Vitals Scoring', () => {
  describe('LCP (Largest Contentful Paint)', () => {
    it('should score 100 for LCP <= 2500ms (good)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 2500 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.lcp.status).toBe('good');
      expect(result.speed.details.lcp.score).toBe(100);
    });

    it('should score between 50-100 for LCP 2500-4000ms (warning)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 3250 }), // Midpoint
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.lcp.status).toBe('warning');
      expect(result.speed.details.lcp.score).toBeLessThan(100);
      expect(result.speed.details.lcp.score).toBeGreaterThanOrEqual(50);
    });

    it('should score < 50 for LCP > 4000ms (poor)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.lcp.status).toBe('poor');
      expect(result.speed.details.lcp.score).toBeLessThan(50);
    });

    it('should not go below 0 for very high LCP', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 15000 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.lcp.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CLS (Cumulative Layout Shift)', () => {
    it('should score 100 for CLS <= 0.1 (good)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.cls.status).toBe('good');
      expect(result.speed.details.cls.score).toBe(100);
    });

    it('should score between 50-100 for CLS 0.1-0.25 (warning)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ cls: 0.175 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.cls.status).toBe('warning');
      expect(result.speed.details.cls.score).toBeLessThan(100);
      expect(result.speed.details.cls.score).toBeGreaterThanOrEqual(50);
    });

    it('should score < 50 for CLS > 0.25 (poor)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ cls: 0.4 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.cls.status).toBe('poor');
      expect(result.speed.details.cls.score).toBeLessThan(50);
    });
  });

  describe('FCP (First Contentful Paint)', () => {
    it('should score 100 for FCP <= 1800ms (good)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ fcp: 1500 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.fcp.status).toBe('good');
      expect(result.speed.details.fcp.score).toBe(100);
    });

    it('should score between 50-100 for FCP 1800-3000ms (warning)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ fcp: 2400 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.fcp.status).toBe('warning');
      expect(result.speed.details.fcp.score).toBeLessThan(100);
      expect(result.speed.details.fcp.score).toBeGreaterThanOrEqual(50);
    });

    it('should score < 50 for FCP > 3000ms (poor)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ fcp: 4000 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.fcp.status).toBe('poor');
      expect(result.speed.details.fcp.score).toBeLessThan(50);
    });
  });

  describe('TBT (Total Blocking Time)', () => {
    it('should score 100 for TBT <= 200ms (good)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ tbt: 150 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.tbt.status).toBe('good');
      expect(result.speed.details.tbt.score).toBe(100);
    });

    it('should score between 50-100 for TBT 200-600ms (warning)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ tbt: 400 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.tbt.status).toBe('warning');
      expect(result.speed.details.tbt.score).toBeLessThan(100);
      expect(result.speed.details.tbt.score).toBeGreaterThanOrEqual(50);
    });

    it('should score < 50 for TBT > 600ms (poor)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ tbt: 900 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.speed.details.tbt.status).toBe('poor');
      expect(result.speed.details.tbt.score).toBeLessThan(50);
    });
  });

  describe('Combined CWV Weighting', () => {
    it('should weight LCP at 35%', () => {
      // Good LCP
      const goodLCP = calculateThemeMetricsScore(
        createMockVitals({ lcp: 2000, cls: 0.1, fcp: 1800, tbt: 200 }),
        [createMockSection()],
        createMockTheme()
      );

      // Poor LCP (same other values)
      const poorLCP = calculateThemeMetricsScore(
        createMockVitals({ lcp: 6000, cls: 0.1, fcp: 1800, tbt: 200 }),
        [createMockSection()],
        createMockTheme()
      );

      // LCP has significant impact on score (35% weight)
      expect(goodLCP.speed.coreWebVitals).toBeGreaterThan(poorLCP.speed.coreWebVitals);
      // Verify the difference is meaningful (at least 10 points)
      expect(goodLCP.speed.coreWebVitals - poorLCP.speed.coreWebVitals).toBeGreaterThanOrEqual(10);
    });
  });
});

// ============================================
// SECTION LOAD IMPACT TESTS
// ============================================

describe('Section Load Impact Scoring', () => {
  it('should penalize video in hero section (first section)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'hero', hasVideo: true })],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.section === 'hero' && p.reason.includes('Video')
    )).toBe(true);
  });

  it('should penalize video in non-hero sections', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [
        createMockSection({ name: 'hero' }),
        createMockSection({ name: 'features', hasVideo: true }),
      ],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.section === 'features' && p.reason.includes('Video')
    )).toBe(true);
  });

  it('should penalize Instagram/social embeds', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'instagram-feed', type: 'instagram' })],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.reason.includes('Social Media Embed')
    )).toBe(true);
  });

  it('should penalize missing lazy loading for below-fold sections', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [
        createMockSection({ name: 'hero' }),
        createMockSection({ name: 'features' }),
        createMockSection({ name: 'testimonials', hasLazyLoading: false }),
      ],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.section === 'testimonials' && p.reason.includes('Lazy Loading')
    )).toBe(true);
  });

  it('should penalize external scripts', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'analytics', externalScripts: 3 })],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.reason.includes('externe Scripts')
    )).toBe(true);
  });

  it('should penalize heavy animations', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'banner', hasAnimations: true, complexityScore: 60 })],
      createMockTheme()
    );

    expect(result.speed.penalties.some(p =>
      p.reason.includes('Animationen')
    )).toBe(true);
  });

  it('should penalize too many sections (>15)', () => {
    const manySections = Array(16).fill(null).map((_, i) =>
      createMockSection({ name: `section-${i}` })
    );

    const result = calculateThemeMetricsScore(
      createMockVitals(),
      manySections,
      createMockTheme({ totalSections: 16 })
    );

    expect(result.speed.penalties.some(p =>
      p.reason.includes('Zu viele Sections')
    )).toBe(true);
  });

  it('should not go below 0 score', () => {
    const terribleSections = Array(20).fill(null).map((_, i) =>
      createMockSection({
        name: `section-${i}`,
        hasVideo: true,
        externalScripts: 5,
        hasAnimations: true,
        complexityScore: 80,
        hasLazyLoading: false,
      })
    );

    const result = calculateThemeMetricsScore(
      createMockVitals(),
      terribleSections,
      createMockTheme()
    );

    expect(result.speed.sectionLoad).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// QUALITY SCORING TESTS
// ============================================

describe('Quality Scoring', () => {
  describe('Liquid Quality', () => {
    it('should penalize very long files (>400 lines)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 500 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Sehr lange Datei') && i.severity === 'high'
      )).toBe(true);
    });

    it('should penalize medium-long files (>200 lines)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 250 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Lange Datei') && i.severity === 'medium'
      )).toBe(true);
    });

    it('should penalize nested loops (high loops + high complexity)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidLoops: 4, complexityScore: 70 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Verschachtelte Loops') && i.severity === 'high'
      )).toBe(true);
    });

    it('should penalize too many assigns', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidAssigns: 25 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Assigns')
      )).toBe(true);
    });

    it('should penalize inline styles', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ inlineStyles: 10 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Inline Styles')
      )).toBe(true);
    });

    it('should penalize high complexity', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ complexityScore: 75 })],
        createMockTheme()
      );

      expect(result.quality.issues.some(i =>
        i.issue.includes('Hohe Code-Komplexität')
      )).toBe(true);
    });
  });

  describe('Best Practices', () => {
    it('should penalize low lazy loading adoption', () => {
      const noLazyLoadingSections = Array(5).fill(null).map((_, i) =>
        createMockSection({ name: `section-${i}`, hasLazyLoading: false })
      );

      const result = calculateThemeMetricsScore(
        createMockVitals(),
        noLazyLoadingSections,
        createMockTheme()
      );

      expect(result.quality.bestPractices).toBeLessThan(80);
    });

    it('should penalize low responsive images adoption', () => {
      const noResponsiveSections = Array(5).fill(null).map((_, i) =>
        createMockSection({ name: `section-${i}`, hasResponsiveImages: false })
      );

      const result = calculateThemeMetricsScore(
        createMockVitals(),
        noResponsiveSections,
        createMockTheme()
      );

      expect(result.quality.bestPractices).toBeLessThan(90);
    });

    it('should penalize no preload usage', () => {
      const noPreloadSections = Array(3).fill(null).map((_, i) =>
        createMockSection({ name: `section-${i}`, hasPreload: false })
      );

      const result = calculateThemeMetricsScore(
        createMockVitals(),
        noPreloadSections,
        createMockTheme()
      );

      expect(result.quality.bestPractices).toBeLessThan(100);
    });
  });

  describe('Architecture', () => {
    it('should penalize too few snippets', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 1 })
      );

      expect(result.quality.architecture).toBeLessThan(90);
    });

    it('should bonus good snippet usage', () => {
      const goodSnippets = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 10 })
      );

      const fewSnippets = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 2 })
      );

      expect(goodSnippets.quality.architecture).toBeGreaterThan(fewSnippets.quality.architecture);
    });

    it('should penalize missing translations', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ hasTranslations: false })
      );

      expect(result.quality.architecture).toBeLessThan(100);
    });

    it('should penalize too many sections above fold', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ sectionsAboveFold: 5 })
      );

      expect(result.quality.architecture).toBeLessThan(100);
    });
  });
});

// ============================================
// CONVERSION SCORING TESTS
// ============================================

describe('Conversion Scoring', () => {
  describe('E-commerce Score', () => {
    it('should bonus having a hero section', () => {
      const withHero = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'hero', type: 'hero' })],
        createMockTheme()
      );

      const withoutHero = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'content', type: 'section' })],
        createMockTheme()
      );

      expect(withHero.conversion.ecommerce).toBeGreaterThan(withoutHero.conversion.ecommerce);
    });

    it('should bonus having product grid', () => {
      const withProducts = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'featured-products', type: 'product_grid' })],
        createMockTheme()
      );

      const withoutProducts = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'content' })],
        createMockTheme()
      );

      expect(withProducts.conversion.ecommerce).toBeGreaterThan(withoutProducts.conversion.ecommerce);
    });

    it('should bonus having testimonials', () => {
      const withTestimonials = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'customer-reviews', type: 'testimonials' })],
        createMockTheme()
      );

      const withoutTestimonials = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'content' })],
        createMockTheme()
      );

      expect(withTestimonials.conversion.ecommerce).toBeGreaterThan(withoutTestimonials.conversion.ecommerce);
    });

    it('should penalize complex hero section', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'hero', type: 'hero', complexityScore: 70 })],
        createMockTheme()
      );

      expect(result.conversion.ecommerce).toBeLessThan(90);
    });
  });

  describe('Mobile Score', () => {
    it('should penalize high LCP for mobile', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 3500 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.conversion.mobile).toBeLessThan(100);
    });

    it('should penalize high TBT for mobile', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ tbt: 500 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.conversion.mobile).toBeLessThan(100);
    });

    it('should penalize high CLS for mobile', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ cls: 0.2 }),
        [createMockSection()],
        createMockTheme()
      );

      expect(result.conversion.mobile).toBeLessThan(100);
    });

    it('should return default score when no vitals', () => {
      const result = calculateThemeMetricsScore(
        null,
        [createMockSection()],
        createMockTheme()
      );

      expect(result.conversion.mobile).toBe(70);
    });
  });

  describe('Revenue Impact', () => {
    it('should estimate monthly loss based on load time', () => {
      const slowSite = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }), // 3 seconds excess
        [createMockSection()],
        createMockTheme()
      );

      expect(slowSite.conversion.estimatedMonthlyLoss).toBeGreaterThan(0);
    });

    it('should have zero loss for fast sites', () => {
      const fastSite = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1500 }), // Under 2s baseline
        [createMockSection()],
        createMockTheme()
      );

      expect(fastSite.conversion.estimatedMonthlyLoss).toBe(0);
    });

    it('should use custom monthly revenue for calculations', () => {
      const highRevenue = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        100000 // €100k monthly
      );

      const lowRevenue = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        10000 // €10k monthly
      );

      expect(highRevenue.conversion.estimatedMonthlyLoss).toBeGreaterThan(
        lowRevenue.conversion.estimatedMonthlyLoss
      );
    });
  });
});

// ============================================
// MAIN SCORE CALCULATOR TESTS
// ============================================

describe('calculateThemeMetricsScore', () => {
  it('should return overall score between 0 and 100', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('should weight speed at 40%, quality at 35%, conversion at 25%', () => {
    // Create scenarios to verify weighting
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );

    // Verify the overall calculation roughly matches the weighted formula
    const expectedOverall = Math.round(
      result.speed.score * 0.40 +
      result.quality.score * 0.35 +
      result.conversion.score * 0.25
    );

    expect(result.overall).toBe(expectedOverall);
  });

  it('should handle missing vitals gracefully', () => {
    const result = calculateThemeMetricsScore(
      null,
      [createMockSection()],
      createMockTheme()
    );

    expect(result.speed.coreWebVitals).toBe(50);
    expect(result.speed.details.lcp.status).toBe('warning');
  });

  it('should handle empty sections array', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [],
      createMockTheme()
    );

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.quality.liquidQuality).toBe(100); // No sections = no issues
  });

  it('should produce high scores for well-optimized themes', () => {
    const wellOptimized = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1500, cls: 0.02, fcp: 1000, tbt: 50 }),
      [
        createMockSection({
          name: 'hero',
          type: 'hero',
          hasLazyLoading: true,
          hasResponsiveImages: true,
          hasPreload: true,
          linesOfCode: 80,
          complexityScore: 20,
        }),
        createMockSection({
          name: 'products',
          type: 'product_grid',
          hasLazyLoading: true,
          hasResponsiveImages: true,
        }),
      ],
      createMockTheme({ snippetsCount: 8, hasTranslations: true })
    );

    expect(wellOptimized.overall).toBeGreaterThan(80);
  });

  it('should produce low scores for poorly-optimized themes', () => {
    const poorlyOptimized = calculateThemeMetricsScore(
      createMockVitals({ lcp: 6000, cls: 0.4, fcp: 4000, tbt: 1000 }),
      [
        createMockSection({
          name: 'hero',
          hasVideo: true,
          externalScripts: 5,
          hasLazyLoading: false,
          hasResponsiveImages: false,
          linesOfCode: 500,
          complexityScore: 80,
          liquidLoops: 5,
          inlineStyles: 20,
        }),
      ],
      createMockTheme({ snippetsCount: 0, hasTranslations: false, totalSections: 25 })
    );

    expect(poorlyOptimized.overall).toBeLessThan(50);
  });

  it('should include all expected fields in the result', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );

    // Overall
    expect(result).toHaveProperty('overall');

    // Speed
    expect(result).toHaveProperty('speed.score');
    expect(result).toHaveProperty('speed.coreWebVitals');
    expect(result).toHaveProperty('speed.sectionLoad');
    expect(result).toHaveProperty('speed.details');
    expect(result).toHaveProperty('speed.penalties');

    // Quality
    expect(result).toHaveProperty('quality.score');
    expect(result).toHaveProperty('quality.liquidQuality');
    expect(result).toHaveProperty('quality.bestPractices');
    expect(result).toHaveProperty('quality.architecture');
    expect(result).toHaveProperty('quality.issues');

    // Conversion
    expect(result).toHaveProperty('conversion.score');
    expect(result).toHaveProperty('conversion.ecommerce');
    expect(result).toHaveProperty('conversion.mobile');
    expect(result).toHaveProperty('conversion.revenueImpact');
    expect(result).toHaveProperty('conversion.estimatedMonthlyLoss');
  });
});

// ============================================
// HELPER FUNCTION TESTS
// ============================================

describe('getScoreStatus', () => {
  it('should return "Exzellent" for scores >= 90', () => {
    const result = getScoreStatus(95);
    expect(result.label).toBe('Exzellent');
    expect(result.color).toContain('emerald');
  });

  it('should return "Gut" for scores 70-89', () => {
    const result = getScoreStatus(75);
    expect(result.label).toBe('Gut');
    expect(result.color).toContain('green');
  });

  it('should return "Verbesserungswürdig" for scores 50-69', () => {
    const result = getScoreStatus(55);
    expect(result.label).toBe('Verbesserungswürdig');
    expect(result.color).toContain('amber');
  });

  it('should return "Kritisch" for scores < 50', () => {
    const result = getScoreStatus(30);
    expect(result.label).toBe('Kritisch');
    expect(result.color).toContain('red');
  });

  it('should return correct colors and backgrounds', () => {
    const excellent = getScoreStatus(95);
    expect(excellent.bgColor).toContain('bg-');
    expect(excellent.description).toBeTruthy();
  });

  it('should handle boundary values', () => {
    expect(getScoreStatus(90).label).toBe('Exzellent');
    expect(getScoreStatus(89).label).toBe('Gut');
    expect(getScoreStatus(70).label).toBe('Gut');
    expect(getScoreStatus(69).label).toBe('Verbesserungswürdig');
    expect(getScoreStatus(50).label).toBe('Verbesserungswürdig');
    expect(getScoreStatus(49).label).toBe('Kritisch');
  });
});

describe('formatMetricValue', () => {
  it('should format LCP in seconds', () => {
    expect(formatMetricValue('lcp', 2500)).toBe('2.5s');
    expect(formatMetricValue('lcp', 1000)).toBe('1.0s');
  });

  it('should format FCP in seconds', () => {
    expect(formatMetricValue('fcp', 1800)).toBe('1.8s');
  });

  it('should format CLS with 2 decimal places', () => {
    expect(formatMetricValue('cls', 0.1)).toBe('0.10');
    expect(formatMetricValue('cls', 0.05)).toBe('0.05');
  });

  it('should format TBT in milliseconds', () => {
    expect(formatMetricValue('tbt', 200)).toBe('200ms');
    expect(formatMetricValue('tbt', 350.5)).toBe('351ms');
  });

  it('should return string for unknown metrics', () => {
    expect(formatMetricValue('unknown', 123)).toBe('123');
  });
});

// ============================================
// EDGE CASES AND INTEGRATION
// ============================================

describe('Edge Cases', () => {
  it('should handle zero values in vitals', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 0, cls: 0, fcp: 0, tbt: 0 }),
      [createMockSection()],
      createMockTheme()
    );

    expect(result.speed.coreWebVitals).toBe(100);
  });

  it('should handle very large values in vitals', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 100000, cls: 10, fcp: 100000, tbt: 100000 }),
      [createMockSection()],
      createMockTheme()
    );

    expect(result.speed.coreWebVitals).toBeGreaterThanOrEqual(0);
  });

  it('should handle negative values gracefully', () => {
    // Although negative values shouldn't occur, the function should handle them
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: -100, cls: -0.1, fcp: -100, tbt: -100 }),
      [createMockSection()],
      createMockTheme()
    );

    // Function should still return valid scores
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('should handle section with all penalty conditions', () => {
    const terribleSection = createMockSection({
      name: 'instagram-hero',
      type: 'instagram',
      hasVideo: true,
      hasAnimations: true,
      complexityScore: 90,
      hasLazyLoading: false,
      hasResponsiveImages: false,
      linesOfCode: 600,
      liquidLoops: 5,
      liquidAssigns: 30,
      inlineStyles: 20,
      externalScripts: 5,
    });

    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [terribleSection],
      createMockTheme()
    );

    // Should have multiple penalties and issues
    expect(result.speed.penalties.length).toBeGreaterThan(0);
    expect(result.quality.issues.length).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(70);
  });
});
