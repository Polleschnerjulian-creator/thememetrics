/**
 * Score Calculator Tests
 *
 * Comprehensive tests for the ThemeMetrics scoring algorithm.
 * Covers Core Web Vitals scoring curves, quality analysis, conversion metrics,
 * helper functions, and edge cases.
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
  lcp: 2500,
  cls: 0.1,
  fcp: 1800,
  tbt: 200,
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
// INDIVIDUAL CORE WEB VITAL SCORING CURVES
// ============================================

describe('LCP Scoring Curve', () => {
  it('should score 100 for LCP at exactly 2500ms (good boundary)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 2500 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.score).toBe(100);
    expect(result.speed.details.lcp.status).toBe('good');
  });

  it('should score 100 for LCP well below threshold', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.score).toBe(100);
    expect(result.speed.details.lcp.status).toBe('good');
  });

  it('should score 100 for LCP at 0ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.score).toBe(100);
    expect(result.speed.details.lcp.status).toBe('good');
  });

  it('should transition to warning above 2500ms', () => {
    // At 2501ms, the score rounds to 100 due to Math.round, so use a larger gap
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 2600 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.status).toBe('warning');
    expect(result.speed.details.lcp.score).toBeLessThan(100);
    expect(result.speed.details.lcp.score).toBeGreaterThanOrEqual(50);
  });

  it('should score 75 at LCP midpoint 3250ms (linear interpolation)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 3250 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.score).toBe(75);
    expect(result.speed.details.lcp.status).toBe('warning');
  });

  it('should score ~50 at LCP = 4000ms (warning/poor boundary)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 4000 }),
      [createMockSection()],
      createMockTheme()
    );
    // At exactly 4000: 100 - ((4000-2500)/1500)*50 = 100 - 50 = 50
    expect(result.speed.details.lcp.score).toBe(50);
    expect(result.speed.details.lcp.status).toBe('warning');
  });

  it('should transition to poor above 4000ms', () => {
    // At 4001ms, Math.round brings the score to 50, so use a larger gap
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 4100 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.status).toBe('poor');
    expect(result.speed.details.lcp.score).toBeLessThan(50);
  });

  it('should score 25 at LCP = 6000ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 6000 }),
      [createMockSection()],
      createMockTheme()
    );
    // 50 - ((6000-4000)/4000)*50 = 50 - 25 = 25
    expect(result.speed.details.lcp.score).toBe(25);
    expect(result.speed.details.lcp.status).toBe('poor');
  });

  it('should clamp to 0 for very high LCP', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 20000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.score).toBe(0);
    expect(result.speed.details.lcp.status).toBe('poor');
  });

  it('should store the raw LCP value', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 3333 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.lcp.value).toBe(3333);
  });
});

describe('FCP Scoring Curve', () => {
  it('should score 100 for FCP <= 1800ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 1800 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.score).toBe(100);
    expect(result.speed.details.fcp.status).toBe('good');
  });

  it('should score 100 for FCP well below threshold', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 500 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.score).toBe(100);
    expect(result.speed.details.fcp.status).toBe('good');
  });

  it('should transition to warning above 1800ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 1801 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.status).toBe('warning');
  });

  it('should score 75 at FCP midpoint 2400ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 2400 }),
      [createMockSection()],
      createMockTheme()
    );
    // 100 - ((2400-1800)/1200)*50 = 100 - 25 = 75
    expect(result.speed.details.fcp.score).toBe(75);
  });

  it('should score 50 at FCP = 3000ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 3000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.score).toBe(50);
    expect(result.speed.details.fcp.status).toBe('warning');
  });

  it('should transition to poor above 3000ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 3001 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.status).toBe('poor');
  });

  it('should clamp to 0 for very high FCP', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ fcp: 50000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.fcp.score).toBe(0);
  });
});

describe('TBT Scoring Curve', () => {
  it('should score 100 for TBT <= 200ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 200 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.score).toBe(100);
    expect(result.speed.details.tbt.status).toBe('good');
  });

  it('should score 100 for TBT = 0ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.score).toBe(100);
    expect(result.speed.details.tbt.status).toBe('good');
  });

  it('should transition to warning above 200ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 201 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.status).toBe('warning');
  });

  it('should score 75 at TBT midpoint 400ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 400 }),
      [createMockSection()],
      createMockTheme()
    );
    // 100 - ((400-200)/400)*50 = 100 - 25 = 75
    expect(result.speed.details.tbt.score).toBe(75);
  });

  it('should score 50 at TBT = 600ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 600 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.score).toBe(50);
    expect(result.speed.details.tbt.status).toBe('warning');
  });

  it('should transition to poor above 600ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 601 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.status).toBe('poor');
  });

  it('should score 25 at TBT = 1100ms', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 1100 }),
      [createMockSection()],
      createMockTheme()
    );
    // 50 - ((1100-600)/1000)*50 = 50 - 25 = 25
    expect(result.speed.details.tbt.score).toBe(25);
  });

  it('should clamp to 0 for very high TBT', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ tbt: 10000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.tbt.score).toBe(0);
  });
});

describe('CLS Scoring Curve', () => {
  it('should score 100 for CLS <= 0.1', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 0.1 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.score).toBe(100);
    expect(result.speed.details.cls.status).toBe('good');
  });

  it('should score 100 for CLS = 0', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.score).toBe(100);
    expect(result.speed.details.cls.status).toBe('good');
  });

  it('should transition to warning above 0.1', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 0.11 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.status).toBe('warning');
  });

  it('should score ~50 at CLS = 0.25 (warning/poor boundary)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 0.25 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.score).toBe(50);
    expect(result.speed.details.cls.status).toBe('warning');
  });

  it('should transition to poor above 0.25', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 0.26 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.status).toBe('poor');
  });

  it('should clamp to 0 for very high CLS', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ cls: 5.0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.details.cls.score).toBe(0);
  });
});

describe('Combined CWV Weighting', () => {
  it('should weight LCP 35%, CLS 25%, TBT 25%, FCP 15%', () => {
    // All perfect vitals
    const perfect = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1000, cls: 0, fcp: 1000, tbt: 0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(perfect.speed.coreWebVitals).toBe(100);
  });

  it('should reflect LCP having highest weight (35%)', () => {
    const badLCP = calculateThemeMetricsScore(
      createMockVitals({ lcp: 8000, cls: 0.05, fcp: 1000, tbt: 100 }),
      [createMockSection()],
      createMockTheme()
    );
    const badFCP = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1000, cls: 0.05, fcp: 6000, tbt: 100 }),
      [createMockSection()],
      createMockTheme()
    );
    // LCP at 35% weight should have bigger impact than FCP at 15%
    expect(badLCP.speed.coreWebVitals).toBeLessThan(badFCP.speed.coreWebVitals);
  });

  it('should reflect CLS and TBT having equal weight (25% each)', () => {
    // Bad CLS, good everything else
    const badCLS = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1000, cls: 0.5, fcp: 1000, tbt: 100 }),
      [createMockSection()],
      createMockTheme()
    );
    // Bad TBT, good everything else
    const badTBT = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1000, cls: 0.05, fcp: 1000, tbt: 1600 }),
      [createMockSection()],
      createMockTheme()
    );
    // Both CLS and TBT at 0 score, 25% weight each: impact should be similar
    // CLS 0.5 => score 0; TBT 1600 => score 0
    // Both lose 25 points from CWV score
    expect(Math.abs(badCLS.speed.coreWebVitals - badTBT.speed.coreWebVitals)).toBeLessThanOrEqual(1);
  });
});

// ============================================
// SECTION LOAD IMPACT TESTS
// ============================================

describe('Section Load Impact Scoring', () => {
  it('should return score 100 with no penalties for clean sections', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.sectionLoad).toBe(100);
    expect(result.speed.penalties).toHaveLength(0);
  });

  it('should penalize video in hero section (first section) by 15 points', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'hero', hasVideo: true })],
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.section === 'hero' && p.reason.includes('Video'));
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(15);
  });

  it('should penalize video in non-hero sections by 8 points', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [
        createMockSection({ name: 'hero' }),
        createMockSection({ name: 'features', hasVideo: true }),
      ],
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.section === 'features');
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(8);
  });

  it('should penalize Instagram/social type sections by 10 points', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'ig-feed', type: 'instagram' })],
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.reason.includes('Social Media'));
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(10);
  });

  it('should detect social embed by name containing "instagram"', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'my-instagram-feed', type: 'custom' })],
      createMockTheme()
    );
    expect(result.speed.penalties.some(p => p.reason.includes('Social Media'))).toBe(true);
  });

  it('should detect social embed by name containing "social"', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'social-wall', type: 'custom' })],
      createMockTheme()
    );
    expect(result.speed.penalties.some(p => p.reason.includes('Social Media'))).toBe(true);
  });

  it('should penalize missing lazy loading only for sections at index >= 2', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [
        createMockSection({ name: 'hero', hasLazyLoading: false }),
        createMockSection({ name: 'features', hasLazyLoading: false }),
        createMockSection({ name: 'testimonials', hasLazyLoading: false }),
      ],
      createMockTheme()
    );
    // Only the third section (index 2) should get the lazy loading penalty
    const lazyPenalties = result.speed.penalties.filter(p => p.reason.includes('Lazy Loading'));
    expect(lazyPenalties).toHaveLength(1);
    expect(lazyPenalties[0].section).toBe('testimonials');
    expect(lazyPenalties[0].points).toBe(5);
  });

  it('should penalize external scripts proportionally, capped at 10', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'analytics', externalScripts: 2 })],
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.reason.includes('externe Scripts'));
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(6); // 2 * 3 = 6

    const result2 = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'heavy', externalScripts: 10 })],
      createMockTheme()
    );
    const penalty2 = result2.speed.penalties.find(p => p.reason.includes('externe Scripts'));
    expect(penalty2!.points).toBe(10); // capped at 10
  });

  it('should penalize heavy animations (animations + complexity > 50)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'banner', hasAnimations: true, complexityScore: 51 })],
      createMockTheme()
    );
    expect(result.speed.penalties.some(p => p.reason.includes('Animationen'))).toBe(true);
  });

  it('should NOT penalize animations when complexity <= 50', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'banner', hasAnimations: true, complexityScore: 50 })],
      createMockTheme()
    );
    expect(result.speed.penalties.some(p => p.reason.includes('Animationen'))).toBe(false);
  });

  it('should penalize > 15 sections with 10 points', () => {
    const manySections = Array(16).fill(null).map((_, i) =>
      createMockSection({ name: `section-${i}` })
    );
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      manySections,
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.reason.includes('Zu viele Sections'));
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(10);
  });

  it('should penalize 13-15 sections with 5 points', () => {
    const sections = Array(13).fill(null).map((_, i) =>
      createMockSection({ name: `section-${i}` })
    );
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      sections,
      createMockTheme()
    );
    const penalty = result.speed.penalties.find(p => p.reason.includes('Viele Sections'));
    expect(penalty).toBeDefined();
    expect(penalty!.points).toBe(5);
  });

  it('should NOT penalize <= 12 sections', () => {
    const sections = Array(12).fill(null).map((_, i) =>
      createMockSection({ name: `section-${i}` })
    );
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      sections,
      createMockTheme()
    );
    expect(result.speed.penalties.some(p => p.reason.includes('Sections ('))).toBe(false);
  });

  it('should not go below 0 for section load score', () => {
    const terribleSections = Array(20).fill(null).map((_, i) =>
      createMockSection({
        name: `section-${i}`,
        type: 'instagram',
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
    it('should score 100 when sections have no issues', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 80, complexityScore: 20, liquidLoops: 1, liquidAssigns: 3, inlineStyles: 0 })],
        createMockTheme()
      );
      expect(result.quality.liquidQuality).toBe(100);
      expect(result.quality.issues).toHaveLength(0);
    });

    it('should penalize very long files (>400 lines) with severity high', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 500 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Sehr lange Datei'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('high');
    });

    it('should penalize medium-long files (201-400 lines) with severity medium', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 250 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Lange Datei'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('medium');
    });

    it('should NOT penalize files with <= 200 lines', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ linesOfCode: 200 })],
        createMockTheme()
      );
      expect(result.quality.issues.some(i => i.issue.includes('Datei'))).toBe(false);
    });

    it('should penalize nested loops (liquidLoops > 3 AND complexity > 60)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidLoops: 4, complexityScore: 65 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Verschachtelte Loops'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('high');
    });

    it('should penalize many loops (liquidLoops > 2, but not nested)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidLoops: 3, complexityScore: 40 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Viele Loops'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('medium');
    });

    it('should NOT penalize loops when liquidLoops <= 2', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidLoops: 2, complexityScore: 30 })],
        createMockTheme()
      );
      expect(result.quality.issues.some(i => i.issue.includes('Loop'))).toBe(false);
    });

    it('should penalize too many assigns (> 20) with severity medium', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidAssigns: 25 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Assigns'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('medium');
    });

    it('should apply minor penalty for assigns 11-20 without issue', () => {
      const resultWith15 = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidAssigns: 15 })],
        createMockTheme()
      );
      const resultWith5 = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ liquidAssigns: 5 })],
        createMockTheme()
      );
      // 15 assigns causes -5 penalty, no issue created
      expect(resultWith15.quality.issues.some(i => i.issue.includes('Assigns'))).toBe(false);
      expect(resultWith15.quality.liquidQuality).toBeLessThan(resultWith5.quality.liquidQuality);
    });

    it('should penalize many inline styles (> 5) with severity low', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ inlineStyles: 10 })],
        createMockTheme()
      );
      const issue = result.quality.issues.find(i => i.issue.includes('Inline Styles'));
      expect(issue).toBeDefined();
      expect(issue!.severity).toBe('low');
    });

    it('should apply minor penalty for 1-5 inline styles without issue', () => {
      const withStyles = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ inlineStyles: 3 })],
        createMockTheme()
      );
      const withoutStyles = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ inlineStyles: 0 })],
        createMockTheme()
      );
      expect(withStyles.quality.issues.some(i => i.issue.includes('Inline'))).toBe(false);
      expect(withStyles.quality.liquidQuality).toBeLessThan(withoutStyles.quality.liquidQuality);
    });

    it('should penalize high complexity (> 70) with severity high', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ complexityScore: 75 })],
        createMockTheme()
      );
      expect(result.quality.issues.some(i =>
        i.issue.includes('Hohe Code-Komplexität') && i.severity === 'high'
      )).toBe(true);
    });

    it('should penalize medium complexity (51-70) with severity medium', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ complexityScore: 55 })],
        createMockTheme()
      );
      expect(result.quality.issues.some(i =>
        i.issue.includes('Mittlere Code-Komplexität') && i.severity === 'medium'
      )).toBe(true);
    });

    it('should NOT penalize complexity <= 50', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ complexityScore: 50 })],
        createMockTheme()
      );
      expect(result.quality.issues.some(i => i.issue.includes('Komplexität'))).toBe(false);
    });

    it('should average quality across multiple sections', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [
          createMockSection({ name: 'good', linesOfCode: 50, complexityScore: 10 }),
          createMockSection({ name: 'bad', linesOfCode: 500, complexityScore: 80 }),
        ],
        createMockTheme()
      );
      // Good section ~100, bad section much lower; average should be between
      expect(result.quality.liquidQuality).toBeGreaterThan(30);
      expect(result.quality.liquidQuality).toBeLessThan(90);
    });

    it('should clamp individual section scores to 0 minimum', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({
          linesOfCode: 500,        // -20
          liquidLoops: 5,          // -25 (nested)
          complexityScore: 80,     // -15
          liquidAssigns: 25,       // -15
          inlineStyles: 10,        // -10
          // total: -85 from 100 = 15
        })],
        createMockTheme()
      );
      expect(result.quality.liquidQuality).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Best Practices', () => {
    it('should penalize < 50% lazy loading adoption by 20 points', () => {
      const sections = [
        createMockSection({ hasLazyLoading: false, hasResponsiveImages: true, hasPreload: true }),
        createMockSection({ hasLazyLoading: false, hasResponsiveImages: true }),
        createMockSection({ hasLazyLoading: false, hasResponsiveImages: true }),
      ];
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBeLessThanOrEqual(80);
    });

    it('should penalize < 70% lazy loading adoption by 10 points', () => {
      const sections = [
        createMockSection({ hasLazyLoading: true, hasResponsiveImages: true, hasPreload: true }),
        createMockSection({ hasLazyLoading: true, hasResponsiveImages: true }),
        createMockSection({ hasLazyLoading: false, hasResponsiveImages: true }),
      ];
      // 2/3 = 66.7% < 70%
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBeLessThanOrEqual(90);
    });

    it('should NOT penalize >= 70% lazy loading adoption', () => {
      const sections = [
        createMockSection({ hasLazyLoading: true, hasResponsiveImages: true, hasPreload: true }),
        createMockSection({ hasLazyLoading: true, hasResponsiveImages: true }),
        createMockSection({ hasLazyLoading: true, hasResponsiveImages: true }),
      ];
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBe(100);
    });

    it('should penalize < 30% responsive images adoption by 15 points', () => {
      const sections = [
        createMockSection({ hasResponsiveImages: false, hasLazyLoading: true, hasPreload: true }),
        createMockSection({ hasResponsiveImages: false, hasLazyLoading: true }),
        createMockSection({ hasResponsiveImages: false, hasLazyLoading: true }),
        createMockSection({ hasResponsiveImages: false, hasLazyLoading: true }),
      ];
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBeLessThanOrEqual(85);
    });

    it('should penalize no preload usage by 10 points', () => {
      const sections = [
        createMockSection({ hasPreload: false, hasLazyLoading: true, hasResponsiveImages: true }),
      ];
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBe(90);
    });

    it('should NOT penalize when at least one section has preload', () => {
      const sections = [
        createMockSection({ hasPreload: true, hasLazyLoading: true, hasResponsiveImages: true }),
        createMockSection({ hasPreload: false, hasLazyLoading: true, hasResponsiveImages: true }),
      ];
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        sections,
        createMockTheme()
      );
      expect(result.quality.bestPractices).toBe(100);
    });
  });

  describe('Architecture', () => {
    it('should penalize too few snippets (< 3) by 15 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 2 })
      );
      expect(result.quality.architecture).toBeLessThanOrEqual(85);
    });

    it('should give bonus for good snippet usage (>= 5), visible when other penalties apply', () => {
      // Use hasTranslations: false to add a -10 penalty, so the +5 bonus becomes visible
      const goodSnippets = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 10, hasTranslations: false })
      );
      const fewSnippets = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 4, hasTranslations: false })
      );
      // goodSnippets: 100 + 5 - 10 = 95; fewSnippets: 100 - 10 = 90
      expect(goodSnippets.quality.architecture).toBeGreaterThan(fewSnippets.quality.architecture);
      expect(goodSnippets.quality.architecture).toBe(95);
      expect(fewSnippets.quality.architecture).toBe(90);
    });

    it('should cap architecture score at 100', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ snippetsCount: 20, hasTranslations: true, totalSections: 5, sectionsAboveFold: 2 })
      );
      expect(result.quality.architecture).toBeLessThanOrEqual(100);
    });

    it('should penalize missing translations by 10 points', () => {
      // Use snippetsCount=4 (no bonus, no penalty) to isolate the translations effect
      const withTranslations = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ hasTranslations: true, snippetsCount: 4 })
      );
      const withoutTranslations = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ hasTranslations: false, snippetsCount: 4 })
      );
      // with: 100, without: 90
      expect(withTranslations.quality.architecture - withoutTranslations.quality.architecture).toBe(10);
    });

    it('should penalize > 20 total sections by 15 points', () => {
      // Use snippetsCount=4 to avoid the +5 bonus masking penalties
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ totalSections: 25, snippetsCount: 4 })
      );
      const baseline = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ totalSections: 10, snippetsCount: 4 })
      );
      expect(baseline.quality.architecture - result.quality.architecture).toBe(15);
    });

    it('should penalize 16-20 total sections by 8 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ totalSections: 18, snippetsCount: 4 })
      );
      const baseline = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ totalSections: 10, snippetsCount: 4 })
      );
      expect(baseline.quality.architecture - result.quality.architecture).toBe(8);
    });

    it('should penalize > 4 sections above fold by 10 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ sectionsAboveFold: 5, snippetsCount: 4 })
      );
      const baseline = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme({ sectionsAboveFold: 3, snippetsCount: 4 })
      );
      expect(baseline.quality.architecture - result.quality.architecture).toBe(10);
    });
  });

  describe('Quality Score Composition', () => {
    it('should weight liquidQuality 50%, bestPractices 30%, architecture 20%', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme()
      );
      const expected = Math.round(
        result.quality.liquidQuality * 0.5 +
        result.quality.bestPractices * 0.3 +
        result.quality.architecture * 0.2
      );
      expect(result.quality.score).toBe(expected);
    });
  });
});

// ============================================
// CONVERSION SCORING TESTS
// ============================================

describe('Conversion Scoring', () => {
  describe('E-commerce Score', () => {
    it('should start with base score of 70', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'generic', type: 'custom' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(70);
    });

    it('should add 10 points for having a hero section', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'hero', type: 'hero' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(80);
    });

    it('should detect hero by name when type is not hero', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'my-hero-section', type: 'custom' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(80);
    });

    it('should add 10 points for product grid', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'featured-products', type: 'product_grid' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(80);
    });

    it('should detect product grid by name containing "product"', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'best-products', type: 'custom' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(80);
    });

    it('should add 5 points for testimonials', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'customer-reviews', type: 'testimonials' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(75);
    });

    it('should detect testimonials by name containing "review"', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'review-carousel', type: 'custom' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(75);
    });

    it('should add 5 points for newsletter', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'newsletter', type: 'newsletter' })],
        createMockTheme()
      );
      expect(result.conversion.ecommerce).toBe(75);
    });

    it('should cap ecommerce score at 100 with all elements', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [
          createMockSection({ name: 'hero', type: 'hero', complexityScore: 20 }),
          createMockSection({ name: 'products', type: 'product_grid' }),
          createMockSection({ name: 'reviews', type: 'testimonials' }),
          createMockSection({ name: 'newsletter', type: 'newsletter' }),
        ],
        createMockTheme()
      );
      // 70 + 10 + 10 + 5 + 5 = 100
      expect(result.conversion.ecommerce).toBe(100);
    });

    it('should penalize complex hero section (complexity > 60)', () => {
      const simple = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'hero', type: 'hero', complexityScore: 30 })],
        createMockTheme()
      );
      const complex = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection({ name: 'hero', type: 'hero', complexityScore: 70 })],
        createMockTheme()
      );
      expect(complex.conversion.ecommerce).toBe(simple.conversion.ecommerce - 10);
    });
  });

  describe('Mobile Score', () => {
    it('should return 70 when no vitals (null)', () => {
      const result = calculateThemeMetricsScore(
        null,
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(70);
    });

    it('should score 100 with perfect vitals', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1000, tbt: 100, cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(100);
    });

    it('should penalize LCP > 3000ms by 20 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 3500, tbt: 100, cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(80);
    });

    it('should penalize LCP 2501-3000ms by 10 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 2800, tbt: 100, cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(90);
    });

    it('should penalize TBT > 400ms by 15 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1000, tbt: 500, cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(85);
    });

    it('should penalize TBT 201-400ms by 8 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1000, tbt: 300, cls: 0.05 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(92);
    });

    it('should penalize CLS > 0.15 by 15 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1000, tbt: 100, cls: 0.2 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(85);
    });

    it('should penalize CLS 0.11-0.15 by 8 points', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1000, tbt: 100, cls: 0.12 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.mobile).toBe(92);
    });

    it('should accumulate multiple mobile penalties', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 4000, tbt: 500, cls: 0.3 }),
        [createMockSection()],
        createMockTheme()
      );
      // -20 (lcp) -15 (tbt) -15 (cls) = 50
      expect(result.conversion.mobile).toBe(50);
    });
  });

  describe('Revenue Impact', () => {
    it('should estimate zero loss when load time < 2000ms', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1500 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.estimatedMonthlyLoss).toBe(0);
    });

    it('should estimate zero loss when load time = 2000ms', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 2000 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.estimatedMonthlyLoss).toBe(0);
    });

    it('should calculate loss for load time > 2000ms', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        10000
      );
      // 3 seconds excess * 7% per second = 21% loss * 10000 = 2100
      expect(result.conversion.estimatedMonthlyLoss).toBe(2100);
    });

    it('should use default revenue of 15000 when not provided', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 3000 }),
        [createMockSection()],
        createMockTheme()
      );
      // 1 second excess * 7% = 7% * 15000 = 1050
      expect(result.conversion.estimatedMonthlyLoss).toBe(1050);
    });

    it('should scale loss with monthly revenue', () => {
      const highRev = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        100000
      );
      const lowRev = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        10000
      );
      expect(highRev.conversion.estimatedMonthlyLoss).toBe(lowRev.conversion.estimatedMonthlyLoss * 10);
    });

    it('should fall back to default revenue when zero is passed (falsy)', () => {
      // The code uses `monthlyRevenue || 15000`, so 0 is treated as falsy and defaults to 15000
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 5000 }),
        [createMockSection()],
        createMockTheme(),
        0
      );
      // 3s excess * 7% = 21% * 15000 = 3150
      expect(result.conversion.estimatedMonthlyLoss).toBe(3150);
    });

    it('should use lcp as load time when vitals present', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 4000 }),
        [createMockSection()],
        createMockTheme(),
        10000
      );
      // 2 seconds excess * 7% = 14% * 10000 = 1400
      expect(result.conversion.estimatedMonthlyLoss).toBe(1400);
    });

    it('should default to 3000ms load time when vitals are null', () => {
      const result = calculateThemeMetricsScore(
        null,
        [createMockSection()],
        createMockTheme(),
        10000
      );
      // 1 second excess (3000 - 2000) * 7% = 7% * 10000 = 700
      expect(result.conversion.estimatedMonthlyLoss).toBe(700);
    });

    it('should score 100 when no conversion loss', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 1500 }),
        [createMockSection()],
        createMockTheme()
      );
      expect(result.conversion.revenueImpact).toBe(100);
    });

    it('should score 85 for small conversion loss (< 7%)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 2500 }),
        [createMockSection()],
        createMockTheme()
      );
      // 0.5s excess * 7% = 3.5% loss -> score 85
      expect(result.conversion.revenueImpact).toBe(85);
    });

    it('should score 70 for moderate conversion loss (7-14%)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 3500 }),
        [createMockSection()],
        createMockTheme()
      );
      // 1.5s excess * 7% = 10.5% loss -> score 70
      expect(result.conversion.revenueImpact).toBe(70);
    });

    it('should score 50 for high conversion loss (14-21%)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 4500 }),
        [createMockSection()],
        createMockTheme()
      );
      // 2.5s excess * 7% = 17.5% loss -> between 14% and 21%, score 50
      expect(result.conversion.revenueImpact).toBe(50);
    });

    it('should score 30 for very high conversion loss (> 21%)', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals({ lcp: 6000 }),
        [createMockSection()],
        createMockTheme()
      );
      // 4s excess * 7% = 28% -> score 30
      expect(result.conversion.revenueImpact).toBe(30);
    });
  });

  describe('Conversion Score Composition', () => {
    it('should weight ecommerce 50%, mobile 30%, revenueImpact 20%', () => {
      const result = calculateThemeMetricsScore(
        createMockVitals(),
        [createMockSection()],
        createMockTheme()
      );
      const expected = Math.round(
        result.conversion.ecommerce * 0.5 +
        result.conversion.mobile * 0.3 +
        result.conversion.revenueImpact * 0.2
      );
      expect(result.conversion.score).toBe(expected);
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

  it('should weight speed 40%, quality 35%, conversion 25%', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );
    const expectedOverall = Math.round(
      result.speed.score * 0.40 +
      result.quality.score * 0.35 +
      result.conversion.score * 0.25
    );
    expect(result.overall).toBe(expectedOverall);
  });

  it('should compose speed score as 60% CWV + 40% sectionLoad', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );
    const expected = Math.round(
      result.speed.coreWebVitals * 0.6 + result.speed.sectionLoad * 0.4
    );
    expect(result.speed.score).toBe(expected);
  });

  it('should handle missing vitals gracefully with defaults', () => {
    const result = calculateThemeMetricsScore(
      null,
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.coreWebVitals).toBe(50);
    expect(result.speed.details.lcp.status).toBe('warning');
    expect(result.speed.details.cls.status).toBe('warning');
    expect(result.speed.details.fcp.status).toBe('warning');
    expect(result.speed.details.tbt.status).toBe('warning');
    expect(result.speed.details.lcp.value).toBe(0);
    expect(result.speed.details.lcp.score).toBe(50);
  });

  it('should handle empty sections array', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [],
      createMockTheme()
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.quality.liquidQuality).toBe(100);
    expect(result.speed.sectionLoad).toBe(100);
    expect(result.speed.penalties).toHaveLength(0);
    expect(result.quality.issues).toHaveLength(0);
  });

  it('should handle single section', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection({ name: 'hero', type: 'hero' })],
      createMockTheme()
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('should handle many sections without crashing', () => {
    const sections = Array(50).fill(null).map((_, i) =>
      createMockSection({ name: `section-${i}` })
    );
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      sections,
      createMockTheme()
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('should produce high score for well-optimized theme with perfect CWV', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 1200, cls: 0.02, fcp: 800, tbt: 50 }),
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
        createMockSection({
          name: 'reviews',
          type: 'testimonials',
          hasLazyLoading: true,
          hasResponsiveImages: true,
        }),
        createMockSection({
          name: 'newsletter',
          type: 'newsletter',
          hasLazyLoading: true,
          hasResponsiveImages: true,
        }),
      ],
      createMockTheme({ snippetsCount: 8, hasTranslations: true })
    );
    expect(result.overall).toBeGreaterThan(85);
  });

  it('should produce low score for poorly-optimized theme with terrible CWV', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 8000, cls: 0.5, fcp: 6000, tbt: 2000 }),
      [
        createMockSection({
          name: 'hero',
          hasVideo: true,
          externalScripts: 5,
          hasLazyLoading: false,
          hasResponsiveImages: false,
          linesOfCode: 600,
          complexityScore: 85,
          liquidLoops: 5,
          liquidAssigns: 25,
          inlineStyles: 15,
        }),
      ],
      createMockTheme({ snippetsCount: 0, hasTranslations: false, totalSections: 25, sectionsAboveFold: 6 })
    );
    expect(result.overall).toBeLessThan(40);
  });

  it('should produce reasonable default score without vitals (heuristic mode)', () => {
    const result = calculateThemeMetricsScore(
      null,
      [
        createMockSection({ name: 'hero', type: 'hero', hasPreload: true }),
        createMockSection({ name: 'products', type: 'product_grid' }),
      ],
      createMockTheme()
    );
    // Without vitals, CWV defaults to 50, rest should be reasonable
    expect(result.overall).toBeGreaterThan(40);
    expect(result.overall).toBeLessThan(90);
  });

  it('should include all expected fields in the result', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals(),
      [createMockSection()],
      createMockTheme()
    );

    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('speed.score');
    expect(result).toHaveProperty('speed.coreWebVitals');
    expect(result).toHaveProperty('speed.sectionLoad');
    expect(result).toHaveProperty('speed.details');
    expect(result).toHaveProperty('speed.details.lcp');
    expect(result).toHaveProperty('speed.details.cls');
    expect(result).toHaveProperty('speed.details.fcp');
    expect(result).toHaveProperty('speed.details.tbt');
    expect(result).toHaveProperty('speed.penalties');
    expect(result).toHaveProperty('quality.score');
    expect(result).toHaveProperty('quality.liquidQuality');
    expect(result).toHaveProperty('quality.bestPractices');
    expect(result).toHaveProperty('quality.architecture');
    expect(result).toHaveProperty('quality.issues');
    expect(result).toHaveProperty('conversion.score');
    expect(result).toHaveProperty('conversion.ecommerce');
    expect(result).toHaveProperty('conversion.mobile');
    expect(result).toHaveProperty('conversion.revenueImpact');
    expect(result).toHaveProperty('conversion.estimatedMonthlyLoss');
  });

  it('should return integer scores (no decimals)', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 3333, cls: 0.17, fcp: 2222, tbt: 444 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(Number.isInteger(result.overall)).toBe(true);
    expect(Number.isInteger(result.speed.score)).toBe(true);
    expect(Number.isInteger(result.speed.coreWebVitals)).toBe(true);
    expect(Number.isInteger(result.quality.score)).toBe(true);
    expect(Number.isInteger(result.conversion.score)).toBe(true);
  });
});

// ============================================
// getScoreStatus TESTS
// ============================================

describe('getScoreStatus', () => {
  it('should return Exzellent for score = 100', () => {
    const result = getScoreStatus(100);
    expect(result.label).toBe('Exzellent');
    expect(result.color).toBe('text-emerald-600');
    expect(result.bgColor).toBe('bg-emerald-50');
  });

  it('should return Exzellent for score = 90 (lower boundary)', () => {
    const result = getScoreStatus(90);
    expect(result.label).toBe('Exzellent');
  });

  it('should return Exzellent for score = 95', () => {
    const result = getScoreStatus(95);
    expect(result.label).toBe('Exzellent');
    expect(result.description).toBeTruthy();
  });

  it('should return Gut for score = 89 (upper boundary of Gut)', () => {
    const result = getScoreStatus(89);
    expect(result.label).toBe('Gut');
    expect(result.color).toBe('text-green-600');
    expect(result.bgColor).toBe('bg-green-50');
  });

  it('should return Gut for score = 70 (lower boundary)', () => {
    const result = getScoreStatus(70);
    expect(result.label).toBe('Gut');
  });

  it('should return Gut for score = 75', () => {
    const result = getScoreStatus(75);
    expect(result.label).toBe('Gut');
    expect(result.description).toBeTruthy();
  });

  it('should return Verbesserungswuerdig for score = 69', () => {
    const result = getScoreStatus(69);
    expect(result.label).toBe('Verbesserungswürdig');
    expect(result.color).toBe('text-amber-600');
    expect(result.bgColor).toBe('bg-amber-50');
  });

  it('should return Verbesserungswuerdig for score = 50 (lower boundary)', () => {
    const result = getScoreStatus(50);
    expect(result.label).toBe('Verbesserungswürdig');
  });

  it('should return Verbesserungswuerdig for score = 55', () => {
    const result = getScoreStatus(55);
    expect(result.label).toBe('Verbesserungswürdig');
    expect(result.description).toBeTruthy();
  });

  it('should return Kritisch for score = 49', () => {
    const result = getScoreStatus(49);
    expect(result.label).toBe('Kritisch');
    expect(result.color).toBe('text-red-600');
    expect(result.bgColor).toBe('bg-red-50');
  });

  it('should return Kritisch for score = 0', () => {
    const result = getScoreStatus(0);
    expect(result.label).toBe('Kritisch');
  });

  it('should return Kritisch for score = 30', () => {
    const result = getScoreStatus(30);
    expect(result.label).toBe('Kritisch');
    expect(result.description).toBeTruthy();
  });

  it('should always return color, bgColor, and description', () => {
    for (const score of [0, 25, 49, 50, 69, 70, 89, 90, 100]) {
      const result = getScoreStatus(score);
      expect(result.color).toBeTruthy();
      expect(result.bgColor).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(result.label).toBeTruthy();
    }
  });
});

// ============================================
// formatMetricValue TESTS
// ============================================

describe('formatMetricValue', () => {
  describe('LCP formatting', () => {
    it('should format LCP in seconds with 1 decimal', () => {
      expect(formatMetricValue('lcp', 2500)).toBe('2.5s');
    });

    it('should format LCP with trailing zero', () => {
      expect(formatMetricValue('lcp', 1000)).toBe('1.0s');
    });

    it('should format LCP = 0', () => {
      expect(formatMetricValue('lcp', 0)).toBe('0.0s');
    });

    it('should format small LCP values', () => {
      expect(formatMetricValue('lcp', 500)).toBe('0.5s');
    });

    it('should format large LCP values', () => {
      expect(formatMetricValue('lcp', 15000)).toBe('15.0s');
    });
  });

  describe('FCP formatting', () => {
    it('should format FCP in seconds with 1 decimal', () => {
      expect(formatMetricValue('fcp', 1800)).toBe('1.8s');
    });

    it('should format FCP = 0', () => {
      expect(formatMetricValue('fcp', 0)).toBe('0.0s');
    });

    it('should format FCP with precision', () => {
      expect(formatMetricValue('fcp', 2345)).toBe('2.3s');
    });
  });

  describe('CLS formatting', () => {
    it('should format CLS with 2 decimal places', () => {
      expect(formatMetricValue('cls', 0.1)).toBe('0.10');
    });

    it('should format small CLS', () => {
      expect(formatMetricValue('cls', 0.05)).toBe('0.05');
    });

    it('should format CLS = 0', () => {
      expect(formatMetricValue('cls', 0)).toBe('0.00');
    });

    it('should format large CLS', () => {
      expect(formatMetricValue('cls', 1.5)).toBe('1.50');
    });

    it('should format CLS with many decimals', () => {
      expect(formatMetricValue('cls', 0.123456)).toBe('0.12');
    });
  });

  describe('TBT formatting', () => {
    it('should format TBT in milliseconds (rounded)', () => {
      expect(formatMetricValue('tbt', 200)).toBe('200ms');
    });

    it('should round TBT to nearest integer', () => {
      expect(formatMetricValue('tbt', 350.5)).toBe('351ms');
    });

    it('should format TBT = 0', () => {
      expect(formatMetricValue('tbt', 0)).toBe('0ms');
    });

    it('should format large TBT', () => {
      expect(formatMetricValue('tbt', 5000)).toBe('5000ms');
    });

    it('should round down when appropriate', () => {
      expect(formatMetricValue('tbt', 199.4)).toBe('199ms');
    });
  });

  describe('Unknown metric', () => {
    it('should return string representation for unknown metrics', () => {
      expect(formatMetricValue('unknown', 123)).toBe('123');
    });

    it('should handle decimal values for unknown metrics', () => {
      expect(formatMetricValue('foo', 42.5)).toBe('42.5');
    });

    it('should handle zero for unknown metrics', () => {
      expect(formatMetricValue('bar', 0)).toBe('0');
    });
  });
});

// ============================================
// EDGE CASES AND INTEGRATION
// ============================================

describe('Edge Cases', () => {
  it('should handle zero values in all vitals', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 0, cls: 0, fcp: 0, tbt: 0 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.coreWebVitals).toBe(100);
  });

  it('should handle very large values in vitals without crashing', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 100000, cls: 10, fcp: 100000, tbt: 100000 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.speed.coreWebVitals).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeGreaterThanOrEqual(0);
  });

  it('should handle negative vitals gracefully', () => {
    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: -100, cls: -0.1, fcp: -100, tbt: -100 }),
      [createMockSection()],
      createMockTheme()
    );
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('should handle section with every penalty condition active', () => {
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

    expect(result.speed.penalties.length).toBeGreaterThan(2);
    expect(result.quality.issues.length).toBeGreaterThan(3);
    expect(result.overall).toBeLessThanOrEqual(70);
  });

  it('should produce stable results for the same input', () => {
    const vitals = createMockVitals({ lcp: 3000, cls: 0.15, fcp: 2000, tbt: 300 });
    const sections = [createMockSection()];
    const theme = createMockTheme();

    const result1 = calculateThemeMetricsScore(vitals, sections, theme);
    const result2 = calculateThemeMetricsScore(vitals, sections, theme);

    expect(result1.overall).toBe(result2.overall);
    expect(result1.speed.score).toBe(result2.speed.score);
    expect(result1.quality.score).toBe(result2.quality.score);
    expect(result1.conversion.score).toBe(result2.conversion.score);
  });

  it('should handle realistic Shopify theme with mixed sections', () => {
    const sections = [
      createMockSection({ name: 'header', type: 'header', complexityScore: 45, hasPreload: true }),
      createMockSection({ name: 'hero-banner', type: 'hero', hasResponsiveImages: true, hasPreload: true }),
      createMockSection({ name: 'featured-products', type: 'product_grid', hasLazyLoading: true, hasResponsiveImages: true }),
      createMockSection({ name: 'image-with-text', type: 'image_with_text', hasLazyLoading: true }),
      createMockSection({ name: 'customer-reviews', type: 'testimonials', hasLazyLoading: true }),
      createMockSection({ name: 'newsletter', type: 'newsletter', hasLazyLoading: true }),
      createMockSection({ name: 'footer', type: 'footer', hasLazyLoading: true }),
    ];

    const result = calculateThemeMetricsScore(
      createMockVitals({ lcp: 2200, cls: 0.08, fcp: 1600, tbt: 180 }),
      sections,
      createMockTheme({ totalSections: 7, snippetsCount: 6, hasTranslations: true, sectionsAboveFold: 2 })
    );

    expect(result.overall).toBeGreaterThan(70);
    expect(result.overall).toBeLessThanOrEqual(100);
  });
});
