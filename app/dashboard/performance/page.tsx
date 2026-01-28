'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Gauge, 
  Activity, 
  Zap, 
  Eye, 
  Shield, 
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  MousePointer,
  Layout,
  Smartphone,
  Monitor,
  Lock,
  Crown
} from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

interface PerformanceData {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  labData: {
    lcp: { value: number; displayValue: string };
    cls: { value: number; displayValue: string };
    tbt: { value: number; displayValue: string };
    fcp: { value: number; displayValue: string };
    speedIndex: { value: number; displayValue: string };
    tti: { value: number; displayValue: string };
  };
  fieldData: {
    lcp: { value: number; category: string } | null;
    cls: { value: number; category: string } | null;
    inp: { value: number; category: string } | null;
    fcp: { value: number; category: string } | null;
    overallCategory: string;
  } | null;
  analyzedUrl: string;
  strategy: 'mobile' | 'desktop';
  timestamp: string;
}

// Helper to get score color
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const getScoreRingColor = (score: number) => {
  if (score >= 90) return 'stroke-emerald-500';
  if (score >= 50) return 'stroke-amber-500';
  return 'stroke-red-500';
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'FAST': return 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20';
    case 'AVERAGE': return 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20';
    case 'SLOW': return 'text-red-500 bg-red-500/10 dark:bg-red-500/20';
    default: return 'text-muted-foreground bg-muted';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'FAST': return 'Gut';
    case 'AVERAGE': return 'Verbesserungswürdig';
    case 'SLOW': return 'Schlecht';
    default: return category;
  }
};

// Score Circle Component
const ScoreCircle = ({ score, label, size = 'large' }: { score: number; label: string; size?: 'large' | 'small' }) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const dimensions = size === 'large' ? 'w-32 h-32' : 'w-20 h-20';
  const textSize = size === 'large' ? 'text-3xl' : 'text-lg';
  const labelSize = size === 'large' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${dimensions}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={getScoreRingColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSize} font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <span className={`${labelSize} text-muted-foreground mt-2 font-medium`}>{label}</span>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  description,
  category,
  threshold
}: { 
  icon: any; 
  label: string; 
  value: string;
  description: string;
  category?: string;
  threshold?: { good: string; poor: string };
}) => {
  const categoryStyles = category ? getCategoryColor(category) : 'text-foreground bg-muted';
  
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        {category && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryStyles}`}>
            {getCategoryLabel(category)}
          </span>
        )}
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <div className="text-sm font-medium text-foreground mb-1">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
      {threshold && (
        <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs">
          <span className="text-emerald-600">Gut: {threshold.good}</span>
          <span className="text-red-600">Schlecht: {threshold.poor}</span>
        </div>
      )}
    </div>
  );
};

export default function PerformancePage() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const [shop, setShop] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { canUseDesktop, canRunPerformanceTest, usage, plan } = usePlan();

  useEffect(() => {
    const shopParam = searchParams.get('shop');
    if (shopParam) {
      setShop(shopParam);
      setCustomUrl(`https://${shopParam}`);
      
      // Check cache first
      const cached = localStorage.getItem(`tm_performance_full_${shopParam}`);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          setData(cachedData);
          setHasRunOnce(true);
        } catch (e) {
          // Cache parse error - continue without cached data
        }
      }
    }
  }, [searchParams]);

  // Auto-run when strategy changes (only if we already have data)
  useEffect(() => {
    if (hasRunOnce && customUrl && !isLoading) {
      runAnalysis();
    }
  }, [strategy]);

  const runAnalysis = async (url?: string) => {
    const targetUrl = url || customUrl;
    if (!targetUrl) return;

    // Check plan limits
    const perfCheck = canRunPerformanceTest();
    if (!perfCheck.allowed) {
      setError(perfCheck.reason || 'Limit erreicht');
      setShowUpgradeModal(true);
      return;
    }

    // Check desktop permission
    if (strategy === 'desktop') {
      const desktopCheck = canUseDesktop();
      if (!desktopCheck.allowed) {
        setError(desktopCheck.reason || 'Desktop nicht verfügbar');
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setHasRunOnce(true);

    try {
      const response = await authenticatedFetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, strategy, shop }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.upgradeRequired) {
          setShowUpgradeModal(true);
        }
        throw new Error(errorData.message || errorData.details || errorData.error || 'Analyse fehlgeschlagen');
      }

      const result = await response.json();
      setData(result);
      
      // Cache the result
      if (shop) {
        localStorage.setItem(`tm_performance_full_${shop}`, JSON.stringify(result));
        // Also cache the score for dashboard
        // Note: scores.performance is already 0-100 from Lighthouse
        if (result.scores?.performance !== undefined) {
          const scoreValue = result.scores.performance;
          // If score is between 0-1, multiply by 100. If already 0-100, use as is.
          const normalizedScore = scoreValue <= 1 ? Math.round(scoreValue * 100) : Math.round(scoreValue);
          
          // Preserve existing values for the other strategy
          const existingData = localStorage.getItem(`tm_performance_${shop}`);
          let perfData = { mobile: 0, desktop: 0 };
          if (existingData) {
            try {
              perfData = JSON.parse(existingData);
            } catch (e) {}
          }
          
          // Update only the current strategy
          if (strategy === 'mobile') {
            perfData.mobile = normalizedScore;
          } else {
            perfData.desktop = normalizedScore;
          }
          
          localStorage.setItem(`tm_performance_${shop}`, JSON.stringify(perfData));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Web Performance</h1>
          <p className="text-muted-foreground mt-1">Core Web Vitals & Lighthouse Analyse</p>
        </div>
      </div>

      {/* URL Input & Run Button */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col gap-4">
          {/* URL Input Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Shop URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://dein-shop.myshopify.com"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => runAnalysis()}
                disabled={isLoading || !customUrl}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Performance messen
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile/Desktop Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Gerätetyp:</span>
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted">
              <button
                onClick={() => setStrategy('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  strategy === 'mobile'
                    ? 'bg-card text-indigo-600 shadow-sm dark:bg-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
              {canUseDesktop().allowed ? (
                <button
                  onClick={() => setStrategy('desktop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    strategy === 'desktop'
                      ? 'bg-card text-indigo-600 shadow-sm dark:bg-secondary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                </button>
              ) : (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all relative group"
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Ab Starter Plan
                  </span>
                </button>
              )}
            </div>
            
            {/* Usage indicator */}
            {usage && usage.performanceTests.limit !== -1 && (
              <div className="text-xs text-muted-foreground">
                {usage.performanceTests.remaining} von {usage.performanceTests.limit} Tests übrig
              </div>
            )}
          </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-4 p-4 bg-muted rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>Die Analyse nutzt Google PageSpeed Insights und misst die Performance auf mobilen Geräten. 
            Die Messung dauert ca. 30-60 Sekunden.</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Fehler bei der Analyse</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-foreground">Analysiere Performance...</p>
          <p className="text-sm text-muted-foreground mt-1">Dies kann bis zu 60 Sekunden dauern</p>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && (
        <>
          {/* Lighthouse Scores */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Lighthouse Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <ScoreCircle score={data.scores.performance} label="Performance" />
              <ScoreCircle score={data.scores.accessibility} label="Accessibility" />
              <ScoreCircle score={data.scores.bestPractices} label="Best Practices" />
              <ScoreCircle score={data.scores.seo} label="SEO" />
            </div>
            
            {/* Score Legend */}
            <div className="mt-6 pt-6 border-t border-border flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">90-100: Gut</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">50-89: Verbesserungswürdig</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">0-49: Schlecht</span>
              </div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Core Web Vitals (Lab Data)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <MetricCard
                icon={Eye}
                label="Largest Contentful Paint (LCP)"
                value={data.labData.lcp.displayValue}
                description="Zeit bis das größte Element sichtbar ist"
                category={data.labData.lcp.value <= 2500 ? 'FAST' : data.labData.lcp.value <= 4000 ? 'AVERAGE' : 'SLOW'}
                threshold={{ good: '≤ 2.5s', poor: '> 4s' }}
              />
              <MetricCard
                icon={Layout}
                label="Cumulative Layout Shift (CLS)"
                value={data.labData.cls.displayValue}
                description="Visuelle Stabilität der Seite"
                category={data.labData.cls.value <= 0.1 ? 'FAST' : data.labData.cls.value <= 0.25 ? 'AVERAGE' : 'SLOW'}
                threshold={{ good: '≤ 0.1', poor: '> 0.25' }}
              />
              <MetricCard
                icon={MousePointer}
                label="Total Blocking Time (TBT)"
                value={data.labData.tbt.displayValue}
                description="Zeit in der die Seite blockiert ist"
                category={data.labData.tbt.value <= 200 ? 'FAST' : data.labData.tbt.value <= 600 ? 'AVERAGE' : 'SLOW'}
                threshold={{ good: '≤ 200ms', poor: '> 600ms' }}
              />
            </div>
          </div>

          {/* Additional Metrics */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Weitere Metriken</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <MetricCard
                icon={Zap}
                label="First Contentful Paint (FCP)"
                value={data.labData.fcp.displayValue}
                description="Zeit bis der erste Inhalt erscheint"
                category={data.labData.fcp.value <= 1800 ? 'FAST' : data.labData.fcp.value <= 3000 ? 'AVERAGE' : 'SLOW'}
              />
              <MetricCard
                icon={Activity}
                label="Speed Index"
                value={data.labData.speedIndex.displayValue}
                description="Wie schnell Inhalte sichtbar werden"
                category={data.labData.speedIndex.value <= 3400 ? 'FAST' : data.labData.speedIndex.value <= 5800 ? 'AVERAGE' : 'SLOW'}
              />
              <MetricCard
                icon={Clock}
                label="Time to Interactive (TTI)"
                value={data.labData.tti.displayValue}
                description="Zeit bis die Seite interaktiv ist"
                category={data.labData.tti.value <= 3800 ? 'FAST' : data.labData.tti.value <= 7300 ? 'AVERAGE' : 'SLOW'}
              />
            </div>
          </div>

          {/* Field Data (if available) */}
          {data.fieldData && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-foreground">Echte Nutzerdaten (Field Data)</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Basierend auf echten Chrome-Nutzern der letzten 28 Tage
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                {data.fieldData.lcp && (
                  <div className="bg-card rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">LCP</div>
                    <div className="text-xl font-bold text-foreground">{(data.fieldData.lcp.value / 1000).toFixed(1)}s</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(data.fieldData.lcp.category)}`}>
                      {getCategoryLabel(data.fieldData.lcp.category)}
                    </span>
                  </div>
                )}
                {data.fieldData.cls && (
                  <div className="bg-card rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">CLS</div>
                    <div className="text-xl font-bold text-foreground">{data.fieldData.cls.value.toFixed(2)}</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(data.fieldData.cls.category)}`}>
                      {getCategoryLabel(data.fieldData.cls.category)}
                    </span>
                  </div>
                )}
                {data.fieldData.inp && (
                  <div className="bg-card rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">INP</div>
                    <div className="text-xl font-bold text-foreground">{data.fieldData.inp.value}ms</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(data.fieldData.inp.category)}`}>
                      {getCategoryLabel(data.fieldData.inp.category)}
                    </span>
                  </div>
                )}
                {data.fieldData.fcp && (
                  <div className="bg-card rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">FCP</div>
                    <div className="text-xl font-bold text-foreground">{(data.fieldData.fcp.value / 1000).toFixed(1)}s</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(data.fieldData.fcp.category)}`}>
                      {getCategoryLabel(data.fieldData.fcp.category)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-center text-sm text-muted-foreground">
            Analysiert: {new Date(data.timestamp).toLocaleString('de-DE')} • {data.strategy === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'} • {data.analyzedUrl}
          </div>
        </>
      )}

      {/* Empty State */}
      {!data && !isLoading && !error && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gauge className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Starte deine erste Performance-Analyse</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Gib die URL deines Shops ein und klicke auf "Performance messen" um detaillierte 
            Einblicke in die Web Performance zu erhalten.
          </p>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Desktop Performance"
        reason={canUseDesktop().reason || canRunPerformanceTest().reason || 'Upgrade erforderlich'}
        recommendedPlan="starter"
        shop={shop}
      />
    </div>
  );
}
