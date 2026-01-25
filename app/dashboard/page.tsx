'use client';

import { ScoreCircle } from '@/components/ui/score-circle';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { TrendChart, TrendBadge } from '@/components/dashboard/TrendChart';
import { OnboardingModal, OnboardingChecklist } from '@/components/dashboard/Onboarding';
import { QuickWins } from '@/components/dashboard/ActionableRecs';
import { PDFReportButton } from '@/components/dashboard/PDFReport';
import { RevenueCalculator, RevenueImpactCard } from '@/components/dashboard/RevenueCalculator';
import { MainScoreDisplay, ScoreBreakdownCard, ScoreData } from '@/components/dashboard/ScoreDisplay';
import { ValidationBanner } from '@/components/dashboard/ValidationBanner';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogoIcon } from '@/components/ui/logo';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Zap, 
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Lightbulb,
  Layers,
  HelpCircle,
  Accessibility,
  Image,
  Gauge,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface Section {
  name: string;
  type: string;
  category: string;
  performanceScore: number;
  performanceImpact: number;
  recommendations: string[];
  hasVideo?: boolean;
  hasLazyLoading?: boolean;
}

interface AnalysisData {
  theme: { id: string; name: string; role?: string; analyzedAt?: string };
  analysis: {
    id: number;
    totalSections: number;
    sections: Section[];
    highImpactCount?: number;
  };
  score: ScoreData;
  plan?: {
    current: string;
    showSectionDetails: boolean;
    maxRecommendations: number;
  };
}

interface HistoryData {
  hasData: boolean;
  history: Array<{ date: string; score: number; sections: number; themeName: string }>;
  trends: {
    current: number;
    previous: number;
    change: number;
    weekOverWeek: number;
    totalAnalyses: number;
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
  
  try {
    const ancestorOrigins = window.location.ancestorOrigins;
    if (ancestorOrigins && ancestorOrigins.length > 0) {
      const parentUrl = new URL(ancestorOrigins[0]);
      const pathParts = parentUrl.pathname.split('/');
      const storeIndex = pathParts.indexOf('store');
      if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        return `${pathParts[storeIndex + 1]}.myshopify.com`;
      }
    }
  } catch (e) {}
  
  return '';
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [accessibilityScore, setAccessibilityScore] = useState<number | null>(null);
  const [imageScore, setImageScore] = useState<number | null>(null);
  const [performanceData, setPerformanceData] = useState<{ mobile: number; desktop: number } | null>(null);
  const [topIssues, setTopIssues] = useState<Array<{ type: string; title: string; severity: string; source: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [completedRecs, setCompletedRecs] = useState<Set<string>>(new Set());

  // Get shop on mount
  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  // Load saved data when shop is set
  useEffect(() => {
    const loadData = async () => {
      if (!shop) return;
      
      setIsLoading(true);
      
      // Load cached scores from individual page caches immediately
      try {
        const cachedAccessibility = localStorage.getItem(`tm_accessibility_${shop}`);
        const cachedImages = localStorage.getItem(`tm_images_${shop}`);
        const cachedPerformance = localStorage.getItem(`tm_performance_${shop}`);
        
        if (cachedAccessibility) {
          const score = JSON.parse(cachedAccessibility);
          if (typeof score === 'number') setAccessibilityScore(score);
        }
        if (cachedImages) {
          const score = JSON.parse(cachedImages);
          if (typeof score === 'number') setImageScore(score);
        }
        if (cachedPerformance) {
          const data = JSON.parse(cachedPerformance);
          if (data && data.mobile !== undefined) setPerformanceData(data);
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }
      
      try {
        // Fetch current analysis
        const analysisRes = await fetch(`/api/themes/data?shop=${shop}`);
        if (analysisRes.ok) {
          const data = await analysisRes.json();
          if (data.hasData) {
            setAnalysis(data);
            setCompletedSteps(prev => [...prev, 'analyze']);
          } else {
            // First time user - show onboarding
            const hasSeenOnboarding = localStorage.getItem('tm_onboarding_complete');
            if (!hasSeenOnboarding) {
              setShowOnboarding(true);
            }
          }
        }

        // Fetch history
        const historyRes = await fetch(`/api/themes/history?shop=${shop}`);
        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistoryData(data);
        }

        // Background fetch for scores that aren't cached yet
        // Only fetch if we don't have cached data
        const allIssues: Array<{ type: string; title: string; severity: string; source: string }> = [];

        // Fetch accessibility if not cached
        if (!localStorage.getItem(`tm_accessibility_${shop}`)) {
          try {
            const accessRes = await fetch(`/api/accessibility?shop=${shop}`);
            if (accessRes.ok) {
              const accessData = await accessRes.json();
              const score = accessData.report?.score ?? null;
              if (score !== null) {
                setAccessibilityScore(score);
                localStorage.setItem(`tm_accessibility_${shop}`, JSON.stringify(score));
              }
              
              const accessIssues = (accessData.report?.issues || [])
                .filter((i: any) => i.severity === 'critical' || i.severity === 'warning')
                .slice(0, 3)
                .map((i: any) => ({
                  type: 'accessibility',
                  title: i.message || i.title,
                  severity: i.severity,
                  source: 'Accessibility'
                }));
              allIssues.push(...accessIssues);
            }
          } catch (e) {
            console.warn('Accessibility fetch failed:', e);
          }
        }

        // Fetch images if not cached
        if (!localStorage.getItem(`tm_images_${shop}`)) {
          try {
            const imageRes = await fetch(`/api/images?shop=${shop}`);
            if (imageRes.ok) {
              const imageData = await imageRes.json();
              const score = imageData.report?.score ?? null;
              if (score !== null) {
                setImageScore(score);
                localStorage.setItem(`tm_images_${shop}`, JSON.stringify(score));
              }
              
              const imgIssues = (imageData.report?.issues || [])
                .filter((i: any) => i.severity === 'critical' || i.severity === 'high')
                .slice(0, 3)
                .map((i: any) => ({
                  type: 'image',
                  title: i.title,
                  severity: i.severity,
                  source: 'Bildoptimierung'
                }));
              allIssues.push(...imgIssues);
            }
          } catch (e) {
            console.warn('Image fetch failed:', e);
          }
        }

        // Fetch performance if not cached
        if (!localStorage.getItem(`tm_performance_${shop}`)) {
          try {
            const perfRes = await fetch(`/api/performance?shop=${shop}`);
            if (perfRes.ok) {
              const perfData = await perfRes.json();
              if (perfData.mobile?.performance !== undefined) {
                // Normalize score: if 0-1, multiply by 100. If already 0-100, use as is.
                const mobileScore = perfData.mobile.performance <= 1 
                  ? Math.round(perfData.mobile.performance * 100) 
                  : Math.round(perfData.mobile.performance);
                const desktopScore = perfData.desktop?.performance 
                  ? (perfData.desktop.performance <= 1 
                      ? Math.round(perfData.desktop.performance * 100) 
                      : Math.round(perfData.desktop.performance))
                  : 0;
                const data = {
                  mobile: mobileScore,
                  desktop: desktopScore
                };
                setPerformanceData(data);
                localStorage.setItem(`tm_performance_${shop}`, JSON.stringify(data));
              }
            }
          } catch (e) {
            console.warn('Performance fetch failed:', e);
          }
        }

        if (allIssues.length > 0) {
          setTopIssues(allIssues);
        }

      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (shop) loadData();
  }, [shop]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/themes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Show specific error message from API
        const errorMsg = data.message || data.error || 'Analysis failed';
        throw new Error(errorMsg);
      }

      setAnalysis(data);
      setCompletedSteps(prev => [...prev.filter(s => s !== 'analyze'), 'analyze']);

      // Refresh history
      const historyRes = await fetch(`/api/themes/history?shop=${shop}`);
      if (historyRes.ok) {
        setHistoryData(await historyRes.json());
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Analyse fehlgeschlagen. Bitte versuche es erneut.';
      setError(errorMessage);
      console.error('Analysis error:', err);
      console.error('Error details:', { message: err.message, stack: err.stack });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('tm_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  const toggleRecComplete = (id: string) => {
    setCompletedRecs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
    if (!completedSteps.includes('fix')) {
      setCompletedSteps(prev => [...prev, 'fix']);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' };
    if (score >= 60) return { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' };
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' };
    if (score >= 60) return { label: 'Needs Work', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20' };
    return { label: 'Critical', icon: AlertTriangle, color: 'text-red-500 bg-red-500/10 dark:bg-red-500/20' };
  };

  const sortedSections = analysis?.analysis.sections
    ? [...analysis.analysis.sections].sort((a, b) => a.performanceScore - b.performanceScore)
    : [];

  const criticalSections = sortedSections.filter(s => s.performanceScore < 50);
  const warningSections = sortedSections.filter(s => s.performanceScore >= 50 && s.performanceScore < 70);
  const totalLoadTime = sortedSections.reduce((sum, s) => sum + (s.performanceImpact || 0), 0);

  // Build recommendations with effort levels
  const allRecs = sortedSections.flatMap(section => 
    section.recommendations.map((rec, idx) => ({
      id: `${section.name}-${idx}`,
      text: rec,
      section: section.name,
      score: section.performanceScore,
      impact: section.performanceScore < 50 ? 'high' as const : 
              section.performanceScore < 70 ? 'medium' as const : 'low' as const,
      effort: rec.toLowerCase().includes('lazy') || rec.toLowerCase().includes('entfern') 
        ? 'low' as const 
        : rec.toLowerCase().includes('refactor') || rec.toLowerCase().includes('umstrukturier')
        ? 'high' as const
        : 'medium' as const,
    }))
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          onComplete={handleOnboardingComplete}
          onStartAnalysis={runAnalysis}
        />
      )}

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LogoIcon size={36} />
              <div>
                <h1 className="text-lg font-semibold text-foreground">ThemeMetrics</h1>
                <p className="text-sm text-muted-foreground">{shop?.replace('.myshopify.com', '') || 'Shop wird erkannt...'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {analysis && (
                <PDFReportButton shop={shop} />
              )}
              <Link
                href={`/dashboard/settings?shop=${shop}`}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Link>
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || !shop}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analysiere...
                  </>
                ) : analysis ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Neu analysieren
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Theme analysieren
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Validation Banner - Shows before/after comparison */}
        {analysis && shop && (
          <div className="mb-6">
            <ValidationBanner 
              shop={shop} 
              currentScore={analysis.score.overall}
              onReanalyze={runAnalysis}
            />
          </div>
        )}

        {!analysis ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
              <Target className="w-12 h-12 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Bereit zur Analyse</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Klicke auf &quot;Theme analysieren&quot; um herauszufinden, welche Sections deines Themes deine Conversion beeinflussen.
            </p>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !shop}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-medium text-lg transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-50"
            >
              <Sparkles className="w-6 h-6" />
              Jetzt analysieren
            </button>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-6">
            {/* Timestamp */}
            {analysis.theme.analyzedAt && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Zuletzt analysiert: {new Date(analysis.theme.analyzedAt).toLocaleString('de-DE')}
                </p>
                {historyData?.trends && (
                  <TrendBadge change={historyData.trends.change} />
                )}
              </div>
            )}

            {/* ALL SCORES OVERVIEW - NEW */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Alle Scores auf einen Blick
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ThemeMetrics Score */}
                <Link 
                  href={`/dashboard/themes?shop=${shop}`}
                  className="bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-slate-300">ThemeMetrics</span>
                  </div>
                  <p className={`text-3xl font-bold ${
                    analysis.score.overall >= 70 ? 'text-emerald-400' : 
                    analysis.score.overall >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {analysis.score.overall}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.score.overall >= 70 ? 'Gut' : analysis.score.overall >= 50 ? 'Verbesserungswürdig' : 'Kritisch'}
                  </p>
                </Link>

                {/* Accessibility Score */}
                <Link 
                  href={`/dashboard/accessibility?shop=${shop}`}
                  className="bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Accessibility className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">Accessibility</span>
                  </div>
                  <p className={`text-3xl font-bold ${
                    accessibilityScore === null ? 'text-muted-foreground' :
                    accessibilityScore >= 70 ? 'text-emerald-400' : 
                    accessibilityScore >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {accessibilityScore ?? '–'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accessibilityScore === null ? 'Nicht analysiert' :
                     accessibilityScore >= 70 ? 'Gut' : accessibilityScore >= 50 ? 'Verbesserungswürdig' : 'Kritisch'}
                  </p>
                </Link>

                {/* Image Score */}
                <Link 
                  href={`/dashboard/images?shop=${shop}`}
                  className="bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">Bildoptimierung</span>
                  </div>
                  <p className={`text-3xl font-bold ${
                    imageScore === null ? 'text-muted-foreground' :
                    imageScore >= 70 ? 'text-emerald-400' : 
                    imageScore >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {imageScore ?? '–'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {imageScore === null ? 'Nicht analysiert' :
                     imageScore >= 70 ? 'Gut' : imageScore >= 50 ? 'Verbesserungswürdig' : 'Kritisch'}
                  </p>
                </Link>

                {/* PageSpeed Score */}
                <Link 
                  href={`/dashboard/performance?shop=${shop}`}
                  className="bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">PageSpeed</span>
                  </div>
                  {performanceData ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${
                          performanceData.mobile >= 70 ? 'text-emerald-400' : 
                          performanceData.mobile >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {performanceData.mobile}
                        </p>
                        <span className="text-xs text-muted-foreground">Mobile</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Desktop: {performanceData.desktop}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-muted-foreground">–</p>
                      <p className="text-xs text-muted-foreground mt-1">Nicht gemessen</p>
                    </>
                  )}
                </Link>
              </div>

              {/* Top Issues Preview */}
              {topIssues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-muted-foreground mb-3">Top Probleme</p>
                  <div className="space-y-2">
                    {topIssues.slice(0, 3).map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        {issue.severity === 'critical' || issue.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                        <span className="text-slate-300 truncate">{issue.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{issue.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Score Display - NEW ThemeMetrics Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MainScoreDisplay score={analysis.score} shop={shop} />
              </div>
              
              {/* Revenue Impact Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Geschätzter Impact</h3>
                {analysis.score.conversion.estimatedMonthlyLoss > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-sm text-red-600 dark:text-red-400 mb-1">Potenzieller Umsatzverlust</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        ~€{analysis.score.conversion.estimatedMonthlyLoss.toLocaleString('de-DE')}/Monat
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Basierend auf 7% Conversion-Verlust pro Sekunde Ladezeit über 2s (Industry Benchmark)
                    </div>
                    <Link 
                      href={`/dashboard/recommendations?shop=${shop}`}
                      className="block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Jetzt optimieren
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium">🎉 Gut gemacht!</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400/80 mt-1">Dein Theme performt gut. Minimaler Conversion-Verlust durch Performance.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreBreakdownCard score={analysis.score} showDetails={analysis.plan?.showSectionDetails ?? true} />
              
              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Link href={`/dashboard/themes?shop=${shop}`} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-muted-foreground/30 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                        <Layers className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{analysis.analysis.totalSections}</p>
                    <p className="text-sm text-muted-foreground">Sections analysiert</p>
                  </Link>

                  <Link href={`/dashboard/recommendations?shop=${shop}`} className="bg-card rounded-2xl border border-violet-500/20 p-5 hover:shadow-md hover:border-violet-500/40 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-violet-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{allRecs.length}</p>
                    <p className="text-sm text-muted-foreground">Empfehlungen</p>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-red-500/30 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-red-500/10 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-red-500">{criticalSections.length}</p>
                    <p className="text-sm text-muted-foreground">Kritische Sections</p>
                  </div>

                  <div className="bg-card rounded-2xl border border-amber-500/30 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-amber-500">{warningSections.length}</p>
                    <p className="text-sm text-muted-foreground">Warnungen</p>
                  </div>
                </div>

                {/* Re-analyze Button */}
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Analysiere...' : 'Erneut analysieren'}
                </button>
              </div>
            </div>

            {/* Revenue Impact Calculator */}
            <RevenueCalculator shop={shop} />

            {/* Second Row: Theme Info + Trend Chart + Onboarding */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Theme Info */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <p className="text-sm text-muted-foreground mb-1">Analysiertes Theme</p>
                <p className="text-lg font-semibold text-foreground mb-3">{analysis.theme.name}</p>
                {analysis.theme.role && (
                  <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-sm font-medium">
                    {analysis.theme.role}
                  </span>
                )}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Einsparpotenzial: <span className="font-semibold text-violet-600">{`${(totalLoadTime / 100).toFixed(1)}s`}</span>
                  </p>
                </div>
              </div>

              {/* Trend Chart */}
              {historyData?.hasData && historyData.history.length > 1 ? (
                <TrendChart history={historyData.history} trends={historyData.trends} />
              ) : (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Performance-Verlauf</h3>
                  <div className="text-center py-6 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nach mehreren Analysen siehst du hier den Verlauf</p>
                  </div>
                </div>
              )}

              {/* Onboarding Checklist or Quick Links */}
              {!completedSteps.includes('fix') ? (
                <OnboardingChecklist completedSteps={completedSteps} />
              ) : (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-semibold text-foreground mb-4">Schnellzugriff</h3>
                  <div className="space-y-2">
                    <Link href={`/dashboard/themes?shop=${shop}`} className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl transition-colors">
                      <Layers className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Theme Analysis</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                    <Link href={`/dashboard/recommendations?shop=${shop}`} className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl transition-colors">
                      <Lightbulb className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Empfehlungen</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                    <Link href={`/dashboard/benchmarks?shop=${shop}`} className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl transition-colors">
                      <BarChart3 className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Benchmarks</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Wins */}
            {allRecs.length > 0 && (
              <QuickWins 
                recommendations={allRecs} 
                completedIds={completedRecs}
                onToggleComplete={toggleRecComplete}
              />
            )}

            {/* Critical Sections Alert */}
            {criticalSections.length > 0 && (
              <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sofortige Handlung erforderlich</h3>
                    <p className="text-sm text-white/80">{criticalSections.length} Sections beeinträchtigen deine Conversion</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {criticalSections.slice(0, 3).map((section) => (
                    <div key={section.name} className="bg-white/10 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium truncate">{section.name}</span>
                        <span className="text-2xl font-bold">{section.performanceScore}</span>
                      </div>
                      {section.recommendations.length > 0 && (
                        <p className="text-sm text-white/80 line-clamp-2">{section.recommendations[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
                {criticalSections.length > 3 && (
                  <Link 
                    href={`/dashboard/recommendations?shop=${shop}`}
                    className="inline-flex items-center gap-2 mt-4 text-white/90 hover:text-white text-sm"
                  >
                    Alle {criticalSections.length} kritischen Sections anzeigen
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            {/* Top Sections Preview */}
            <div className="bg-card rounded-2xl border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Sections mit niedrigstem Score</h3>
                <Link 
                  href={`/dashboard/themes?shop=${shop}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Alle anzeigen →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {sortedSections.slice(0, 5).map((section) => {
                  const colors = getScoreColor(section.performanceScore);
                  return (
                    <div key={section.name} className="px-6 py-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${colors.text}`}>{section.performanceScore}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{section.name}</h4>
                        <p className="text-sm text-muted-foreground">{section.type}</p>
                      </div>
                      {section.recommendations.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {section.recommendations.length} Tipps
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
