/**
 * ThemeMetrics Score Calculator
 * 
 * Ein proprietärer Score der drei Dimensionen kombiniert:
 * - Speed (40%): Core Web Vitals + Section Load Impact
 * - Quality (35%): Liquid Code + Best Practices + Architecture
 * - Conversion (25%): E-Commerce + Mobile UX + Revenue Impact
 */

// ============================================
// TYPES
// ============================================

export interface CoreWebVitals {
  lcp: number;  // Largest Contentful Paint in ms
  cls: number;  // Cumulative Layout Shift
  fcp: number;  // First Contentful Paint in ms
  tbt: number;  // Total Blocking Time in ms
  inp?: number; // Interaction to Next Paint in ms (optional)
}

export interface SectionAnalysisData {
  name: string;
  type: string;
  linesOfCode: number;
  complexityScore: number;
  hasVideo: boolean;
  hasAnimations: boolean;
  hasLazyLoading: boolean;
  hasResponsiveImages?: boolean;
  hasPreload?: boolean;
  liquidLoops: number;
  liquidAssigns: number;
  liquidConditions: number;
  externalScripts: number;
  inlineStyles: number;
}

export interface ThemeData {
  totalSections: number;
  snippetsCount: number;
  hasTranslations: boolean;
  sectionsAboveFold: number;
}

export interface ScoreBreakdown {
  overall: number;
  speed: {
    score: number;
    coreWebVitals: number;
    sectionLoad: number;
    details: {
      lcp: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      cls: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      fcp: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      tbt: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
    };
    penalties: Array<{ section: string; reason: string; points: number }>;
  };
  quality: {
    score: number;
    liquidQuality: number;
    bestPractices: number;
    architecture: number;
    issues: Array<{ section: string; issue: string; severity: 'high' | 'medium' | 'low' }>;
  };
  conversion: {
    score: number;
    ecommerce: number;
    mobile: number;
    revenueImpact: number;
    estimatedMonthlyLoss: number;
  };
}

// ============================================
// CORE WEB VITALS SCORING
// ============================================

function scoreLCP(lcp: number): { score: number; status: 'good' | 'warning' | 'poor' } {
  if (lcp <= 2500) {
    return { score: 100, status: 'good' };
  } else if (lcp <= 4000) {
    // Linear interpolation from 100 to 50
    const score = 100 - ((lcp - 2500) / 1500) * 50;
    return { score: Math.round(score), status: 'warning' };
  } else {
    // Linear interpolation from 50 to 0
    const score = Math.max(0, 50 - ((lcp - 4000) / 4000) * 50);
    return { score: Math.round(score), status: 'poor' };
  }
}

function scoreCLS(cls: number): { score: number; status: 'good' | 'warning' | 'poor' } {
  if (cls <= 0.1) {
    return { score: 100, status: 'good' };
  } else if (cls <= 0.25) {
    const score = 100 - ((cls - 0.1) / 0.15) * 50;
    return { score: Math.round(score), status: 'warning' };
  } else {
    const score = Math.max(0, 50 - ((cls - 0.25) / 0.25) * 50);
    return { score: Math.round(score), status: 'poor' };
  }
}

function scoreFCP(fcp: number): { score: number; status: 'good' | 'warning' | 'poor' } {
  if (fcp <= 1800) {
    return { score: 100, status: 'good' };
  } else if (fcp <= 3000) {
    const score = 100 - ((fcp - 1800) / 1200) * 50;
    return { score: Math.round(score), status: 'warning' };
  } else {
    const score = Math.max(0, 50 - ((fcp - 3000) / 3000) * 50);
    return { score: Math.round(score), status: 'poor' };
  }
}

function scoreTBT(tbt: number): { score: number; status: 'good' | 'warning' | 'poor' } {
  if (tbt <= 200) {
    return { score: 100, status: 'good' };
  } else if (tbt <= 600) {
    const score = 100 - ((tbt - 200) / 400) * 50;
    return { score: Math.round(score), status: 'warning' };
  } else {
    const score = Math.max(0, 50 - ((tbt - 600) / 1000) * 50);
    return { score: Math.round(score), status: 'poor' };
  }
}

function calculateCoreWebVitalsScore(vitals: CoreWebVitals): {
  score: number;
  details: ScoreBreakdown['speed']['details'];
} {
  const lcpResult = scoreLCP(vitals.lcp);
  const clsResult = scoreCLS(vitals.cls);
  const fcpResult = scoreFCP(vitals.fcp);
  const tbtResult = scoreTBT(vitals.tbt);

  // Weighted average: LCP 35%, CLS 25%, TBT 25%, FCP 15%
  const score = Math.round(
    lcpResult.score * 0.35 +
    clsResult.score * 0.25 +
    tbtResult.score * 0.25 +
    fcpResult.score * 0.15
  );

  return {
    score,
    details: {
      lcp: { value: vitals.lcp, ...lcpResult },
      cls: { value: vitals.cls, ...clsResult },
      fcp: { value: vitals.fcp, ...fcpResult },
      tbt: { value: vitals.tbt, ...tbtResult },
    },
  };
}

// ============================================
// SECTION LOAD IMPACT SCORING
// ============================================

function calculateSectionLoadScore(sections: SectionAnalysisData[]): {
  score: number;
  penalties: Array<{ section: string; reason: string; points: number }>;
} {
  let score = 100;
  const penalties: Array<{ section: string; reason: string; points: number }> = [];

  sections.forEach((section, index) => {
    // Video in hero (first section) - major penalty
    if (index === 0 && section.hasVideo) {
      penalties.push({ section: section.name, reason: 'Video in Hero Section (autoplay)', points: 15 });
      score -= 15;
    }
    
    // Video in other sections - smaller penalty
    if (index > 0 && section.hasVideo) {
      penalties.push({ section: section.name, reason: 'Video ohne Lazy Load', points: 8 });
      score -= 8;
    }

    // Instagram/Social embeds (detected by type or name)
    if (section.type === 'instagram' || section.name.toLowerCase().includes('instagram') || section.name.toLowerCase().includes('social')) {
      penalties.push({ section: section.name, reason: 'Externer Social Media Embed', points: 10 });
      score -= 10;
    }

    // Missing lazy loading for below-fold sections
    if (index >= 2 && !section.hasLazyLoading) {
      penalties.push({ section: section.name, reason: 'Fehlendes Lazy Loading', points: 5 });
      score -= 5;
    }

    // External scripts
    if (section.externalScripts > 0) {
      const penalty = Math.min(section.externalScripts * 3, 10);
      penalties.push({ section: section.name, reason: `${section.externalScripts} externe Scripts`, points: penalty });
      score -= penalty;
    }

    // Heavy animations
    if (section.hasAnimations && section.complexityScore > 50) {
      penalties.push({ section: section.name, reason: 'Schwere Animationen', points: 5 });
      score -= 5;
    }
  });

  // Too many sections penalty
  if (sections.length > 15) {
    penalties.push({ section: 'Theme', reason: `Zu viele Sections (${sections.length})`, points: 10 });
    score -= 10;
  } else if (sections.length > 12) {
    penalties.push({ section: 'Theme', reason: `Viele Sections (${sections.length})`, points: 5 });
    score -= 5;
  }

  return { score: Math.max(0, score), penalties };
}

// ============================================
// QUALITY SCORING
// ============================================

function calculateLiquidQualityScore(sections: SectionAnalysisData[]): {
  score: number;
  issues: Array<{ section: string; issue: string; severity: 'high' | 'medium' | 'low' }>;
} {
  let totalScore = 0;
  const issues: Array<{ section: string; issue: string; severity: 'high' | 'medium' | 'low' }> = [];

  sections.forEach(section => {
    let sectionScore = 100;

    // Lines of code penalty
    if (section.linesOfCode > 400) {
      sectionScore -= 20;
      issues.push({ section: section.name, issue: `Sehr lange Datei (${section.linesOfCode} Zeilen)`, severity: 'high' });
    } else if (section.linesOfCode > 200) {
      sectionScore -= 10;
      issues.push({ section: section.name, issue: `Lange Datei (${section.linesOfCode} Zeilen)`, severity: 'medium' });
    }

    // Nested loops penalty (approximated by high loop count + high complexity)
    if (section.liquidLoops > 3 && section.complexityScore > 60) {
      sectionScore -= 25;
      issues.push({ section: section.name, issue: 'Verschachtelte Loops erkannt', severity: 'high' });
    } else if (section.liquidLoops > 2) {
      sectionScore -= 10;
      issues.push({ section: section.name, issue: `Viele Loops (${section.liquidLoops})`, severity: 'medium' });
    }

    // Too many assigns
    if (section.liquidAssigns > 20) {
      sectionScore -= 15;
      issues.push({ section: section.name, issue: `Zu viele Assigns (${section.liquidAssigns})`, severity: 'medium' });
    } else if (section.liquidAssigns > 10) {
      sectionScore -= 5;
    }

    // Inline styles
    if (section.inlineStyles > 5) {
      sectionScore -= 10;
      issues.push({ section: section.name, issue: `Viele Inline Styles (${section.inlineStyles})`, severity: 'low' });
    } else if (section.inlineStyles > 0) {
      sectionScore -= 3;
    }

    // High complexity
    if (section.complexityScore > 70) {
      sectionScore -= 15;
      issues.push({ section: section.name, issue: 'Hohe Code-Komplexität', severity: 'high' });
    } else if (section.complexityScore > 50) {
      sectionScore -= 8;
      issues.push({ section: section.name, issue: 'Mittlere Code-Komplexität', severity: 'medium' });
    }

    totalScore += Math.max(0, sectionScore);
  });

  return {
    score: sections.length > 0 ? Math.round(totalScore / sections.length) : 100,
    issues,
  };
}

function calculateBestPracticesScore(sections: SectionAnalysisData[]): number {
  let score = 100;
  let sectionsWithLazyLoading = 0;
  let sectionsWithResponsiveImages = 0;
  let sectionsWithPreload = 0;

  sections.forEach(section => {
    if (section.hasLazyLoading) sectionsWithLazyLoading++;
    if (section.hasResponsiveImages) sectionsWithResponsiveImages++;
    if (section.hasPreload) sectionsWithPreload++;
  });

  const totalSections = sections.length || 1;

  // Lazy loading adoption (should be on most below-fold sections)
  const lazyLoadingRate = sectionsWithLazyLoading / totalSections;
  if (lazyLoadingRate < 0.5) {
    score -= 20;
  } else if (lazyLoadingRate < 0.7) {
    score -= 10;
  }

  // Responsive images
  const responsiveRate = sectionsWithResponsiveImages / totalSections;
  if (responsiveRate < 0.3) {
    score -= 15;
  } else if (responsiveRate < 0.5) {
    score -= 8;
  }

  // Preload for critical assets (at least first section)
  if (sectionsWithPreload === 0) {
    score -= 10;
  }

  return Math.max(0, score);
}

function calculateArchitectureScore(theme: ThemeData, sections: SectionAnalysisData[]): number {
  let score = 100;

  // Snippet usage (DRY principle)
  if (theme.snippetsCount < 3) {
    score -= 15; // Not using snippets enough
  } else if (theme.snippetsCount >= 5) {
    score += 5; // Good snippet usage (bonus, capped at 100 later)
  }

  // Translations
  if (!theme.hasTranslations) {
    score -= 10;
  }

  // Too many sections
  if (theme.totalSections > 20) {
    score -= 15;
  } else if (theme.totalSections > 15) {
    score -= 8;
  }

  // Sections above fold (should be 2-3 max)
  if (theme.sectionsAboveFold > 4) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

// ============================================
// CONVERSION SCORING
// ============================================

function calculateEcommerceScore(sections: SectionAnalysisData[]): number {
  let score = 70; // Base score

  // Check for important e-commerce elements
  const hasHero = sections.some(s => s.type === 'hero' || s.name.toLowerCase().includes('hero'));
  const hasProductGrid = sections.some(s => s.type === 'product_grid' || s.name.toLowerCase().includes('product'));
  const hasTestimonials = sections.some(s => s.type === 'testimonials' || s.name.toLowerCase().includes('review'));
  const hasNewsletter = sections.some(s => s.type === 'newsletter' || s.name.toLowerCase().includes('newsletter'));

  if (hasHero) score += 10;
  if (hasProductGrid) score += 10;
  if (hasTestimonials) score += 5;
  if (hasNewsletter) score += 5;

  // Penalty for slow hero
  const heroSection = sections.find(s => s.type === 'hero' || s.name.toLowerCase().includes('hero'));
  if (heroSection && heroSection.complexityScore > 60) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateMobileScore(vitals: CoreWebVitals | null): number {
  if (!vitals) return 70; // Default if no mobile data

  let score = 100;

  // Mobile-specific penalties based on Core Web Vitals
  // Mobile users are more sensitive to slow loading
  if (vitals.lcp > 3000) score -= 20;
  else if (vitals.lcp > 2500) score -= 10;

  if (vitals.tbt > 400) score -= 15;
  else if (vitals.tbt > 200) score -= 8;

  if (vitals.cls > 0.15) score -= 15;
  else if (vitals.cls > 0.1) score -= 8;

  return Math.max(0, score);
}

function calculateRevenueImpactScore(loadTimeMs: number, monthlyRevenue?: number): {
  score: number;
  estimatedMonthlyLoss: number;
} {
  // Industry benchmark: 7% conversion loss per second above 2s
  const baselineMs = 2000;
  const conversionLossPerSecond = 0.07;

  const excessLoadTime = Math.max(0, loadTimeMs - baselineMs);
  const excessSeconds = excessLoadTime / 1000;
  const estimatedConversionLoss = excessSeconds * conversionLossPerSecond;

  // Calculate estimated monthly loss
  const revenue = monthlyRevenue || 15000; // Default assumption
  const estimatedMonthlyLoss = Math.round(revenue * estimatedConversionLoss);

  // Score based on conversion loss
  let score = 100;
  if (estimatedConversionLoss > 0.21) { // >3s excess = >21% loss
    score = 30;
  } else if (estimatedConversionLoss > 0.14) { // >2s excess
    score = 50;
  } else if (estimatedConversionLoss > 0.07) { // >1s excess
    score = 70;
  } else if (estimatedConversionLoss > 0) {
    score = 85;
  }

  return { score, estimatedMonthlyLoss };
}

// ============================================
// MAIN SCORE CALCULATOR
// ============================================

export function calculateThemeMetricsScore(
  vitals: CoreWebVitals | null,
  sections: SectionAnalysisData[],
  theme: ThemeData,
  monthlyRevenue?: number
): ScoreBreakdown {
  // 1. SPEED SCORE (40%)
  const coreWebVitalsResult = vitals 
    ? calculateCoreWebVitalsScore(vitals)
    : { score: 50, details: { 
        lcp: { value: 0, score: 50, status: 'warning' as const },
        cls: { value: 0, score: 50, status: 'warning' as const },
        fcp: { value: 0, score: 50, status: 'warning' as const },
        tbt: { value: 0, score: 50, status: 'warning' as const },
      }};
  
  const sectionLoadResult = calculateSectionLoadScore(sections);
  const speedScore = Math.round(
    coreWebVitalsResult.score * 0.6 + sectionLoadResult.score * 0.4
  );

  // 2. QUALITY SCORE (35%)
  const liquidQualityResult = calculateLiquidQualityScore(sections);
  const bestPracticesScore = calculateBestPracticesScore(sections);
  const architectureScore = calculateArchitectureScore(theme, sections);
  const qualityScore = Math.round(
    liquidQualityResult.score * 0.5 + bestPracticesScore * 0.3 + architectureScore * 0.2
  );

  // 3. CONVERSION SCORE (25%)
  const ecommerceScore = calculateEcommerceScore(sections);
  const mobileScore = calculateMobileScore(vitals);
  const loadTimeMs = vitals?.lcp || 3000;
  const revenueResult = calculateRevenueImpactScore(loadTimeMs, monthlyRevenue);
  const conversionScore = Math.round(
    ecommerceScore * 0.5 + mobileScore * 0.3 + revenueResult.score * 0.2
  );

  // FINAL SCORE
  const overallScore = Math.round(
    speedScore * 0.40 + qualityScore * 0.35 + conversionScore * 0.25
  );

  return {
    overall: overallScore,
    speed: {
      score: speedScore,
      coreWebVitals: coreWebVitalsResult.score,
      sectionLoad: sectionLoadResult.score,
      details: coreWebVitalsResult.details,
      penalties: sectionLoadResult.penalties,
    },
    quality: {
      score: qualityScore,
      liquidQuality: liquidQualityResult.score,
      bestPractices: bestPracticesScore,
      architecture: architectureScore,
      issues: liquidQualityResult.issues,
    },
    conversion: {
      score: conversionScore,
      ecommerce: ecommerceScore,
      mobile: mobileScore,
      revenueImpact: revenueResult.score,
      estimatedMonthlyLoss: revenueResult.estimatedMonthlyLoss,
    },
  };
}

// ============================================
// HELPER: Get score status
// ============================================

export function getScoreStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: 'Exzellent',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Dein Theme ist hervorragend optimiert!',
    };
  } else if (score >= 70) {
    return {
      label: 'Gut',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Solide Performance mit Optimierungspotenzial.',
    };
  } else if (score >= 50) {
    return {
      label: 'Verbesserungswürdig',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Einige Bereiche brauchen Aufmerksamkeit.',
    };
  } else {
    return {
      label: 'Kritisch',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Dringender Optimierungsbedarf!',
    };
  }
}

// ============================================
// HELPER: Format values for display
// ============================================

export function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case 'lcp':
    case 'fcp':
      return `${(value / 1000).toFixed(1)}s`;
    case 'cls':
      return value.toFixed(2);
    case 'tbt':
      return `${Math.round(value)}ms`;
    default:
      return String(value);
  }
}
