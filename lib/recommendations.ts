import { SectionAnalysis, FASHION_BENCHMARKS } from './parser';
import { RecommendationSeverity, RecommendationType } from '@/types';

export interface RecommendationRule {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  fix: string;
  impactMultiplier: number; // Revenue impact as decimal (0.01 = 1%)
  effort: 'low' | 'medium' | 'high';
}

export interface GeneratedRecommendation extends RecommendationRule {
  sectionName?: string;
  estimatedRevenueImpact: number;
}

// Recommendation rules
const RECOMMENDATION_RULES: Array<{
  id: string;
  condition: (section: SectionAnalysis, allSections: SectionAnalysis[]) => boolean;
  rule: Omit<RecommendationRule, 'id'>;
}> = [
  // === CRITICAL: Hero/Above-the-Fold Issues ===
  {
    id: 'hero-video',
    condition: (section) => section.type === 'hero' && section.hasVideo,
    rule: {
      type: 'performance',
      severity: 'critical',
      title: 'Hero Section enthält Video',
      description: 'Videos in der Hero Section verlangsamen den First Contentful Paint erheblich. Dies kann die Conversion Rate um bis zu 2% reduzieren.',
      fix: 'Ersetze das Video durch ein optimiertes Bild (WebP Format, max 200KB) mit fetchpriority="high".',
      impactMultiplier: 0.018,
      effort: 'low',
    },
  },
  {
    id: 'slow-hero',
    condition: (section) => 
      section.type === 'hero' && 
      section.estimatedLoadTimeMs > FASHION_BENCHMARKS.sectionBenchmarks.hero.maxRecommended,
    rule: {
      type: 'performance',
      severity: 'critical',
      title: 'Hero Section ist zu langsam',
      description: 'Die Hero Section lädt langsamer als empfohlen. Besucher sehen möglicherweise einen leeren Bereich beim ersten Laden.',
      fix: 'Nutze preload im <head>, fetchpriority="high", und optimiere Bildgrößen auf max 1920px.',
      impactMultiplier: 0.015,
      effort: 'low',
    },
  },
  {
    id: 'hero-no-preload',
    condition: (section) => section.type === 'hero' && !section.hasPreload,
    rule: {
      type: 'performance',
      severity: 'critical',
      title: 'Hero-Bild ohne Preload',
      description: 'Das Hero-Bild wird nicht vorab geladen. Der Browser entdeckt es erst spät im Parsing-Prozess.',
      fix: 'Füge <link rel="preload"> im <head> für das Hero-Bild hinzu.',
      impactMultiplier: 0.012,
      effort: 'low',
    },
  },
  {
    id: 'header-too-complex',
    condition: (section) => section.type === 'header' && section.complexityScore > 60,
    rule: {
      type: 'performance',
      severity: 'critical',
      title: 'Header zu komplex',
      description: 'Ein komplexer Header verzögert das First Contentful Paint. Mega-Menüs sollten lazy geladen werden.',
      fix: 'Lade Mega-Menü-Inhalte erst bei Hover. Reduziere initiales HTML.',
      impactMultiplier: 0.014,
      effort: 'medium',
    },
  },

  // === WARNING: Performance Issues ===
  {
    id: 'instagram-embed',
    condition: (section) => section.type === 'instagram',
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Instagram Feed eingebettet',
      description: 'Instagram Embeds laden ~1.5MB externe Scripts und verlangsamen die Seite um 1-2 Sekunden.',
      fix: 'Ersetze den Live-Feed durch statische, optimierte Bilder mit Link zum Profil.',
      impactMultiplier: 0.012,
      effort: 'medium',
    },
  },
  {
    id: 'video-autoplay',
    condition: (section) => section.hasVideo && section.type !== 'hero',
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Video außerhalb der Hero Section',
      description: 'Videos außerhalb der Hero Section laden 2-5MB und blockieren die Interaktivität.',
      fix: 'Nutze das Facade Pattern: Zeige Poster-Bild, lade Video erst bei Klick.',
      impactMultiplier: 0.01,
      effort: 'medium',
    },
  },
  {
    id: 'high-complexity',
    condition: (section) => section.complexityScore > 70,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Hohe Code-Komplexität',
      description: 'Diese Section hat eine hohe Komplexität (>70), was Server-Rendering und Wartbarkeit beeinträchtigt.',
      fix: 'Extrahiere verschachtelte Loops in Snippets. Vermeide Loops in Loops.',
      impactMultiplier: 0.008,
      effort: 'high',
    },
  },
  {
    id: 'no-responsive-images',
    condition: (section) => !section.hasResponsiveImages && section.linesOfCode > 30,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Keine responsiven Bilder',
      description: 'Ohne srcset laden Mobile-Geräte unnötig große Bilder (oft 5-10x mehr als nötig).',
      fix: 'Nutze image_tag mit widths: Parameter für automatisches srcset.',
      impactMultiplier: 0.009,
      effort: 'low',
    },
  },
  {
    id: 'many-external-scripts',
    condition: (section) => section.externalScripts > 2,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Zu viele externe Scripts',
      description: 'Diese Section lädt mehrere externe Scripts. Jedes Script blockiert potenziell das Rendering.',
      fix: 'Lade Third-Party Scripts async/defer oder erst nach User-Interaktion.',
      impactMultiplier: 0.007,
      effort: 'medium',
    },
  },
  {
    id: 'many-liquid-loops',
    condition: (section) => section.liquidLoops > 3,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Viele Liquid-Loops',
      description: 'Mehrere verschachtelte Loops erhöhen die Server-Response-Zeit signifikant.',
      fix: 'Kombiniere Loops wo möglich. Nutze limit: Parameter. Cache Ergebnisse in Variablen.',
      impactMultiplier: 0.006,
      effort: 'medium',
    },
  },
  {
    id: 'heavy-animations',
    condition: (section) => section.hasAnimations && section.complexityScore > 50,
    rule: {
      type: 'ux',
      severity: 'warning',
      title: 'Schwere Animationen erkannt',
      description: 'Animationen in Kombination mit komplexem Code können auf älteren Geräten zu Ruckeln führen.',
      fix: 'Beschränke Animationen auf transform und opacity. Respektiere prefers-reduced-motion.',
      impactMultiplier: 0.005,
      effort: 'medium',
    },
  },
  {
    id: 'inline-styles',
    condition: (section) => section.inlineStyles > 5,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Viele Inline-Styles',
      description: 'Inline-Styles vergrößern das HTML und können nicht gecacht werden.',
      fix: 'Verschiebe wiederverwendbare Styles in CSS-Klassen.',
      impactMultiplier: 0.003,
      effort: 'medium',
    },
  },

  // === INFO: Optimization Opportunities ===
  {
    id: 'missing-lazy-loading',
    condition: (section, allSections) => {
      const index = allSections.indexOf(section);
      return index > 1 && !section.hasLazyLoading && section.linesOfCode > 20;
    },
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Lazy Loading fehlt',
      description: 'Diese Section ist unterhalb des sichtbaren Bereichs und sollte lazy geladen werden.',
      fix: 'Füge loading="lazy" zu allen <img> Tags hinzu.',
      impactMultiplier: 0.005,
      effort: 'low',
    },
  },
  {
    id: 'product-grid-no-lazy',
    condition: (section, allSections) => {
      const index = allSections.indexOf(section);
      return section.type === 'product_grid' && index > 0 && !section.hasLazyLoading;
    },
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Product Grid ohne Lazy Loading',
      description: 'Product Grids enthalten oft 8-12 Bilder. Ohne Lazy Loading werden alle sofort geladen.',
      fix: 'Nutze loading="lazy" für Produktbilder. Erste 4 können eager bleiben.',
      impactMultiplier: 0.006,
      effort: 'low',
    },
  },
  {
    id: 'testimonials-could-be-lazy',
    condition: (section, allSections) => {
      const index = allSections.indexOf(section);
      return section.type === 'testimonials' && index > 2;
    },
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Testimonials könnten verzögert laden',
      description: 'Testimonials sind selten above-the-fold und könnten bei Scroll geladen werden.',
      fix: 'Nutze Intersection Observer oder natives Lazy Loading.',
      impactMultiplier: 0.003,
      effort: 'low',
    },
  },
  {
    id: 'newsletter-form-heavy',
    condition: (section) => section.type === 'newsletter' && section.complexityScore > 40,
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Newsletter-Formular zu komplex',
      description: 'Ein einfaches Newsletter-Formular sollte minimal sein. Externe Services verzögern das Laden.',
      fix: 'Nutze natives Shopify Newsletter oder lade Klaviyo/Mailchimp Scripts verzögert.',
      impactMultiplier: 0.004,
      effort: 'medium',
    },
  },
  {
    id: 'footer-too-heavy',
    condition: (section) => section.type === 'footer' && section.estimatedLoadTimeMs > 500,
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Footer ist zu schwer',
      description: 'Der Footer lädt langsamer als nötig. Oft durch Instagram-Widgets oder große Bilder.',
      fix: 'Entferne Social Feeds aus dem Footer. Nutze SVGs statt Bilder für Icons.',
      impactMultiplier: 0.003,
      effort: 'low',
    },
  },
];

// Theme-level recommendation rules
const THEME_RULES: Array<{
  id: string;
  condition: (sections: SectionAnalysis[]) => boolean;
  rule: Omit<RecommendationRule, 'id'>;
}> = [
  {
    id: 'too-many-sections',
    condition: (sections) => sections.length > 12,
    rule: {
      type: 'performance',
      severity: 'warning',
      title: 'Zu viele Sections auf der Homepage',
      description: `Mehr als 12 Sections verlangsamen die Seite erheblich. Benchmark: 8 Sections.`,
      fix: 'Entferne oder konsolidiere weniger wichtige Sections. Priorisiere Content, der direkt zur Conversion beiträgt.',
      impactMultiplier: 0.01,
      effort: 'medium',
    },
  },
  {
    id: 'high-total-load-time',
    condition: (sections) => {
      const totalTime = sections.reduce((sum, s) => sum + s.estimatedLoadTimeMs, 0);
      return totalTime > 5000;
    },
    rule: {
      type: 'performance',
      severity: 'critical',
      title: 'Gesamte Ladezeit zu hoch',
      description: 'Die geschätzte Gesamtladezeit überschreitet 5 Sekunden. 53% der mobilen Nutzer verlassen Seiten, die länger als 3 Sekunden laden.',
      fix: 'Identifiziere und optimiere die langsamsten Sections. Entferne unnötige externe Ressourcen.',
      impactMultiplier: 0.025,
      effort: 'high',
    },
  },
  {
    id: 'no-above-fold-optimization',
    condition: (sections) => {
      const firstTwo = sections.slice(0, 2);
      return firstTwo.some(s => !s.hasLazyLoading) === false && 
             sections.slice(2).every(s => !s.hasLazyLoading);
    },
    rule: {
      type: 'performance',
      severity: 'info',
      title: 'Above-the-fold Optimierung empfohlen',
      description: 'Kritische Ressourcen sollten priorisiert geladen werden, während Below-the-fold Content lazy geladen wird.',
      fix: 'Implementiere preload für kritische Bilder im Header/Hero. Lazy-load alle anderen Bilder.',
      impactMultiplier: 0.008,
      effort: 'medium',
    },
  },
];

// Generate recommendations for a theme
export function generateRecommendations(
  sections: SectionAnalysis[],
  monthlyRevenue: number = 10000 // Default assumption for ROI calculation
): GeneratedRecommendation[] {
  const recommendations: GeneratedRecommendation[] = [];
  
  // Section-level recommendations
  for (const section of sections) {
    for (const { id, condition, rule } of RECOMMENDATION_RULES) {
      if (condition(section, sections)) {
        recommendations.push({
          id,
          ...rule,
          sectionName: section.name,
          estimatedRevenueImpact: Math.round(monthlyRevenue * rule.impactMultiplier),
        });
      }
    }
  }
  
  // Theme-level recommendations
  for (const { id, condition, rule } of THEME_RULES) {
    if (condition(sections)) {
      recommendations.push({
        id,
        ...rule,
        estimatedRevenueImpact: Math.round(monthlyRevenue * rule.impactMultiplier),
      });
    }
  }
  
  // Sort by severity and impact
  const severityOrder: Record<RecommendationSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  
  recommendations.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.estimatedRevenueImpact - a.estimatedRevenueImpact;
  });
  
  return recommendations;
}

// Count problematic sections
export function countProblematicSections(sections: SectionAnalysis[]): number {
  return sections.filter(section => {
    const benchmark = FASHION_BENCHMARKS.sectionBenchmarks[section.type];
    return section.estimatedLoadTimeMs > benchmark.maxRecommended || section.complexityScore > 60;
  }).length;
}

// Effort score mapping
export function getEffortScore(effort: 'low' | 'medium' | 'high'): number {
  switch (effort) {
    case 'low': return 20;
    case 'medium': return 50;
    case 'high': return 80;
  }
}

// Impact score calculation (0-100)
export function calculateImpactScore(impactMultiplier: number): number {
  // Map impact multiplier to 0-100 scale
  // 0.025 (2.5%) = 100, 0.003 (0.3%) = 12
  return Math.min(100, Math.round(impactMultiplier * 4000));
}
