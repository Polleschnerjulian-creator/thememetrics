'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Image as ImageIcon,
  AlertTriangle, 
  AlertCircle, 
  Info,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Clock,
  FileImage,
  Layers,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ListOrdered,
  ExternalLink,
  X,
  Play,
  Target
} from 'lucide-react';

interface ImageIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'format' | 'size' | 'loading' | 'shopify';
  type: string;
  imageName: string;
  section: string;
  line: number;
  element: string;
  title: string;
  description: string;
  fix: string;
  savingsPercent?: number;
}

interface ImageReport {
  score: number;
  totalImages: number;
  issuesCount: number;
  currentTotalSize: number;
  optimizedTotalSize: number;
  potentialSavings: number;
  potentialSavingsPercent: number;
  estimatedTimeImprovement: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byCategory: {
    format: number;
    size: number;
    loading: number;
    shopify: number;
  };
  issues: ImageIssue[];
}

interface StepGuide {
  steps: { title: string; description: string; tip?: string }[];
  difficulty: 'einfach' | 'mittel' | 'fortgeschritten';
  timeEstimate: string;
}

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('shop') || '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Step-by-step guide generator
function getStepGuide(issue: ImageIssue): StepGuide {
  const sectionFile = issue.section.includes('.liquid') ? issue.section : `sections/${issue.section}.liquid`;
  
  switch (issue.type) {
    case 'no_srcset':
    case 'missing_srcset':
      return {
        difficulty: 'mittel',
        timeEstimate: '5-10 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}" im Suchfeld links` },
          { title: 'Bild-Tag finden', description: `Gehe zu Zeile ${issue.line} oder suche nach dem <img> Tag`, tip: 'Drücke Strg+G für "Gehe zu Zeile"' },
          { title: 'srcset hinzufügen', description: 'Ersetze das einfache src mit dem responsive Code aus dem Fix', tip: 'srcset ermöglicht verschiedene Bildgrößen für verschiedene Geräte' },
          { title: 'Testen', description: 'Speichern und im Preview mit verschiedenen Bildschirmgrößen testen' }
        ]
      };
    
    case 'no_lazy_loading':
    case 'missing_lazy':
      return {
        difficulty: 'einfach',
        timeEstimate: '2-3 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}" im Suchfeld links` },
          { title: 'Bild-Tag finden', description: `Gehe zu Zeile ${issue.line}` },
          { title: 'loading="lazy" hinzufügen', description: 'Füge loading="lazy" zum <img> Tag hinzu', tip: 'Nicht bei Hero-Bildern above-the-fold verwenden!' },
          { title: 'Speichern', description: 'Klicke auf "Speichern"' }
        ]
      };
    
    case 'not_using_image_url':
    case 'hardcoded_url':
      return {
        difficulty: 'mittel',
        timeEstimate: '5-10 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}"` },
          { title: 'Hardcoded URL finden', description: `Zeile ${issue.line}: Suche nach der statischen Bild-URL` },
          { title: 'image_url Filter nutzen', description: 'Ersetze die URL mit dem Shopify image_url Filter', tip: 'Shopify optimiert dann automatisch Format und Größe' },
          { title: 'Testen', description: 'Prüfe im Network-Tab ob WebP geladen wird' }
        ]
      };
    
    case 'oversized':
    case 'too_large':
      return {
        difficulty: 'einfach',
        timeEstimate: '3-5 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}"` },
          { title: 'Bildgröße anpassen', description: 'Nutze den width Parameter im image_url Filter', tip: 'Maximal 2x die Anzeigegröße für Retina' },
          { title: 'widths Array hinzufügen', description: 'Füge widths: "375, 750, 1100, 1500" hinzu' },
          { title: 'Speichern & Testen', description: 'Prüfe die Dateigröße im Network-Tab' }
        ]
      };
    
    case 'no_dimensions':
    case 'missing_dimensions':
      return {
        difficulty: 'einfach',
        timeEstimate: '2-3 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}"` },
          { title: 'Bild-Tag finden', description: `Zeile ${issue.line}` },
          { title: 'width und height hinzufügen', description: 'Füge width="X" height="Y" zum <img> Tag hinzu', tip: 'Verhindert Layout-Shifts (CLS) beim Laden' },
          { title: 'Speichern', description: 'Klicke auf "Speichern"' }
        ]
      };
    
    default:
      return {
        difficulty: 'mittel',
        timeEstimate: '5-10 Min',
        steps: [
          { title: 'Theme-Editor öffnen', description: 'Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten' },
          { title: 'Datei finden', description: `Suche nach "${sectionFile}"` },
          { title: 'Problem-Stelle finden', description: `Gehe zu Zeile ${issue.line}` },
          { title: 'Code anpassen', description: 'Wende den empfohlenen Fix an' },
          { title: 'Speichern & Testen', description: 'Teste im Theme-Preview' }
        ]
      };
  }
}

function ImageContent() {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<ImageReport | null>(null);
  const [themeName, setThemeName] = useState('');
  const [analyzedAt, setAnalyzedAt] = useState('');
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedFixes, setCompletedFixes] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'priority' | 'category' | 'section'>('priority');

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  useEffect(() => {
    if (!shop) return;
    
    const fetchData = async () => {
      try {
        const [dashRes, imgRes] = await Promise.all([
          fetch(`/api/dashboard?shop=${shop}`),
          fetch(`/api/images?shop=${shop}`)
        ]);
        
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setThemeName(dashData.theme?.name || '');
        }
        
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (imgData.report) {
            setReport(imgData.report);
            setAnalyzedAt(imgData.analyzedAt || '');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Load completed fixes from localStorage
    const saved = localStorage.getItem(`completed-img-fixes-${shop}`);
    if (saved) {
      setCompletedFixes(new Set(JSON.parse(saved)));
    }
  }, [shop]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/images?shop=${shop}&refresh=true`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setAnalyzedAt(new Date().toISOString());
      }
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleIssue = (id: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const toggleGuide = (id: string) => {
    const newExpanded = new Set(expandedGuides);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGuides(newExpanded);
  };

  const toggleComplete = (id: string) => {
    const newCompleted = new Set(completedFixes);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedFixes(newCompleted);
    localStorage.setItem(`completed-img-fixes-${shop}`, JSON.stringify(Array.from(newCompleted)));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exzellent';
    if (score >= 70) return 'Gut';
    if (score >= 50) return 'Verbesserungswürdig';
    return 'Kritisch';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'format': return 'Format';
      case 'size': return 'Größe';
      case 'loading': return 'Laden';
      case 'shopify': return 'Shopify';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'format': return <FileImage className="w-4 h-4" />;
      case 'size': return <Layers className="w-4 h-4" />;
      case 'loading': return <Zap className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Bildanalyse...</p>
        </div>
      </div>
    );
  }

  // Filter and sort issues
  const allIssues = report?.issues || [];
  const filteredIssues = allIssues.filter(issue => {
    if (filterCategory && issue.category !== filterCategory) return false;
    if (filterSeverity && issue.severity !== filterSeverity) return false;
    return true;
  });

  // Sort by severity
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...filteredIssues].sort((a, b) => 
    severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Group by category or section
  const groupedByCategory = sortedIssues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, ImageIssue[]>);

  const groupedBySection = sortedIssues.reduce((acc, issue) => {
    if (!acc[issue.section]) acc[issue.section] = [];
    acc[issue.section].push(issue);
    return acc;
  }, {} as Record<string, ImageIssue[]>);

  const completedCount = completedFixes.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <ImageIcon className="w-7 h-7 text-indigo-500" />
            Bildoptimierung
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimiere die Bilder in {themeName || 'deinem Theme'} für schnellere Ladezeiten
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analysiere...' : 'Neu analysieren'}
        </button>
      </div>

      {!report ? (
        /* Empty State */
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Noch keine Analyse</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Starte die Bildanalyse um herauszufinden, wie du die Ladezeit deines Shops verbessern kannst.
          </p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            Analyse starten
          </button>
        </div>
      ) : (
        <>
          {/* Why Image Optimization Matters */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Warum Bildoptimierung so wichtig ist</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">📊 60-80% der Seitengröße</p>
                    <p className="text-muted-foreground">Bilder machen den Großteil deiner Ladezeit aus</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">💸 7% Conversion pro Sekunde</p>
                    <p className="text-muted-foreground">Jede Sekunde Verzögerung kostet Umsatz</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="font-medium text-foreground mb-1">🔍 SEO-Ranking Faktor</p>
                    <p className="text-muted-foreground">Google bewertet schnelle Seiten besser</p>
                  </div>
                </div>
                <Link 
                  href={`/dashboard/images/info?shop=${shop}`}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-3"
                >
                  Mehr erfahren →
                </Link>
              </div>
            </div>
          </div>
          {/* Score Overview - Clean Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Bild-Score</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                <span className="text-muted-foreground mb-1">/100</span>
              </div>
              <p className={`text-sm mt-1 ${getScoreColor(report.score)}`}>{getScoreLabel(report.score)}</p>
            </div>

            {/* Savings */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Einsparpotenzial</span>
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-emerald-500">{formatBytes(report.potentialSavings)}</span>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                ~{report.potentialSavingsPercent}% kleiner
              </p>
            </div>

            {/* Time Improvement */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Ladezeit-Verbesserung</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-emerald-500">-{report.estimatedTimeImprovement.toFixed(1)}s</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">geschätzte Ersparnis</p>
            </div>

            {/* Issues */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Probleme</span>
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-foreground">{report.issuesCount}</span>
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                {report.criticalCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">{report.criticalCount} kritisch</span>
                )}
                {report.highCount > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">{report.highCount} hoch</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {completedCount > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Dein Fortschritt</span>
                <span className="text-sm text-muted-foreground">{completedCount} von {allIssues.length} erledigt</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(completedCount / allIssues.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Wins Banner */}
          {report.criticalCount > 0 && (
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {report.criticalCount} Quick Win{report.criticalCount > 1 ? 's' : ''} mit großem Impact
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Diese kritischen Probleme haben den größten Einfluss auf deine Ladezeit. 
                    Beginne hier für den schnellsten Erfolg.
                  </p>
                </div>
                <button
                  onClick={() => setFilterSeverity('critical')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  Jetzt beheben
                </button>
              </div>
            </div>
          )}

          {/* Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode */}
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('priority')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'priority' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nach Priorität
              </button>
              <button
                onClick={() => setViewMode('category')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'category' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nach Kategorie
              </button>
              <button
                onClick={() => setViewMode('section')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'section' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nach Section
              </button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Category Filter */}
            <div className="flex gap-2">
              {['format', 'size', 'loading', 'shopify'].map(cat => (
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
                  {getCategoryLabel(cat)}
                  {report.byCategory[cat as keyof typeof report.byCategory] > 0 && (
                    <span className="text-xs opacity-70">({report.byCategory[cat as keyof typeof report.byCategory]})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Clear Filters */}
            {(filterCategory || filterSeverity) && (
              <button
                onClick={() => { setFilterCategory(null); setFilterSeverity(null); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {viewMode === 'priority' && sortedIssues.map((issue) => (
              <IssueCard 
                key={issue.id}
                issue={issue}
                isExpanded={expandedIssues.has(issue.id)}
                isGuideExpanded={expandedGuides.has(issue.id)}
                isCompleted={completedFixes.has(issue.id)}
                copiedId={copiedId}
                onToggle={() => toggleIssue(issue.id)}
                onToggleGuide={() => toggleGuide(issue.id)}
                onToggleComplete={() => toggleComplete(issue.id)}
                onCopy={(text) => copyToClipboard(text, issue.id)}
                shop={shop}
              />
            ))}

            {viewMode === 'category' && Object.entries(groupedByCategory).map(([category, issues]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mt-6 first:mt-0">
                  {getCategoryIcon(category)}
                  {getCategoryLabel(category)}
                  <span className="text-muted-foreground font-normal">({issues.length})</span>
                </h3>
                {issues.map((issue) => (
                  <IssueCard 
                    key={issue.id}
                    issue={issue}
                    isExpanded={expandedIssues.has(issue.id)}
                    isGuideExpanded={expandedGuides.has(issue.id)}
                    isCompleted={completedFixes.has(issue.id)}
                    copiedId={copiedId}
                    onToggle={() => toggleIssue(issue.id)}
                    onToggleGuide={() => toggleGuide(issue.id)}
                    onToggleComplete={() => toggleComplete(issue.id)}
                    onCopy={(text) => copyToClipboard(text, issue.id)}
                    shop={shop}
                  />
                ))}
              </div>
            ))}

            {viewMode === 'section' && Object.entries(groupedBySection).map(([section, issues]) => (
              <div key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mt-6 first:mt-0">
                  <FileImage className="w-4 h-4" />
                  {section}
                  <span className="text-muted-foreground font-normal">({issues.length} Probleme)</span>
                </h3>
                {issues.map((issue) => (
                  <IssueCard 
                    key={issue.id}
                    issue={issue}
                    isExpanded={expandedIssues.has(issue.id)}
                    isGuideExpanded={expandedGuides.has(issue.id)}
                    isCompleted={completedFixes.has(issue.id)}
                    copiedId={copiedId}
                    onToggle={() => toggleIssue(issue.id)}
                    onToggleGuide={() => toggleGuide(issue.id)}
                    onToggleComplete={() => toggleComplete(issue.id)}
                    onCopy={(text) => copyToClipboard(text, issue.id)}
                    shop={shop}
                  />
                ))}
              </div>
            ))}

            {sortedIssues.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Alles optimiert!</h3>
                <p className="text-muted-foreground">
                  {filterCategory || filterSeverity 
                    ? 'Keine Probleme mit den ausgewählten Filtern gefunden.'
                    : 'Deine Bilder sind bereits gut optimiert.'}
                </p>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {analyzedAt && (
            <p className="text-sm text-muted-foreground text-center">
              Zuletzt analysiert: {new Date(analyzedAt).toLocaleString('de-DE')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Issue Card Component
function IssueCard({
  issue,
  isExpanded,
  isGuideExpanded,
  isCompleted,
  copiedId,
  onToggle,
  onToggleGuide,
  onToggleComplete,
  onCopy,
  shop
}: {
  issue: ImageIssue;
  isExpanded: boolean;
  isGuideExpanded: boolean;
  isCompleted: boolean;
  copiedId: string | null;
  onToggle: () => void;
  onToggleGuide: () => void;
  onToggleComplete: () => void;
  onCopy: (text: string) => void;
  shop: string;
}) {
  const guide = getStepGuide(issue);
  
  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-amber-500';
      default: return 'border-l-blue-500';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'einfach': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'mittel': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      default: return 'bg-red-500/10 text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className={`bg-card rounded-xl border border-border border-l-4 ${getSeverityBg(issue.severity)} overflow-hidden ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button 
          onClick={onToggleComplete}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isCompleted 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-muted hover:border-muted-foreground'
          }`}
        >
          {isCompleted && <Check className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
                {issue.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{issue.description}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                  {issue.section}
                </span>
                <span className="text-muted-foreground">Zeile {issue.line}</span>
                {issue.savingsPercent && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">
                    -{issue.savingsPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isCompleted && (
              <button
                onClick={onToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors"
              >
                {isExpanded ? 'Weniger' : 'Fix anzeigen'}
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && !isCompleted && (
        <div className="border-t border-border bg-secondary/30 p-4 space-y-4">
          {/* Code Fix */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">✅ Empfohlener Fix:</p>
            <div className="relative">
              <pre className="text-sm bg-emerald-950 text-emerald-300 p-4 rounded-lg overflow-x-auto border border-emerald-500/30">
                {issue.fix}
              </pre>
              <button
                onClick={() => onCopy(issue.fix)}
                className="absolute top-2 right-2 p-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors"
              >
                {copiedId === issue.id ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Copy className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Guide Toggle */}
          <div className="border border-indigo-500/20 rounded-xl overflow-hidden">
            <button
              onClick={onToggleGuide}
              className="w-full flex items-center justify-between p-4 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <ListOrdered className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Schritt-für-Schritt Anleitung</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(guide.difficulty)}`}>
                      {guide.difficulty === 'einfach' ? '🟢' : guide.difficulty === 'mittel' ? '🟡' : '🔴'} {guide.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">⏱️ {guide.timeEstimate}</span>
                    <span className="text-xs text-muted-foreground">{guide.steps.length} Schritte</span>
                  </div>
                </div>
              </div>
              {isGuideExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {isGuideExpanded && (
              <div className="p-4 space-y-3 border-t border-indigo-500/20">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                      {step.tip && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 bg-amber-500/10 px-2 py-1 rounded inline-block">
                          💡 {step.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Direct Link to Editor */}
                <div className="pt-3 border-t border-border">
                  <a
                    href={`https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/themes/current/editor`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Theme-Editor öffnen
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImageOptimizationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ImageContent />
    </Suspense>
  );
}
