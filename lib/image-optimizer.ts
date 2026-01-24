/**
 * Image Optimization Analyzer für ThemeMetrics
 * Analysiert Bilder im Theme auf Optimierungspotenzial
 */

export type ImageSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ImageCategory = 'format' | 'size' | 'loading' | 'shopify';

export interface ImageIssue {
  id: string;
  severity: ImageSeverity;
  category: ImageCategory;
  type: string;
  
  // Bild-Info
  imageName: string;
  currentSize?: number;
  optimizedSize?: number;
  currentDimensions?: { width: number; height: number };
  recommendedDimensions?: { width: number; height: number };
  
  // Location
  section: string;
  line: number;
  element: string;
  
  // Fix
  title: string;
  description: string;
  fix: string;
  savingsBytes?: number;
  savingsPercent?: number;
}

export interface SectionImageAnalysis {
  sectionName: string;
  issues: ImageIssue[];
  imageCount: number;
}

export interface ImageReport {
  score: number;
  totalImages: number;
  issuesCount: number;
  
  // Aggregierte Savings
  currentTotalSize: number;
  optimizedTotalSize: number;
  potentialSavings: number;
  potentialSavingsPercent: number;
  estimatedTimeImprovement: number;
  
  // Counts by severity
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  
  // Counts by category
  byCategory: {
    format: number;
    size: number;
    loading: number;
    shopify: number;
  };
  
  // All issues
  issues: ImageIssue[];
  sections: SectionImageAnalysis[];
}

// Severity weights for scoring
const SEVERITY_WEIGHTS: Record<ImageSeverity, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
};

// Average mobile bandwidth for time calculations (bytes per second)
const AVG_MOBILE_BANDWIDTH = 3 * 1024 * 1024; // 3 MB/s

/**
 * Analyze a section's Liquid code for image optimization issues
 */
export function analyzeImages(
  sectionName: string,
  liquidCode: string
): SectionImageAnalysis {
  const issues: ImageIssue[] = [];
  const lines = liquidCode.split('\n');
  
  // Count images
  const imgTags = liquidCode.match(/<img\s+[^>]*>/gi) || [];
  const bgImages = liquidCode.match(/background(-image)?\s*:\s*url\([^)]+\)/gi) || [];
  const imageCount = imgTags.length + bgImages.length;
  
  // Run all checks
  issues.push(...checkWebPFormat(liquidCode, lines, sectionName));
  issues.push(...checkImageDimensions(liquidCode, lines, sectionName));
  issues.push(...checkLazyLoading(liquidCode, lines, sectionName));
  issues.push(...checkResponsiveImages(liquidCode, lines, sectionName));
  issues.push(...checkShopifyImageUrl(liquidCode, lines, sectionName));
  issues.push(...checkImageWidthHeight(liquidCode, lines, sectionName));
  issues.push(...checkPreloadHero(liquidCode, lines, sectionName));
  issues.push(...checkExternalImages(liquidCode, lines, sectionName));
  
  return {
    sectionName,
    issues,
    imageCount,
  };
}

/**
 * Check for WebP format usage
 */
function checkWebPFormat(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  // Find img tags using old img_url filter without format
  const imgUrlRegex = /<img\s+[^>]*\{\{[^}]*\|\s*img_url[^}]*\}\}[^>]*>/gi;
  let match;
  
  while ((match = imgUrlRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    
    // Check if format is specified
    if (!imgTag.includes("format:") && !imgTag.includes("format :")) {
      // Extract image reference
      const imageRef = imgTag.match(/\{\{\s*([^|]+)/)?.[1]?.trim() || 'image';
      
      issues.push({
        id: `no-webp-${section}-${lineNumber}`,
        severity: 'high',
        category: 'format',
        type: 'no-webp',
        imageName: imageRef,
        section,
        line: lineNumber,
        element: imgTag.substring(0, 150) + (imgTag.length > 150 ? '...' : ''),
        title: 'Bild ohne WebP Format',
        description: 'Dieses Bild nutzt nicht das WebP Format. WebP ist 25-35% kleiner als JPEG.',
        fix: `{{ ${imageRef} | image_url: width: 800, format: 'webp' }}`,
        savingsPercent: 30,
      });
    }
  }
  
  // Also check for hardcoded image extensions
  const hardcodedRegex = /<img\s+[^>]*src\s*=\s*["'][^"']*\.(jpg|jpeg|png)["'][^>]*>/gi;
  while ((match = hardcodedRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    const extension = match[1];
    
    // Skip if it's a Shopify CDN URL (already optimized)
    if (imgTag.includes('cdn.shopify.com')) continue;
    
    issues.push({
      id: `hardcoded-format-${section}-${lineNumber}`,
      severity: 'medium',
      category: 'format',
      type: 'hardcoded-format',
      imageName: `*.${extension}`,
      section,
      line: lineNumber,
      element: imgTag.substring(0, 150),
      title: `Hardcoded ${extension.toUpperCase()} Format`,
      description: 'Bild-URL ist hardcoded. Nutze Shopify\'s image_url Filter für automatische Optimierung.',
      fix: `{{ image | image_url: format: 'webp' }}`,
      savingsPercent: 25,
    });
  }
  
  return issues;
}

/**
 * Check for oversized images
 */
function checkImageDimensions(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  // Find img_url with 'master' or very large sizes
  const masterRegex = /<img\s+[^>]*img_url:\s*['"]master['"][^>]*>/gi;
  let match;
  
  while ((match = masterRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    
    issues.push({
      id: `master-size-${section}-${lineNumber}`,
      severity: 'critical',
      category: 'size',
      type: 'master-size',
      imageName: 'image',
      section,
      line: lineNumber,
      element: imgTag.substring(0, 150),
      title: 'Bild in Originalgröße geladen',
      description: '"master" lädt das Bild in voller Auflösung. Das kann mehrere MB sein!',
      fix: `{{ image | image_url: width: 1200 }}`,
      savingsPercent: 70,
    });
  }
  
  // Find very large hardcoded sizes
  const largeSizeRegex = /img_url:\s*['"](\d+)x(\d+)?['"]/gi;
  while ((match = largeSizeRegex.exec(code)) !== null) {
    const width = parseInt(match[1]);
    const height = match[2] ? parseInt(match[2]) : null;
    
    if (width > 2000) {
      const lineNumber = getLineNumber(code, match.index, lines);
      
      issues.push({
        id: `oversized-${section}-${lineNumber}`,
        severity: 'high',
        category: 'size',
        type: 'oversized',
        imageName: 'image',
        currentDimensions: { width, height: height || width },
        recommendedDimensions: { width: 1200, height: Math.round((height || width) * (1200 / width)) },
        section,
        line: lineNumber,
        element: match[0],
        title: `Bild zu groß (${width}px)`,
        description: `Die meisten Bildschirme brauchen maximal 1200-1600px Breite.`,
        fix: `img_url: '1200x'`,
        savingsPercent: Math.round((1 - (1200 / width)) * 100),
      });
    }
  }
  
  return issues;
}

/**
 * Check for lazy loading implementation
 */
function checkLazyLoading(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  const imgRegex = /<img\s+[^>]*>/gi;
  let match;
  const isHeroSection = section.toLowerCase().includes('hero') || 
                        section.toLowerCase().includes('header') ||
                        section.toLowerCase().includes('banner');
  
  while ((match = imgRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    const hasLazyLoading = imgTag.includes('loading="lazy"') || imgTag.includes("loading='lazy'");
    const hasEagerLoading = imgTag.includes('loading="eager"') || imgTag.includes("loading='eager'");
    
    if (isHeroSection) {
      // Hero images should NOT be lazy loaded
      if (hasLazyLoading) {
        issues.push({
          id: `hero-lazy-${section}-${lineNumber}`,
          severity: 'high',
          category: 'loading',
          type: 'hero-lazy',
          imageName: 'hero image',
          section,
          line: lineNumber,
          element: imgTag.substring(0, 150),
          title: 'Hero-Bild ist lazy-loaded',
          description: 'Das wichtigste Bild (LCP) sollte NICHT lazy-loaded sein. Das verzögert den First Paint.',
          fix: 'Entferne loading="lazy" oder setze loading="eager"',
        });
      }
      
      // Check for fetchpriority on hero
      if (!imgTag.includes('fetchpriority')) {
        issues.push({
          id: `hero-no-priority-${section}-${lineNumber}`,
          severity: 'medium',
          category: 'loading',
          type: 'no-fetchpriority',
          imageName: 'hero image',
          section,
          line: lineNumber,
          element: imgTag.substring(0, 150),
          title: 'Hero-Bild ohne fetchpriority',
          description: 'fetchpriority="high" sagt dem Browser, dass dieses Bild wichtig ist.',
          fix: 'Füge fetchpriority="high" hinzu',
        });
      }
    } else {
      // Non-hero images should be lazy loaded
      if (!hasLazyLoading && !hasEagerLoading) {
        issues.push({
          id: `no-lazy-${section}-${lineNumber}`,
          severity: 'medium',
          category: 'loading',
          type: 'no-lazy',
          imageName: 'image',
          section,
          line: lineNumber,
          element: imgTag.substring(0, 150),
          title: 'Bild ohne Lazy Loading',
          description: 'Bilder unterhalb des sichtbaren Bereichs sollten lazy-loaded werden.',
          fix: 'Füge loading="lazy" hinzu',
        });
      }
    }
  }
  
  return issues;
}

/**
 * Check for responsive images (srcset/sizes)
 */
function checkResponsiveImages(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  const imgRegex = /<img\s+[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    
    const hasSrcset = imgTag.includes('srcset');
    const hasSizes = imgTag.includes('sizes=');
    
    // Skip small icons/logos
    if (imgTag.includes('icon') || imgTag.includes('logo') || imgTag.includes('favicon')) {
      continue;
    }
    
    if (!hasSrcset) {
      issues.push({
        id: `no-srcset-${section}-${lineNumber}`,
        severity: 'medium',
        category: 'size',
        type: 'no-srcset',
        imageName: 'image',
        section,
        line: lineNumber,
        element: imgTag.substring(0, 150),
        title: 'Kein responsive srcset',
        description: 'Ohne srcset laden Mobile-Nutzer das gleiche große Bild wie Desktop-Nutzer.',
        fix: `srcset="{{ image | image_url: width: 400 }} 400w,
       {{ image | image_url: width: 800 }} 800w,
       {{ image | image_url: width: 1200 }} 1200w"
sizes="(max-width: 600px) 100vw, 50vw"`,
        savingsPercent: 40,
      });
    } else if (!hasSizes) {
      issues.push({
        id: `no-sizes-${section}-${lineNumber}`,
        severity: 'low',
        category: 'size',
        type: 'no-sizes',
        imageName: 'image',
        section,
        line: lineNumber,
        element: imgTag.substring(0, 100),
        title: 'srcset ohne sizes Attribut',
        description: 'Das sizes Attribut hilft dem Browser die richtige Bildgröße zu wählen.',
        fix: 'sizes="(max-width: 600px) 100vw, 50vw"',
      });
    }
  }
  
  return issues;
}

/**
 * Check for proper Shopify image_url usage
 */
function checkShopifyImageUrl(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  // Check for old img_url filter
  const oldFilterRegex = /\|\s*img_url\s*:/gi;
  let match;
  
  // Count occurrences
  const oldFilterMatches = code.match(oldFilterRegex);
  if (oldFilterMatches && oldFilterMatches.length > 0) {
    // Find first occurrence for line number
    const firstMatch = oldFilterRegex.exec(code);
    if (firstMatch) {
      const lineNumber = getLineNumber(code, firstMatch.index, lines);
      
      issues.push({
        id: `old-img-url-${section}`,
        severity: 'medium',
        category: 'shopify',
        type: 'old-img-url',
        imageName: 'multiple images',
        section,
        line: lineNumber,
        element: `${oldFilterMatches.length}x img_url Filter gefunden`,
        title: 'Veralteter img_url Filter',
        description: 'Der neue image_url Filter ist schneller und unterstützt mehr Formate.',
        fix: `{{ image | image_url: width: 800, format: 'webp' }}`,
      });
    }
  }
  
  // Check for asset_url on images (not using CDN properly)
  const assetUrlRegex = /\|\s*asset_url\s*\}\}[^>]*\.(jpg|jpeg|png|gif|webp)/gi;
  while ((match = assetUrlRegex.exec(code)) !== null) {
    const lineNumber = getLineNumber(code, match.index, lines);
    
    issues.push({
      id: `asset-url-image-${section}-${lineNumber}`,
      severity: 'low',
      category: 'shopify',
      type: 'asset-url-image',
      imageName: `*.${match[1]}`,
      section,
      line: lineNumber,
      element: match[0],
      title: 'Bild über asset_url',
      description: 'Bilder über asset_url werden nicht automatisch optimiert. Nutze lieber Files oder settings.',
      fix: 'Lade das Bild in den Shopify Files-Bereich und nutze image_url',
    });
  }
  
  return issues;
}

/**
 * Check for width/height attributes (CLS prevention)
 */
function checkImageWidthHeight(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  const imgRegex = /<img\s+[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(code)) !== null) {
    const imgTag = match[0];
    const lineNumber = getLineNumber(code, match.index, lines);
    
    const hasWidth = imgTag.includes('width=') || imgTag.includes('width:');
    const hasHeight = imgTag.includes('height=') || imgTag.includes('height:');
    const hasAspectRatio = imgTag.includes('aspect-ratio');
    
    if (!hasWidth && !hasHeight && !hasAspectRatio) {
      issues.push({
        id: `no-dimensions-${section}-${lineNumber}`,
        severity: 'medium',
        category: 'loading',
        type: 'no-dimensions',
        imageName: 'image',
        section,
        line: lineNumber,
        element: imgTag.substring(0, 150),
        title: 'Keine Bild-Dimensionen',
        description: 'Ohne width/height Attribute kann es zu Layout-Verschiebungen (CLS) kommen.',
        fix: 'Füge width="800" height="600" oder style="aspect-ratio: 4/3" hinzu',
      });
    }
  }
  
  return issues;
}

/**
 * Check for preload on hero images
 */
function checkPreloadHero(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  const isHeroSection = section.toLowerCase().includes('hero') || 
                        section.toLowerCase().includes('header') ||
                        section.toLowerCase().includes('banner') ||
                        section.toLowerCase().includes('slideshow');
  
  if (!isHeroSection) return issues;
  
  // Check if there's a preload link for the image
  const hasPreload = code.includes('rel="preload"') || code.includes("rel='preload'");
  const hasImage = code.includes('<img') || code.includes('background-image');
  
  if (hasImage && !hasPreload) {
    issues.push({
      id: `no-preload-hero-${section}`,
      severity: 'low',
      category: 'loading',
      type: 'no-preload',
      imageName: 'hero image',
      section,
      line: 1,
      element: 'Hero Section',
      title: 'Hero-Bild ohne Preload',
      description: 'Ein <link rel="preload"> für das Hero-Bild kann den LCP verbessern.',
      fix: `<link rel="preload" as="image" href="{{ section.settings.image | image_url: width: 1200 }}" fetchpriority="high">`,
    });
  }
  
  return issues;
}

/**
 * Check for external images not using Shopify CDN
 */
function checkExternalImages(code: string, lines: string[], section: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  
  // Find external image URLs
  const externalRegex = /src\s*=\s*["'](https?:\/\/(?!cdn\.shopify\.com)[^"']+\.(jpg|jpeg|png|gif|webp))["']/gi;
  let match;
  
  while ((match = externalRegex.exec(code)) !== null) {
    const url = match[1];
    const lineNumber = getLineNumber(code, match.index, lines);
    
    // Skip common CDNs that are fine
    if (url.includes('cloudinary.com') || 
        url.includes('imgix.net') || 
        url.includes('cloudflare.com')) {
      continue;
    }
    
    issues.push({
      id: `external-image-${section}-${lineNumber}`,
      severity: 'high',
      category: 'shopify',
      type: 'external-image',
      imageName: url.split('/').pop() || 'external image',
      section,
      line: lineNumber,
      element: url.substring(0, 100),
      title: 'Externes Bild',
      description: 'Dieses Bild wird nicht über Shopify\'s CDN geladen. Das ist langsamer und weniger zuverlässig.',
      fix: 'Lade das Bild zu Shopify Files hoch und nutze image_url',
    });
  }
  
  return issues;
}

/**
 * Helper: Get line number from character index
 */
function getLineNumber(code: string, charIndex: number, lines: string[]): number {
  let currentIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    currentIndex += lines[i].length + 1;
    if (currentIndex > charIndex) {
      return i + 1;
    }
  }
  return lines.length;
}

/**
 * Calculate image optimization score
 */
export function calculateImageScore(issues: ImageIssue[]): number {
  let deductions = 0;
  
  for (const issue of issues) {
    deductions += SEVERITY_WEIGHTS[issue.severity];
  }
  
  return Math.max(0, Math.min(100, 100 - deductions));
}

/**
 * Generate full image report
 */
export function generateImageReport(sections: SectionImageAnalysis[]): ImageReport {
  const allIssues = sections.flatMap(s => s.issues);
  const totalImages = sections.reduce((sum, s) => sum + s.imageCount, 0);
  
  // Count by severity
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
  const lowCount = allIssues.filter(i => i.severity === 'low').length;
  
  // Count by category
  const byCategory = {
    format: allIssues.filter(i => i.category === 'format').length,
    size: allIssues.filter(i => i.category === 'size').length,
    loading: allIssues.filter(i => i.category === 'loading').length,
    shopify: allIssues.filter(i => i.category === 'shopify').length,
  };
  
  // Calculate potential savings
  let totalSavingsPercent = 0;
  let issuesWithSavings = 0;
  
  for (const issue of allIssues) {
    if (issue.savingsPercent) {
      totalSavingsPercent += issue.savingsPercent;
      issuesWithSavings++;
    }
  }
  
  // Estimate total size savings (rough estimate based on average issues)
  // Assume average image is 500KB
  const avgImageSize = 500 * 1024; // 500KB
  const currentTotalSize = totalImages * avgImageSize;
  const avgSavingsPercent = issuesWithSavings > 0 ? totalSavingsPercent / issuesWithSavings : 0;
  const potentialSavings = Math.round(currentTotalSize * (avgSavingsPercent / 100));
  const optimizedTotalSize = currentTotalSize - potentialSavings;
  
  // Estimate time improvement
  const estimatedTimeImprovement = potentialSavings / AVG_MOBILE_BANDWIDTH;
  
  const score = calculateImageScore(allIssues);
  
  return {
    score,
    totalImages,
    issuesCount: allIssues.length,
    currentTotalSize,
    optimizedTotalSize,
    potentialSavings,
    potentialSavingsPercent: Math.round(avgSavingsPercent),
    estimatedTimeImprovement,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    byCategory,
    issues: allIssues,
    sections,
  };
}

/**
 * Get score label
 */
export function getImageScoreLabel(score: number): string {
  if (score >= 90) return 'Exzellent';
  if (score >= 70) return 'Gut';
  if (score >= 50) return 'Verbesserungswürdig';
  return 'Kritisch';
}

/**
 * Get severity label in German
 */
export function getSeverityLabel(severity: ImageSeverity): string {
  const labels: Record<ImageSeverity, string> = {
    critical: 'Kritisch',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
  };
  return labels[severity];
}

/**
 * Get category label in German
 */
export function getCategoryLabel(category: ImageCategory): string {
  const labels: Record<ImageCategory, string> = {
    format: 'Format',
    size: 'Größe',
    loading: 'Laden',
    shopify: 'Shopify',
  };
  return labels[category];
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
