'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemesSkeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Layers, 
  ChevronRight,
  ChevronDown,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Zap,
  Clock,
  TrendingUp,
  Filter,
  X,
  Info,
  Play,
  Sparkles,
  FileCode,
  Eye,
  Video,
  Image as ImageIcon
} from 'lucide-react';

interface Section {
  name: string;
  type: string;
  category: string;
  performanceScore: number;
  estimatedLoadTime: number;
  recommendations: string[];
  hasVideo: boolean;
  hasAnimations: boolean;
  hasLazyLoading: boolean;
  linesOfCode: number;
}

interface ThemeData {
  hasData: boolean;
  theme: {
    name: string;
    role: string;
    analyzedAt: string;
  };
  analysis: {
    totalSections: number;
    categorizedSections: Record<string, Section[]>;
    overallScore: number;
  };
  score: {
    overall: number;
    speed: { score: number };
    quality: { score: number };
    conversion: { score: number };
  };
}

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('shop') || '';
}

function ThemeAnalysisContent() {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState('');
  const [data, setData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterScore, setFilterScore] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'category' | 'score' | 'all'>('category');

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!shop) return;
      try {
        const response = await fetch(`/api/themes/data?shop=${shop}`);
        if (response.ok) {
          const result = await response.json();
          if (result.hasData) setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (shop) fetchData();
  }, [shop]);

  const toggleSection = (name: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'bg-green-500/10 border-green-500/30';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Exzellent';
    if (score >= 60) return 'Gut';
    if (score >= 40) return 'Verbesserungswürdig';
    return 'Kritisch';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hero': return <Sparkles className="w-4 h-4" />;
      case 'product': return <Layers className="w-4 h-4" />;
      case 'collection': return <Layers className="w-4 h-4" />;
      case 'media': return <ImageIcon className="w-4 h-4" />;
      case 'social': return <TrendingUp className="w-4 h-4" />;
      default: return <FileCode className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <ThemesSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-500" />
            Theme Analysis
          </h1>
        </div>
        
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Noch keine Analyse</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Gehe zum Dashboard und starte eine Analyse, um die Details deiner Theme-Sections zu sehen.
          </p>
          <Link 
            href={`/dashboard?shop=${shop}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            Zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Flatten all sections
  const allSections: Section[] = Object.values(data.analysis?.categorizedSections || {}).flat() as Section[];
  
  // If no sections but we have data, show a hint to re-analyze
  const hasNoSections = allSections.length === 0 && data.hasData;
  
  // Filter sections
  let filteredSections = allSections;
  if (filterCategory) {
    filteredSections = filteredSections.filter(s => s.category.toLowerCase() === filterCategory.toLowerCase());
  }
  if (filterScore === 'critical') {
    filteredSections = filteredSections.filter(s => s.performanceScore < 40);
  } else if (filterScore === 'warning') {
    filteredSections = filteredSections.filter(s => s.performanceScore >= 40 && s.performanceScore < 60);
  } else if (filterScore === 'good') {
    filteredSections = filteredSections.filter(s => s.performanceScore >= 60);
  }

  // Sort by score (lowest first for priority)
  const sortedSections = [...filteredSections].sort((a, b) => a.performanceScore - b.performanceScore);

  // Group by category
  const groupedByCategory = sortedSections.reduce((acc, section) => {
    const cat = section.category || 'Sonstiges';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(section);
    return acc;
  }, {} as Record<string, Section[]>);

  // Stats
  const criticalCount = allSections.filter(s => s.performanceScore < 40).length;
  const warningCount = allSections.filter(s => s.performanceScore >= 40 && s.performanceScore < 60).length;
  const goodCount = allSections.filter(s => s.performanceScore >= 60).length;
  const avgScore = allSections.length > 0 
    ? Math.round(allSections.reduce((sum, s) => sum + s.performanceScore, 0) / allSections.length)
    : (data.analysis.overallScore || 0);

  // Get unique categories
  const categories = Array.from(new Set(allSections.map(s => s.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-500" />
            Theme Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailanalyse aller Sections in {data.theme.name}
          </p>
        </div>
      </div>

      {/* Why Section Analysis Matters */}
      <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Warum Section-Analyse wichtig ist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">🎯 Gezielte Optimierung</p>
                <p className="text-muted-foreground">Finde genau die Sections, die Performance kosten</p>
              </div>
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">⚡ Schnellere Ladezeit</p>
                <p className="text-muted-foreground">Jede optimierte Section verbessert die gesamte Seite</p>
              </div>
              <div className="bg-card/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">📈 Bessere Conversion</p>
                <p className="text-muted-foreground">Schnelle Sections = zufriedene Kunden = mehr Umsatz</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Gesamt-Score</span>
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</span>
            <span className="text-muted-foreground mb-1">/100</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Sections</span>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-4xl font-bold text-foreground">{allSections.length}</span>
        </div>

        <button 
          onClick={() => setFilterScore(filterScore === 'critical' ? null : 'critical')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterScore === 'critical' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border hover:border-red-500/50'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Kritisch</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-4xl font-bold text-red-500">{criticalCount}</span>
        </button>

        <button 
          onClick={() => setFilterScore(filterScore === 'warning' ? null : 'warning')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterScore === 'warning' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/50'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Warnung</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-4xl font-bold text-amber-500">{warningCount}</span>
        </button>

        <button 
          onClick={() => setFilterScore(filterScore === 'good' ? null : 'good')}
          className={`bg-card rounded-2xl border p-5 text-left transition-all ${filterScore === 'good' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-border hover:border-emerald-500/50'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Gut</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-4xl font-bold text-emerald-500">{goodCount}</span>
        </button>
      </div>

      {/* Quick Wins Banner */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {criticalCount} Section{criticalCount > 1 ? 's' : ''} mit kritischer Performance
              </h3>
              <p className="text-sm text-muted-foreground">
                Diese Sections verlangsamen deinen Shop am meisten. Beginne hier für den größten Impact.
              </p>
            </div>
            <button
              onClick={() => setFilterScore('critical')}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
            >
              Anzeigen
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View Mode */}
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode('category')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'category' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nach Kategorie
          </button>
          <button
            onClick={() => setViewMode('score')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'score' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nach Score
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'all' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Alle
          </button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {getCategoryIcon(cat)}
              {cat}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {(filterCategory || filterScore) && (
          <button
            onClick={() => { setFilterCategory(null); setFilterScore(null); }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {viewMode === 'category' ? (
          Object.entries(groupedByCategory).map(([category, sections]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {getCategoryIcon(category)}
                {category}
                <span className="text-muted-foreground font-normal">({sections.length})</span>
              </h3>
              {sections.map(section => (
                <SectionCard 
                  key={section.name}
                  section={section}
                  isExpanded={expandedSections.has(section.name)}
                  onToggle={() => toggleSection(section.name)}
                  shop={shop}
                />
              ))}
            </div>
          ))
        ) : (
          sortedSections.map(section => (
            <SectionCard 
              key={section.name}
              section={section}
              isExpanded={expandedSections.has(section.name)}
              onToggle={() => toggleSection(section.name)}
              shop={shop}
            />
          ))
        )}

        {sortedSections.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            {hasNoSections ? (
              <>
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Section-Details nicht verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Die Section-Analyse muss erneut ausgeführt werden um die Details anzuzeigen.
                </p>
                <Link
                  href={`/dashboard?shop=${shop}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  Neue Analyse starten
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">
                Keine Sections mit den ausgewählten Filtern gefunden.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Timestamp */}
      {data.theme.analyzedAt && (
        <p className="text-sm text-muted-foreground text-center">
          Zuletzt analysiert: {new Date(data.theme.analyzedAt).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  );
}

// Section Card Component
function SectionCard({
  section,
  isExpanded,
  onToggle,
  shop
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  shop: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return 'border-l-emerald-500';
    if (score >= 60) return 'border-l-green-500';
    if (score >= 40) return 'border-l-amber-500';
    return 'border-l-red-500';
  };

  return (
    <div className={`bg-card rounded-xl border border-border border-l-4 ${getScoreBorder(section.performanceScore)} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Score Circle */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              section.performanceScore >= 60 ? 'bg-emerald-500/10' : 
              section.performanceScore >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
            } ${getScoreColor(section.performanceScore)}`}>
              {section.performanceScore}
            </div>
            
            <div>
              <h3 className="font-medium text-foreground">{section.name}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{section.estimatedLoadTime}ms
                </span>
                <span className="flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  {section.linesOfCode} Zeilen
                </span>
                {section.recommendations.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                    {section.recommendations.length} Empfehlung{section.recommendations.length > 1 ? 'en' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Feature Badges */}
            <div className="flex gap-1.5">
              {section.hasVideo && (
                <span className="p-1.5 bg-amber-500/10 rounded-lg" title="Enthält Video">
                  <Video className="w-4 h-4 text-amber-500" />
                </span>
              )}
              {section.hasAnimations && (
                <span className="p-1.5 bg-purple-500/10 rounded-lg" title="Enthält Animationen">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </span>
              )}
              {section.hasLazyLoading && (
                <span className="p-1.5 bg-emerald-500/10 rounded-lg" title="Lazy Loading aktiv">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </span>
              )}
            </div>

            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              {isExpanded ? 'Weniger' : 'Details'}
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/30 p-4 space-y-4">
          {/* Performance Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Typ</p>
              <p className="font-medium text-foreground">{section.type}</p>
            </div>
            <div className="bg-card rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Kategorie</p>
              <p className="font-medium text-foreground">{section.category}</p>
            </div>
            <div className="bg-card rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Ladezeit</p>
              <p className="font-medium text-foreground">{section.estimatedLoadTime}ms</p>
            </div>
            <div className="bg-card rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Code-Zeilen</p>
              <p className="font-medium text-foreground">{section.linesOfCode}</p>
            </div>
          </div>

          {/* Recommendations */}
          {section.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Empfehlungen:</p>
              <ul className="space-y-2">
                {section.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/dashboard/section?shop=${shop}&section=${encodeURIComponent(section.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              Section analysieren
            </Link>
            <Link
              href={`/dashboard/recommendations?shop=${shop}&section=${encodeURIComponent(section.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              Empfehlungen anzeigen
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThemeAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ThemeAnalysisContent />
    </Suspense>
  );
}
