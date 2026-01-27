'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AccessibilitySkeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Eye, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Image,
  FormInput,
  Navigation,
  MousePointer,
  Heading,
  Accessibility,
  RefreshCw,
  Copy,
  Check,
  Users,
  TrendingUp,
  Code,
  HelpCircle,
  ArrowRight,
  Sparkles,
  FileCode,
  Search,
  Edit3,
  Save,
  ExternalLink,
  ListOrdered
} from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  wcagCriteria: string;
  title: string;
  description: string;
  element?: string;
  line?: number;
  section?: string;
  fix?: string;
  affectedUsers?: string;
}

interface SectionAccessibility {
  sectionName: string;
  issues: AccessibilityIssue[];
  score: number;
}

interface AccessibilityReport {
  overallScore: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  sections: SectionAccessibility[];
  summary: {
    images: number;
    forms: number;
    contrast: number;
    navigation: number;
    interactive: number;
    structure: number;
  };
}

// Impact data for different issue types
const IMPACT_DATA: Record<string, { users: string; seo: string; legal: string }> = {
  'images': { users: '~8% der Nutzer (Sehbehindert)', seo: '+15% bessere Indexierung', legal: 'WCAG 2.1 AA Pflicht' },
  'navigation': { users: '~15% der Nutzer (Motorisch/Sehbehindert)', seo: '+10% bessere UX-Signale', legal: 'EAA 2025 Pflicht' },
  'forms': { users: '~10% der Nutzer (Kognitiv/Motorisch)', seo: 'Höhere Conversion Rate', legal: 'WCAG 2.1 AA Pflicht' },
  'interactive': { users: '~12% der Nutzer (Tastaturnutzer)', seo: 'Bessere Engagement-Metriken', legal: 'EAA 2025 Pflicht' },
  'structure': { users: '~5% der Nutzer (Screen Reader)', seo: '+20% bessere Semantik', legal: 'WCAG 2.1 A Pflicht' },
  'contrast': { users: '~4% der Nutzer (Sehschwäche)', seo: 'Bessere Lesbarkeit', legal: 'WCAG 2.1 AA Pflicht' },
};

// Step-by-step guides for different issue types
interface StepGuide {
  steps: { title: string; description: string; tip?: string }[];
  difficulty: 'einfach' | 'mittel' | 'fortgeschritten';
  timeEstimate: string;
}

function getStepGuide(issueTitle: string, sectionName: string): StepGuide {
  const section = sectionName.replace(' (Layout)', '').replace('.liquid', '');
  
  // Image issues
  if (issueTitle.includes('Alt-Text') || issueTitle.includes('Bild ohne')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '2-3 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
          tip: 'Du brauchst keine Programmierkenntnisse für diesen Fix'
        },
        {
          title: 'Datei finden',
          description: `Suche nach "${section}" im Suchfeld links (unter "Sections" oder "Snippets")`,
        },
        {
          title: 'Code-Stelle finden',
          description: `Drücke Strg+F (oder Cmd+F auf Mac) und suche nach "<img" um alle Bilder zu finden`,
          tip: 'Achte auf die Zeilennummer aus der Analyse'
        },
        {
          title: 'Alt-Attribut hinzufügen',
          description: `Füge alt="Beschreibung" nach <img ein. Nutze den Fix-Code von oben.`,
        },
        {
          title: 'Speichern',
          description: `Klicke oben rechts auf "Speichern" - fertig!`,
          tip: 'Teste danach im Theme-Vorschau ob alles noch funktioniert'
        }
      ]
    };
  }
  
  // Skip link issues
  if (issueTitle.includes('Skip-Link')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '5-10 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'theme.liquid öffnen',
          description: `Unter "Layout" klicke auf "theme.liquid" - das ist die Hauptdatei`,
        },
        {
          title: 'Body-Tag finden',
          description: `Suche nach "<body" - der Skip-Link muss direkt danach kommen`,
        },
        {
          title: 'Skip-Link einfügen',
          description: `Füge direkt nach dem <body ...> Tag den Fix-Code ein`,
          tip: 'Der Link muss das ERSTE Element nach <body> sein'
        },
        {
          title: 'Ziel-ID hinzufügen',
          description: `Suche den Hauptinhalt (meist <main>) und füge id="main-content" hinzu`,
        },
        {
          title: 'CSS hinzufügen (optional)',
          description: `Der Skip-Link ist standardmäßig unsichtbar und erscheint nur bei Tab-Navigation`,
          tip: 'Füge in deiner CSS-Datei Styles für .skip-link hinzu'
        }
      ]
    };
  }
  
  // Navigation label issues
  if (issueTitle.includes('Navigation ohne Bezeichnung')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '2-3 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'Header-Datei finden',
          description: `Suche nach "header" unter "Sections" - meist "header.liquid"`,
        },
        {
          title: 'Nav-Element finden',
          description: `Suche nach "<nav" - dort fehlt das aria-label`,
        },
        {
          title: 'aria-label hinzufügen',
          description: `Ändere <nav> zu <nav aria-label="Hauptnavigation">`,
          tip: 'Bei mehreren Navigationen: "Hauptnavigation", "Footer-Navigation", etc.'
        },
        {
          title: 'Speichern & Testen',
          description: `Speichern und mit einem Screen Reader oder Browser-Extension testen`,
        }
      ]
    };
  }
  
  // Form/Input issues
  if (issueTitle.includes('Formular') || issueTitle.includes('Label') || issueTitle.includes('Placeholder')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '3-5 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'Datei finden',
          description: `Suche nach "${section}" - Formulare sind oft in contact, newsletter oder cart Dateien`,
        },
        {
          title: 'Input finden',
          description: `Suche nach "<input" und finde das Feld ohne Label`,
        },
        {
          title: 'Label hinzufügen',
          description: `Füge vor dem <input> ein <label for="input-id">Feldname</label> ein`,
          tip: 'Die "for"-ID muss mit der "id" des Inputs übereinstimmen'
        },
        {
          title: 'Speichern',
          description: `Speichern - das Label ist jetzt für Screen Reader sichtbar`,
        }
      ]
    };
  }
  
  // Button issues
  if (issueTitle.includes('Button')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '2-3 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'Datei finden',
          description: `Suche nach "${section}" im Suchfeld`,
        },
        {
          title: 'Button finden',
          description: `Suche nach "<button" und finde den Button ohne Text/Label`,
        },
        {
          title: 'aria-label hinzufügen',
          description: `Füge aria-label="Beschreibung der Aktion" zum Button hinzu`,
          tip: 'Beschreibe WAS passiert wenn man klickt, z.B. "Menü öffnen"'
        },
        {
          title: 'Speichern',
          description: `Speichern - Screen Reader können den Button jetzt verstehen`,
        }
      ]
    };
  }
  
  // Link issues  
  if (issueTitle.includes('Link')) {
    return {
      difficulty: 'einfach',
      timeEstimate: '2-3 Min',
      steps: [
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'Datei finden',
          description: `Suche nach "${section}" im Suchfeld`,
        },
        {
          title: 'Link finden',
          description: `Suche nach "<a " und finde den problematischen Link`,
        },
        {
          title: 'Link verbessern',
          description: `Füge beschreibenden Text oder aria-label hinzu`,
          tip: 'Link-Text sollte das Ziel beschreiben, nicht "hier klicken"'
        },
        {
          title: 'Speichern',
          description: `Speichern und testen ob der Link-Text Sinn macht`,
        }
      ]
    };
  }
  
  // Heading issues
  if (issueTitle.includes('Heading') || issueTitle.includes('Überschrift')) {
    return {
      difficulty: 'mittel',
      timeEstimate: '5-10 Min',
      steps: [
        {
          title: 'Struktur verstehen',
          description: `Überschriften müssen hierarchisch sein: h1 → h2 → h3 (keine Ebene überspringen)`,
          tip: 'Jede Seite sollte genau EINE h1 haben'
        },
        {
          title: 'Theme-Editor öffnen',
          description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
        },
        {
          title: 'Überschriften finden',
          description: `Suche nach "<h1", "<h2", etc. um die Struktur zu sehen`,
        },
        {
          title: 'Hierarchie korrigieren',
          description: `Ändere die Überschriften-Ebenen so dass sie logisch sind`,
          tip: 'h2 kann mehrfach vorkommen, aber immer UNTER einer h1'
        },
        {
          title: 'Speichern & Prüfen',
          description: `Nutze die Browser-Extension "HeadingsMap" zum Testen`,
        }
      ]
    };
  }
  
  // Default guide
  return {
    difficulty: 'mittel',
    timeEstimate: '5-10 Min',
    steps: [
      {
        title: 'Theme-Editor öffnen',
        description: `Gehe zu Onlineshop → Themes → Aktionen → Code bearbeiten`,
      },
      {
        title: 'Datei finden',
        description: `Suche nach "${section}" im Suchfeld links`,
      },
      {
        title: 'Problem-Stelle finden',
        description: `Nutze Strg+G um zur angegebenen Zeile zu springen`,
      },
      {
        title: 'Fix anwenden',
        description: `Kopiere den Fix-Code und ersetze den problematischen Code`,
      },
      {
        title: 'Speichern & Testen',
        description: `Speichern und im Frontend testen ob alles funktioniert`,
      }
    ]
  };
}

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get('shop');
  if (shopParam) return shopParam;
  
  const hostname = window.location.hostname;
  if (hostname === 'admin.shopify.com') {
    const pathParts = window.location.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
      return `${pathParts[storeIndex + 1]}.myshopify.com`;
    }
  }
  
  return '';
}

function AccessibilityContent() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [themeName, setThemeName] = useState('');
  const [analyzedAt, setAnalyzedAt] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'sections' | 'priority'>('priority');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  useEffect(() => {
    if (shop) {
      const cached = localStorage.getItem(`tm_accessibility_full_${shop}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setReport(data.report);
          setThemeName(data.themeName);
          setAnalyzedAt(data.analyzedAt);
        } catch (e) {}
      }
      fetchAccessibility();
    }
  }, [shop]);

  const fetchAccessibility = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/accessibility?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setThemeName(data.theme?.name || '');
        setAnalyzedAt(data.analyzedAt);
        
        localStorage.setItem(`tm_accessibility_full_${shop}`, JSON.stringify({
          report: data.report,
          themeName: data.theme?.name || '',
          analyzedAt: data.analyzedAt
        }));
        if (data.report?.overallScore !== undefined) {
          localStorage.setItem(`tm_accessibility_${shop}`, JSON.stringify(data.report.overallScore));
        }
      }
    } catch (err) {
      console.error('Failed to fetch accessibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await authenticatedFetch('/api/accessibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setThemeName(data.theme?.name || '');
        setAnalyzedAt(data.analyzedAt);
        
        localStorage.setItem(`tm_accessibility_full_${shop}`, JSON.stringify({
          report: data.report,
          themeName: data.theme?.name || '',
          analyzedAt: data.analyzedAt
        }));
        if (data.report?.overallScore !== undefined) {
          localStorage.setItem(`tm_accessibility_${shop}`, JSON.stringify(data.report.overallScore));
        }
      }
    } catch (err) {
      console.error('Failed to analyze:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const toggleGuide = (issueId: string) => {
    const newExpanded = new Set(expandedGuides);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedGuides(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 70) return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800';
    if (score >= 50) return 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exzellent';
    if (score >= 70) return 'Gut';
    if (score >= 50) return 'Problematisch';
    return 'Kritisch';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
          icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
          text: 'text-red-700 dark:text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
          icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
          text: 'text-amber-700 dark:text-amber-400'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
          icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
          text: 'text-blue-700 dark:text-blue-400'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'images': return Image;
      case 'forms': return FormInput;
      case 'navigation': return Navigation;
      case 'interactive': return MousePointer;
      case 'structure': return Heading;
      case 'contrast': return Eye;
      default: return AlertCircle;
    }
  };

  // Get all issues flattened and sorted by priority
  const getAllIssues = () => {
    if (!report) return [];
    const allIssues: (AccessibilityIssue & { sectionName: string })[] = [];
    report.sections.forEach(section => {
      section.issues.forEach(issue => {
        allIssues.push({ ...issue, sectionName: section.sectionName });
      });
    });
    
    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // Filter by selected severity
    if (filterSeverity !== 'all') {
      return allIssues.filter(i => i.severity === filterSeverity);
    }
    return allIssues;
  };

  if (loading && !report) {
    return <AccessibilitySkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Accessibility className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-foreground">Accessibility Check</h1>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              WCAG 2.1 AA Barrierefreiheitsprüfung für {themeName || shop}
              <Link href="/dashboard/accessibility/info" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                Wie wird der Score berechnet?
              </Link>
            </p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Prüfe...' : 'Erneut prüfen'}
        </button>
      </div>

      {/* Legal Notice */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Ab Juni 2025 gilt der European Accessibility Act (EAA)</p>
            <p className="text-indigo-100 text-sm mt-1">
              Online-Shops müssen barrierefrei sein. Bei Verstößen drohen Bußgelder bis zu <strong>100.000€</strong>. 
              ThemeMetrics hilft dir, compliant zu werden.
            </p>
          </div>
        </div>
      </div>

      {!report ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Accessibility className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Daten vorhanden</h3>
          <p className="text-muted-foreground mb-6">Starte eine Analyse um Accessibility-Probleme in deinem Theme zu finden.</p>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Analyse starten
          </button>
        </div>
      ) : (
        <>
          {/* Score Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Score */}
            <div className={`rounded-2xl border-2 p-6 ${getScoreBg(report.overallScore)}`}>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(report.overallScore)}`}>
                  {report.overallScore}
                </div>
                <p className="text-muted-foreground mt-1">von 100</p>
                <div className={`mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${getScoreColor(report.overallScore)} bg-white`}>
                  {report.overallScore >= 70 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {getScoreLabel(report.overallScore)}
                </div>
              </div>
            </div>

            {/* Issue Counts - Clickable Filters */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Gefundene Probleme</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${filterSeverity === 'critical' ? 'bg-red-500/20 ring-2 ring-red-500/50' : 'hover:bg-secondary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-foreground font-medium">Kritisch</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{report.criticalCount}</span>
                </button>
                <button 
                  onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${filterSeverity === 'warning' ? 'bg-amber-500/20 ring-2 ring-amber-500/50' : 'hover:bg-secondary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-foreground font-medium">Warnungen</span>
                  </div>
                  <span className="text-xl font-bold text-amber-600">{report.warningCount}</span>
                </button>
                <button 
                  onClick={() => setFilterSeverity(filterSeverity === 'info' ? 'all' : 'info')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${filterSeverity === 'info' ? 'bg-blue-500/20 ring-2 ring-blue-500/50' : 'hover:bg-secondary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-foreground font-medium">Hinweise</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{report.infoCount}</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Nach Kategorie</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'images', icon: Image, color: 'purple', label: 'Bilder' },
                  { key: 'forms', icon: FormInput, color: 'blue', label: 'Formulare' },
                  { key: 'navigation', icon: Navigation, color: 'green', label: 'Navigation' },
                  { key: 'interactive', icon: MousePointer, color: 'amber', label: 'Interaktiv' },
                  { key: 'structure', icon: Heading, color: 'indigo', label: 'Struktur' },
                  { key: 'contrast', icon: Eye, color: 'pink', label: 'Kontrast' },
                ].map(({ key, icon: Icon, color, label }) => {
                  const count = report.summary[key as keyof typeof report.summary];
                  return (
                    <div 
                      key={key} 
                      className={`text-center p-3 rounded-xl transition-all cursor-default ${count > 0 ? 'hover:bg-secondary/50' : ''}`}
                      title={IMPACT_DATA[key]?.users}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                        color === 'purple' ? 'bg-purple-500/20' :
                        color === 'blue' ? 'bg-blue-500/20' :
                        color === 'green' ? 'bg-green-500/20' :
                        color === 'amber' ? 'bg-amber-500/20' :
                        color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/50' :
                        'bg-pink-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          color === 'purple' ? 'text-purple-600' :
                          color === 'blue' ? 'text-blue-600' :
                          color === 'green' ? 'text-green-600' :
                          color === 'amber' ? 'text-amber-600' :
                          color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                          'text-pink-600'
                        }`} />
                      </div>
                      <p className={`text-2xl font-bold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{count}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* View Toggle & Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-secondary rounded-xl p-1">
              <button
                onClick={() => setViewMode('priority')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'priority' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Nach Priorität
              </button>
              <button
                onClick={() => setViewMode('sections')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'sections' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Nach Section
              </button>
            </div>
            {filterSeverity !== 'all' && (
              <button
                onClick={() => setFilterSeverity('all')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
              >
                Filter zurücksetzen ✕
              </button>
            )}
          </div>

          {/* Priority View - All Issues */}
          {viewMode === 'priority' && (
            <div className="space-y-4">
              {getAllIssues().length === 0 ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                    {filterSeverity === 'all' ? 'Keine Probleme gefunden!' : `Keine ${filterSeverity === 'critical' ? 'kritischen' : filterSeverity === 'warning' ? 'Warnungen' : 'Hinweise'} gefunden`}
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                    {filterSeverity === 'all' ? 'Dein Theme erfüllt die WCAG 2.1 AA Richtlinien.' : 'Versuche einen anderen Filter.'}
                  </p>
                </div>
              ) : (
                getAllIssues().map((issue) => {
                  const styles = getSeverityStyles(issue.severity);
                  const impact = IMPACT_DATA[issue.category] || { users: 'Verschiedene Nutzergruppen', seo: 'Verbesserte UX', legal: 'WCAG Empfehlung' };
                  const isExpanded = expandedIssues.has(issue.id);
                  const CategoryIcon = getCategoryIcon(issue.category);
                  
                  return (
                    <div key={issue.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${styles.bg}`}>
                      {/* Issue Header */}
                      <button
                        onClick={() => toggleIssue(issue.id)}
                        className="w-full p-5 flex items-start gap-4 text-left"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                          {issue.severity === 'critical' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : issue.severity === 'warning' ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles.badge}`}>
                              {issue.severity === 'critical' ? '🚨 Kritisch' : issue.severity === 'warning' ? '⚠️ Warnung' : 'ℹ️ Hinweis'}
                            </span>
                            <span className="text-xs text-muted-foreground bg-card/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3" />
                              {issue.category}
                            </span>
                            <span className="text-xs text-muted-foreground bg-card/50 px-2 py-0.5 rounded-full">
                              {issue.sectionName}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground text-lg">{issue.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{issue.wcagCriteria}</p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpanded ? 'bg-white' : 'bg-card/50'}`}>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4">
                          {/* Impact Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-card rounded-xl p-4 border border-border/50">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                                <Users className="w-4 h-4" />
                                BETROFFENE NUTZER
                              </div>
                              <p className="font-semibold text-foreground">{impact.users}</p>
                            </div>
                            <div className="bg-card rounded-xl p-4 border border-border/50">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                                <TrendingUp className="w-4 h-4" />
                                SEO IMPACT
                              </div>
                              <p className="font-semibold text-foreground">{impact.seo}</p>
                            </div>
                            <div className="bg-card rounded-xl p-4 border border-border/50">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                RECHTLICH
                              </div>
                              <p className="font-semibold text-foreground">{impact.legal}</p>
                            </div>
                          </div>

                          {/* Code: Before */}
                          {issue.element && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-red-500/20 rounded flex items-center justify-center">
                                  <Code className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  ❌ Vorher {issue.line && <span className="font-normal text-muted-foreground">(Zeile {issue.line})</span>}
                                </span>
                              </div>
                              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap break-all">
                                  {issue.element}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Code: After (Fix) */}
                          {issue.fix && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 rounded flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✅ Nachher (Fix)</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(issue.fix!, issue.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  {copiedId === issue.id ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Kopiert!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      Code kopieren
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border-2 border-emerald-500/30">
                                <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap break-all">
                                  {issue.fix}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Step-by-Step Guide */}
                          {(() => {
                            const guide = getStepGuide(issue.title, issue.sectionName);
                            const isGuideExpanded = expandedGuides.has(issue.id);
                            
                            return (
                              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleGuide(issue.id);
                                  }}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                                      <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold text-indigo-900 dark:text-indigo-100">
                                        📋 Schritt-für-Schritt Anleitung
                                      </p>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          guide.difficulty === 'einfach' 
                                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                                            : guide.difficulty === 'mittel'
                                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                            : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                        }`}>
                                          {guide.difficulty === 'einfach' ? '🟢' : guide.difficulty === 'mittel' ? '🟡' : '🔴'} {guide.difficulty}
                                        </span>
                                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                          ⏱️ {guide.timeEstimate}
                                        </span>
                                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                          {guide.steps.length} Schritte
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {isGuideExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-indigo-500" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-indigo-500" />
                                  )}
                                </button>
                                
                                {isGuideExpanded && (
                                  <div className="px-4 pb-4 space-y-3">
                                    {guide.steps.map((step, index) => (
                                      <div key={index} className="flex gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                          {index + 1}
                                        </div>
                                        <div className="flex-1 pt-1">
                                          <p className="font-semibold text-foreground">{step.title}</p>
                                          <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                                          {step.tip && (
                                            <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                                              <span className="text-amber-600">💡</span>
                                              <p className="text-sm text-amber-800 dark:text-amber-200">{step.tip}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Quick link to Theme Editor */}
                                    <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                                      <a
                                        href={`https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/themes/current/editor`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileCode className="w-4 h-4" />
                                        Theme-Editor öffnen
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Affected Users Info */}
                          {issue.affectedUsers && (
                            <div className="bg-card rounded-xl p-4 border border-border/50">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">Wer ist konkret betroffen?</p>
                                  <p className="text-sm text-muted-foreground mt-1">{issue.affectedUsers}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Sections View */}
          {viewMode === 'sections' && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {report.sections.map((section) => {
                  const filteredIssues = filterSeverity === 'all' 
                    ? section.issues 
                    : section.issues.filter(i => i.severity === filterSeverity);
                  
                  return (
                    <div key={section.sectionName}>
                      <button
                        onClick={() => toggleSection(section.sectionName)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {expandedSections.has(section.sectionName) ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-foreground">{section.sectionName}</p>
                            <p className="text-sm text-muted-foreground">
                              {section.issues.length === 0 
                                ? '✅ Keine Probleme'
                                : `${section.issues.length} Problem${section.issues.length !== 1 ? 'e' : ''}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {section.issues.filter(i => i.severity === 'critical').length > 0 && (
                            <span className="px-2.5 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                              {section.issues.filter(i => i.severity === 'critical').length} Kritisch
                            </span>
                          )}
                          {section.issues.filter(i => i.severity === 'warning').length > 0 && (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                              {section.issues.filter(i => i.severity === 'warning').length} Warnung
                            </span>
                          )}
                          <div className={`w-12 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            section.score >= 90 ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-300' :
                            section.score >= 70 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                            section.score >= 50 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                            'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}>
                            {section.score}
                          </div>
                        </div>
                      </button>

                      {/* Section Issues */}
                      {expandedSections.has(section.sectionName) && filteredIssues.length > 0 && (
                        <div className="px-6 pb-4 space-y-3">
                          {filteredIssues.map((issue) => {
                            const styles = getSeverityStyles(issue.severity);
                            const isExpanded = expandedIssues.has(issue.id);
                            
                            return (
                              <div key={issue.id} className={`rounded-xl border ${styles.bg} overflow-hidden`}>
                                <button
                                  onClick={() => toggleIssue(issue.id)}
                                  className="w-full p-4 flex items-center gap-3 text-left"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                                    {issue.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                                     issue.severity === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                     <Info className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm">{issue.title}</p>
                                    <p className="text-xs text-muted-foreground">{issue.wcagCriteria}</p>
                                  </div>
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                
                                {isExpanded && (
                                  <div className="px-4 pb-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                                    {issue.fix && (
                                      <div className="bg-slate-900 rounded-lg p-3 relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(issue.fix!, issue.id);
                                          }}
                                          className="absolute top-2 right-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                                        >
                                          {copiedId === issue.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap pr-10">{issue.fix}</pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {expandedSections.has(section.sectionName) && section.issues.length === 0 && (
                        <div className="px-6 pb-4">
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Diese Section ist barrierefrei! 🎉</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom CTA for Critical Issues */}
          {report.criticalCount > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Du hast {report.criticalCount} kritische Probleme
                  </h3>
                  <p className="text-red-100 mt-1">Diese solltest du priorisiert beheben um rechtliche Risiken zu minimieren.</p>
                </div>
                <button
                  onClick={() => {
                    setFilterSeverity('critical');
                    setViewMode('priority');
                    window.scrollTo({ top: 500, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-card text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg"
                >
                  Kritische anzeigen
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AccessibilityPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    }>
      <AccessibilityContent />
    </Suspense>
  );
}
