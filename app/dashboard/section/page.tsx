'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Code, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  FileCode,
  Layers,
  Image,
  Play,
  Sparkles
} from 'lucide-react';

interface SectionDetail {
  name: string;
  type: string;
  category: string;
  performanceScore: number;
  performanceImpact: number;
  recommendations: string[];
  // Extended details
  linesOfCode?: number;
  hasVideo?: boolean;
  hasAnimations?: boolean;
  hasLazyLoading?: boolean;
  estimatedLoadTime?: number;
  complexity?: 'low' | 'medium' | 'high';
}

// Code fix suggestions based on common issues
const CODE_FIXES: Record<string, { title: string; description: string; code: string; impact: number }[]> = {
  'lazy-loading': [
    {
      title: 'Lazy Loading für Bilder aktivieren',
      description: 'Füge loading="lazy" zu allen img-Tags hinzu',
      code: `{% comment %} Vorher {% endcomment %}
<img src="{{ image | image_url }}" alt="{{ image.alt }}">

{% comment %} Nachher {% endcomment %}
<img 
  src="{{ image | image_url }}" 
  alt="{{ image.alt }}"
  loading="lazy"
  decoding="async"
>`,
      impact: 15
    }
  ],
  'image-optimization': [
    {
      title: 'Responsive Images verwenden',
      description: 'Nutze srcset für verschiedene Bildgrößen',
      code: `<img
  src="{{ image | image_url: width: 800 }}"
  srcset="
    {{ image | image_url: width: 400 }} 400w,
    {{ image | image_url: width: 800 }} 800w,
    {{ image | image_url: width: 1200 }} 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  loading="lazy"
  alt="{{ image.alt }}"
>`,
      impact: 20
    }
  ],
  'video-optimization': [
    {
      title: 'Video lazy laden',
      description: 'Lade Videos erst wenn sie sichtbar werden',
      code: `{% comment %} Vorher {% endcomment %}
<video autoplay muted loop>
  <source src="{{ video_url }}" type="video/mp4">
</video>

{% comment %} Nachher - mit Intersection Observer {% endcomment %}
<video 
  data-src="{{ video_url }}" 
  muted 
  loop 
  playsinline
  class="lazy-video"
>
</video>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const videos = document.querySelectorAll('.lazy-video');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.src = video.dataset.src;
        video.play();
        observer.unobserve(video);
      }
    });
  });
  videos.forEach(video => observer.observe(video));
});
</script>`,
      impact: 25
    }
  ],
  'reduce-dom': [
    {
      title: 'DOM-Elemente reduzieren',
      description: 'Vereinfache verschachtelte Strukturen',
      code: `{% comment %} Vorher - zu viele Wrapper {% endcomment %}
<div class="section-wrapper">
  <div class="section-inner">
    <div class="section-content">
      <div class="content-wrapper">
        {{ content }}
      </div>
    </div>
  </div>
</div>

{% comment %} Nachher - flachere Struktur {% endcomment %}
<section class="section">
  {{ content }}
</section>`,
      impact: 10
    }
  ],
  'critical-css': [
    {
      title: 'Critical CSS inline laden',
      description: 'Wichtige Styles direkt im HTML',
      code: `{% comment %} Im theme.liquid head {% endcomment %}
<style>
  /* Critical CSS für Above-the-fold */
  .header { /* styles */ }
  .hero { /* styles */ }
  .nav { /* styles */ }
</style>

{% comment %} Rest async laden {% endcomment %}
<link 
  rel="preload" 
  href="{{ 'theme.css' | asset_url }}" 
  as="style" 
  onload="this.onload=null;this.rel='stylesheet'"
>`,
      impact: 18
    }
  ],
  'defer-js': [
    {
      title: 'JavaScript defer/async',
      description: 'Skripte nicht-blockierend laden',
      code: `{% comment %} Vorher {% endcomment %}
<script src="{{ 'slider.js' | asset_url }}"></script>

{% comment %} Nachher {% endcomment %}
<script src="{{ 'slider.js' | asset_url }}" defer></script>

{% comment %} Oder für unabhängige Skripte {% endcomment %}
<script src="{{ 'analytics.js' | asset_url }}" async></script>`,
      impact: 12
    }
  ]
};

function getRelevantFixes(section: SectionDetail): typeof CODE_FIXES[string] {
  const fixes: typeof CODE_FIXES[string] = [];
  
  // Based on section characteristics
  if (!section.hasLazyLoading) {
    fixes.push(...(CODE_FIXES['lazy-loading'] || []));
    fixes.push(...(CODE_FIXES['image-optimization'] || []));
  }
  
  if (section.hasVideo) {
    fixes.push(...(CODE_FIXES['video-optimization'] || []));
  }
  
  if (section.complexity === 'high' || (section.linesOfCode && section.linesOfCode > 200)) {
    fixes.push(...(CODE_FIXES['reduce-dom'] || []));
  }
  
  if (section.type === 'header' || section.type === 'hero') {
    fixes.push(...(CODE_FIXES['critical-css'] || []));
  }
  
  // Always suggest defer for low-scoring sections
  if (section.performanceScore < 50) {
    fixes.push(...(CODE_FIXES['defer-js'] || []));
  }
  
  return fixes.slice(0, 4); // Max 4 fixes
}

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('shop') || '';
}

function SectionDetailContent() {
  const searchParams = useSearchParams();
  const sectionName = searchParams.get('section') || '';
  const [shop, setShop] = useState('');
  const [section, setSection] = useState<SectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFix, setExpandedFix] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const detectedShop = searchParams.get('shop') || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  useEffect(() => {
    const fetchSection = async () => {
      if (!shop || !sectionName) return;
      
      try {
        const response = await fetch(`/api/themes/data?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasData && data.analysis?.sections) {
            const found = data.analysis.sections.find(
              (s: SectionDetail) => s.name === sectionName
            );
            if (found) {
              // Enrich with mock detailed data (in real app, this comes from API)
              setSection({
                ...found,
                linesOfCode: Math.floor(Math.random() * 300) + 50,
                hasVideo: found.type === 'hero' || found.type === 'video',
                hasAnimations: found.performanceScore < 60,
                hasLazyLoading: found.performanceScore > 70,
                estimatedLoadTime: Math.round((100 - found.performanceScore) * 15),
                complexity: found.performanceScore < 40 ? 'high' : found.performanceScore < 70 ? 'medium' : 'low'
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (shop) fetchSection();
  }, [shop, sectionName]);

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Section nicht gefunden</p>
        <Link href={`/dashboard/themes?shop=${shop}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const fixes = getRelevantFixes(section);
  const potentialScore = Math.min(100, section.performanceScore + fixes.reduce((sum, f) => sum + f.impact, 0));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/themes?shop=${shop}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Theme Analysis
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{section.name}</h1>
            <p className="text-muted-foreground mt-1 capitalize">{section.type} Section</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border ${getScoreBg(section.performanceScore)}`}>
            <p className="text-xs text-muted-foreground mb-1">Performance Score</p>
            <p className={`text-3xl font-bold ${getScoreColor(section.performanceScore)}`}>
              {section.performanceScore}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileCode className="w-4 h-4" />
            <span className="text-xs">Lines of Code</span>
          </div>
          <p className="text-xl font-bold text-foreground">{section.linesOfCode}</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Load Time Impact</span>
          </div>
          <p className="text-xl font-bold text-foreground">{section.estimatedLoadTime}ms</p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs">Complexity</span>
          </div>
          <p className={`text-xl font-bold capitalize ${
            section.complexity === 'high' ? 'text-red-600' :
            section.complexity === 'medium' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {section.complexity}
          </p>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs">Empfehlungen</span>
          </div>
          <p className="text-xl font-bold text-violet-600">{section.recommendations.length}</p>
        </div>
      </div>

      {/* Features Detection */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Erkannte Features</h3>
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            section.hasLazyLoading ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            <Image className="w-4 h-4" />
            <span className="text-sm">Lazy Loading {section.hasLazyLoading ? '✓' : '✗'}</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            section.hasVideo ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
          }`}>
            <Play className="w-4 h-4" />
            <span className="text-sm">Video {section.hasVideo ? 'Ja' : 'Nein'}</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            section.hasAnimations ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
          }`}>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Animationen {section.hasAnimations ? 'Ja' : 'Nein'}</span>
          </div>
        </div>
      </div>

      {/* Before/After Score Prediction */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6" />
          <h3 className="font-semibold text-lg">Score-Prognose nach Optimierung</h3>
        </div>
        
        <div className="flex items-center gap-8">
          <div>
            <p className="text-white/70 text-sm mb-1">Aktuell</p>
            <p className="text-4xl font-bold">{section.performanceScore}</p>
          </div>
          
          <div className="text-3xl">→</div>
          
          <div>
            <p className="text-white/70 text-sm mb-1">Nach Fixes</p>
            <p className="text-4xl font-bold text-emerald-300">{potentialScore}</p>
          </div>
          
          <div className="ml-auto bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm text-white/80">Potenzial</p>
            <p className="text-2xl font-bold">+{potentialScore - section.performanceScore}</p>
          </div>
        </div>
      </div>

      {/* Code Fixes */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Code className="w-5 h-5" />
            Code-Fixes
          </h3>
        </div>
        
        <div className="divide-y divide-border">
          {fixes.length > 0 ? fixes.map((fix, index) => (
            <div key={index} className="p-4">
              <button
                onClick={() => setExpandedFix(expandedFix === index ? null : index)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    fix.impact >= 20 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    fix.impact >= 15 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-secondary text-muted-foreground'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{fix.title}</p>
                    <p className="text-sm text-muted-foreground">{fix.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/100/10 px-2 py-1 rounded">
                    +{fix.impact} Punkte
                  </span>
                  {expandedFix === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              {expandedFix === index && (
                <div className="mt-4 relative">
                  <button
                    onClick={() => handleCopy(fix.code, index)}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedIndex === index ? 'Kopiert!' : 'Kopieren'}
                  </button>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto">
                    <code>{fix.code}</code>
                  </pre>
                </div>
              )}
            </div>
          )) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p>Diese Section ist bereits gut optimiert!</p>
            </div>
          )}
        </div>
      </div>

      {/* Original Recommendations */}
      {section.recommendations.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted">
            <h3 className="font-semibold text-foreground">Weitere Empfehlungen</h3>
          </div>
          <ul className="divide-y divide-border">
            {section.recommendations.map((rec, i) => (
              <li key={i} className="px-6 py-4 flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  section.performanceScore < 50 ? 'text-red-500' : 'text-amber-500'
                }`} />
                <span className="text-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SectionDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <SectionDetailContent />
    </Suspense>
  );
}
