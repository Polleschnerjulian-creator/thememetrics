import { SectionType } from '@/types';

// Section type patterns for classification
const SECTION_TYPE_PATTERNS: Record<SectionType, string[]> = {
  hero: ['hero', 'banner', 'slideshow', 'slider', 'main-banner', 'image-banner'],
  product_grid: ['product-grid', 'collection-grid', 'featured-products', 'product-list', 'collection-template'],
  featured_collection: ['featured-collection', 'collection-list', 'collections-list'],
  announcement: ['announcement', 'notice', 'alert-bar', 'promo-bar', 'announcement-bar'],
  newsletter: ['newsletter', 'subscribe', 'email-signup', 'mailing', 'email-capture'],
  testimonials: ['testimonials', 'reviews', 'social-proof', 'customer-reviews'],
  image_with_text: ['image-with-text', 'image-text', 'media-text', 'text-with-image'],
  video: ['video', 'video-hero', 'background-video', 'video-section'],
  instagram: ['instagram', 'social-feed', 'ig-feed', 'social-media'],
  footer: ['footer'],
  header: ['header', 'navigation', 'nav', 'main-menu'],
  custom: [],
};

// Classify section type based on filename and content
export function classifySectionType(sectionName: string, content: string): SectionType {
  const normalizedName = sectionName.toLowerCase();
  
  // Check filename patterns first
  for (const [type, keywords] of Object.entries(SECTION_TYPE_PATTERNS)) {
    if (keywords.some(kw => normalizedName.includes(kw))) {
      return type as SectionType;
    }
  }
  
  // Content-based detection
  if (content.includes('video') || content.includes('.mp4') || content.includes('youtube') || content.includes('vimeo')) {
    return 'video';
  }
  if (content.includes('product.price') || content.includes('product.title') || content.includes('collection.products')) {
    return 'product_grid';
  }
  if (content.includes('form') && (content.includes('newsletter') || content.includes('email') || content.includes('subscribe'))) {
    return 'newsletter';
  }
  if (content.includes('instagram') || content.includes('social')) {
    return 'instagram';
  }
  
  return 'custom';
}

// Calculate complexity score (0-100)
export function calculateComplexityScore(content: string): number {
  let score = 0;
  const lines = content.split('\n').length;
  
  // Lines of Code (mehr = komplexer)
  if (lines > 500) score += 30;
  else if (lines > 200) score += 20;
  else if (lines > 100) score += 10;
  else if (lines > 50) score += 5;
  
  // Liquid Complexity
  const liquidLoops = (content.match(/{%\s*for/g) || []).length;
  const liquidConditions = (content.match(/{%\s*if/g) || []).length;
  const liquidAssigns = (content.match(/{%\s*assign/g) || []).length;
  const liquidCaptures = (content.match(/{%\s*capture/g) || []).length;
  
  score += Math.min(liquidLoops * 5, 25);
  score += Math.min(liquidConditions * 2, 15);
  score += Math.min(liquidAssigns * 1, 10);
  score += Math.min(liquidCaptures * 3, 10);
  
  // JavaScript presence
  const scriptTags = (content.match(/<script/g) || []).length;
  score += Math.min(scriptTags * 8, 20);
  
  // External Resources
  if (content.includes('video') || content.includes('.mp4')) score += 15;
  if (content.includes('iframe')) score += 12;
  if (content.includes('instagram') || content.includes('twitter') || content.includes('facebook')) score += 8;
  
  // Animations & Transitions
  if (content.includes('animation') || content.includes('@keyframes')) score += 5;
  if (content.includes('transition')) score += 3;
  
  // Heavy CSS
  if (content.includes('backdrop-filter') || content.includes('filter:')) score += 3;
  
  return Math.min(100, score);
}

// Estimate load time in milliseconds
export function estimateLoadTime(content: string, complexityScore: number): number {
  let baseTime = 100; // Base load time in ms
  
  // Based on complexity
  baseTime += complexityScore * 8;
  
  // Heavy elements
  if (content.includes('video') || content.includes('.mp4')) baseTime += 1500;
  if (content.includes('iframe')) baseTime += 800;
  if (content.includes('youtube') || content.includes('vimeo')) baseTime += 1200;
  
  // Carousels/Sliders
  if (content.includes('swiper') || content.includes('slick') || content.includes('flickity')) baseTime += 400;
  if (content.includes('slideshow') || content.includes('carousel')) baseTime += 300;
  
  // Images (estimate based on typical usage)
  const imageOutputs = (content.match(/\{\{\s*.*\|\s*image_url/g) || []).length;
  const imgTags = (content.match(/<img/g) || []).length;
  baseTime += (imageOutputs + imgTags) * 100;
  
  // External scripts
  const externalScripts = (content.match(/src=["'][^"']*https?:\/\//g) || []).length;
  baseTime += externalScripts * 200;
  
  // Large Liquid loops (products, collections)
  const productLoops = (content.match(/for\s+product\s+in/g) || []).length;
  baseTime += productLoops * 150;
  
  return Math.round(baseTime);
}

// Check if section has video
export function hasVideo(content: string): boolean {
  return (
    content.includes('<video') ||
    content.includes('.mp4') ||
    content.includes('.webm') ||
    content.includes('youtube') ||
    content.includes('vimeo') ||
    content.includes('video_url')
  );
}

// Check if section has animations
export function hasAnimations(content: string): boolean {
  return (
    content.includes('animation') ||
    content.includes('@keyframes') ||
    content.includes('transition') ||
    content.includes('animate') ||
    content.includes('aos') || // AOS library
    content.includes('gsap') || // GSAP
    content.includes('motion') // Framer Motion
  );
}

// Check if section has lazy loading
export function hasLazyLoading(content: string): boolean {
  return (
    content.includes('loading="lazy"') ||
    content.includes("loading='lazy'") ||
    content.includes('lazy-load') ||
    content.includes('lazyload') ||
    content.includes('data-src')
  );
}

// Parse a section file and return analysis
export interface SectionAnalysis {
  name: string;
  type: SectionType;
  linesOfCode: number;
  complexityScore: number;
  estimatedLoadTimeMs: number;
  hasVideo: boolean;
  hasAnimations: boolean;
  hasLazyLoading: boolean;
  // Additional metrics for ThemeMetrics Score
  hasResponsiveImages: boolean;
  hasPreload: boolean;
  liquidLoops: number;
  liquidAssigns: number;
  liquidConditions: number;
  liquidCaptures: number;
  externalScripts: number;
  inlineStyles: number;
}

export function analyzeSection(filename: string, content: string): SectionAnalysis {
  const name = filename.replace('.liquid', '').replace('sections/', '');
  const type = classifySectionType(name, content);
  const complexity = calculateComplexityScore(content);
  
  // Count Liquid constructs
  const liquidLoops = (content.match(/{%\s*for/g) || []).length;
  const liquidConditions = (content.match(/{%\s*if/g) || []).length;
  const liquidAssigns = (content.match(/{%\s*assign/g) || []).length;
  const liquidCaptures = (content.match(/{%\s*capture/g) || []).length;
  
  // Count external scripts
  const externalScripts = (content.match(/src=["'][^"']*https?:\/\//g) || []).length;
  
  // Count inline styles
  const inlineStyles = (content.match(/style=["'][^"']+["']/g) || []).length;
  
  // Check for responsive images
  const hasResponsiveImages = content.includes('srcset') || 
    content.includes('image_url') && content.includes('widths:') ||
    content.includes('sizes:');
  
  // Check for preload hints
  const hasPreload = content.includes('rel="preload"') || 
    content.includes("rel='preload'") ||
    content.includes('fetchpriority');
  
  return {
    name,
    type,
    linesOfCode: content.split('\n').length,
    complexityScore: complexity,
    estimatedLoadTimeMs: estimateLoadTime(content, complexity),
    hasVideo: hasVideo(content),
    hasAnimations: hasAnimations(content),
    hasLazyLoading: hasLazyLoading(content),
    hasResponsiveImages,
    hasPreload,
    liquidLoops,
    liquidAssigns,
    liquidConditions,
    liquidCaptures,
    externalScripts,
    inlineStyles,
  };
}

// Calculate overall health score (0-100)
export function calculateHealthScore(sections: SectionAnalysis[]): number {
  if (sections.length === 0) return 100;
  
  let score = 100;
  
  // Penalize based on average complexity
  const avgComplexity = sections.reduce((sum, s) => sum + s.complexityScore, 0) / sections.length;
  score -= avgComplexity * 0.3;
  
  // Penalize based on total load time
  const totalLoadTime = sections.reduce((sum, s) => sum + s.estimatedLoadTimeMs, 0);
  if (totalLoadTime > 5000) score -= 20;
  else if (totalLoadTime > 3000) score -= 10;
  else if (totalLoadTime > 2000) score -= 5;
  
  // Penalize for too many sections
  if (sections.length > 15) score -= 15;
  else if (sections.length > 12) score -= 10;
  else if (sections.length > 10) score -= 5;
  
  // Penalize for videos in hero
  const heroWithVideo = sections.find(s => s.type === 'hero' && s.hasVideo);
  if (heroWithVideo) score -= 15;
  
  // Penalize for missing lazy loading in below-fold sections
  const belowFoldWithoutLazy = sections
    .slice(2) // Assume first 2 sections are above fold
    .filter(s => !s.hasLazyLoading).length;
  score -= belowFoldWithoutLazy * 2;
  
  // Penalize for Instagram embeds
  const instagramSections = sections.filter(s => s.type === 'instagram').length;
  score -= instagramSections * 8;
  
  return Math.max(0, Math.round(score));
}

// Fashion industry benchmarks
export const FASHION_BENCHMARKS = {
  avgLoadTimeMs: 2500,
  avgHealthScore: 72,
  avgSectionsCount: 8,
  avgMobileScore: 78,
  sectionBenchmarks: {
    hero: { avgLoadTime: 800, maxRecommended: 1200 },
    product_grid: { avgLoadTime: 600, maxRecommended: 1000 },
    featured_collection: { avgLoadTime: 500, maxRecommended: 800 },
    video: { avgLoadTime: 2000, maxRecommended: 2500 },
    newsletter: { avgLoadTime: 200, maxRecommended: 400 },
    testimonials: { avgLoadTime: 400, maxRecommended: 600 },
    image_with_text: { avgLoadTime: 400, maxRecommended: 600 },
    instagram: { avgLoadTime: 1500, maxRecommended: 2000 },
    announcement: { avgLoadTime: 100, maxRecommended: 200 },
    header: { avgLoadTime: 300, maxRecommended: 500 },
    footer: { avgLoadTime: 200, maxRecommended: 400 },
    custom: { avgLoadTime: 500, maxRecommended: 800 },
  } as Record<SectionType, { avgLoadTime: number; maxRecommended: number }>,
};

// Get section status based on load time
export function getSectionStatus(section: SectionAnalysis): 'optimal' | 'warning' | 'critical' {
  const benchmark = FASHION_BENCHMARKS.sectionBenchmarks[section.type];
  
  if (section.estimatedLoadTimeMs <= benchmark.avgLoadTime) {
    return 'optimal';
  } else if (section.estimatedLoadTimeMs <= benchmark.maxRecommended) {
    return 'warning';
  } else {
    return 'critical';
  }
}
