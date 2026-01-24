'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

interface ScoreComparison {
  previousScore: number;
  currentScore: number;
  previousAnalyzedAt: string;
  currentAnalyzedAt: string;
  improvements: SectionImprovement[];
  regressions: SectionRegression[];
}

interface SectionImprovement {
  sectionName: string;
  previousScore: number;
  currentScore: number;
  improvement: number;
  fixApplied?: string;
}

interface SectionRegression {
  sectionName: string;
  previousScore: number;
  currentScore: number;
  regression: number;
  possibleCause?: string;
}

interface ValidationBannerProps {
  shop: string;
  currentScore: number;
  onReanalyze?: () => void;
}

export function ValidationBanner({ shop, currentScore, onReanalyze }: ValidationBannerProps) {
  const [comparison, setComparison] = useState<ScoreComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/themes/history?shop=${shop}&compare=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasComparison) {
            setComparison(data.comparison);
          }
        }
      } catch (err) {
        console.error('Failed to fetch comparison:', err);
      } finally {
        setLoading(false);
      }
    };

    if (shop) {
      fetchComparison();
    }
  }, [shop]);

  if (loading || !comparison || dismissed) return null;

  const scoreDiff = comparison.currentScore - comparison.previousScore;
  const isImproved = scoreDiff > 0;
  const isRegressed = scoreDiff < 0;
  const isUnchanged = scoreDiff === 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't show if no significant change
  if (Math.abs(scoreDiff) < 2) return null;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isImproved 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : isRegressed 
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-slate-500/10 border-slate-500/30'
    }`}>
      {/* Main Banner */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isImproved 
              ? 'bg-emerald-500/20' 
              : isRegressed 
                ? 'bg-red-500/20'
                : 'bg-slate-500/20'
          }`}>
            {isImproved ? (
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            ) : isRegressed ? (
              <TrendingDown className="w-6 h-6 text-red-500" />
            ) : (
              <Minus className="w-6 h-6 text-slate-500" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${
                isImproved ? 'text-emerald-700 dark:text-emerald-300' : 
                isRegressed ? 'text-red-700 dark:text-red-300' : 'text-foreground'
              }`}>
                {isImproved ? '🎉 Score verbessert!' : isRegressed ? '⚠️ Score gesunken' : 'Keine Änderung'}
              </h3>
              <span className={`text-2xl font-bold ${
                isImproved ? 'text-emerald-600 dark:text-emerald-400' : 
                isRegressed ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              }`}>
                {isImproved ? '+' : ''}{scoreDiff} Punkte
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mt-0.5">
              {comparison.previousScore} → {comparison.currentScore} 
              <span className="mx-2">•</span>
              Letzte Analyse: {formatDate(comparison.previousAnalyzedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comparison.improvements.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isImproved 
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30'
              }`}
            >
              {showDetails ? 'Weniger' : 'Details anzeigen'}
            </button>
          )}
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-border/50 p-4 bg-card/50">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Improvements */}
            {comparison.improvements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  Verbesserungen ({comparison.improvements.length})
                </h4>
                <div className="space-y-2">
                  {comparison.improvements.map((item, idx) => (
                    <div key={idx} className="bg-emerald-500/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{item.sectionName}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{item.previousScore}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{item.currentScore}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{item.improvement}</span>
                        </div>
                      </div>
                      {item.fixApplied && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ {item.fixApplied}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regressions */}
            {comparison.regressions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  Verschlechterungen ({comparison.regressions.length})
                </h4>
                <div className="space-y-2">
                  {comparison.regressions.map((item, idx) => (
                    <div key={idx} className="bg-red-500/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{item.sectionName}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{item.previousScore}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-red-600 dark:text-red-400 font-medium">{item.currentScore}</span>
                          <span className="text-red-600 dark:text-red-400 font-bold">{item.regression}</span>
                        </div>
                      </div>
                      {item.possibleCause && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Mögliche Ursache: {item.possibleCause}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Re-analyze CTA */}
          {onReanalyze && (
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Weitere Änderungen vorgenommen? Analysiere dein Theme erneut.
              </p>
              <button
                onClick={onReanalyze}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Erneut analysieren
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar/widget
export function ScoreChangeIndicator({ previousScore, currentScore }: { previousScore: number; currentScore: number }) {
  const diff = currentScore - previousScore;
  
  if (Math.abs(diff) < 1) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
      diff > 0 
        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
        : 'bg-red-500/20 text-red-600 dark:text-red-400'
    }`}>
      {diff > 0 ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {diff > 0 ? '+' : ''}{diff}
    </span>
  );
}

// Success celebration modal
export function ImprovementCelebration({ 
  improvement, 
  sectionName,
  onClose 
}: { 
  improvement: number;
  sectionName?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Großartig! 🎉
        </h2>
        
        <p className="text-4xl font-bold text-emerald-500 mb-4">
          +{improvement} Punkte
        </p>
        
        <p className="text-muted-foreground mb-6">
          {sectionName 
            ? `Deine ${sectionName} Section wurde erfolgreich optimiert!`
            : 'Dein Theme-Score hat sich verbessert!'
          }
        </p>

        <div className="bg-emerald-500/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            💡 <strong>Tipp:</strong> Teile deinen Erfolg! Optimierte Shops haben im Durchschnitt 
            <strong> 12% höhere Conversion Rates</strong>.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          Weiter optimieren
        </button>
      </div>
    </div>
  );
}
