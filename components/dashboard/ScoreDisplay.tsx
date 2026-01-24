'use client';

import { useState } from 'react';
import { 
  Zap, 
  Code2, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// Score data interfaces
export interface ScoreData {
  overall: number;
  speed: {
    score: number;
    coreWebVitals: number;
    sectionLoad: number;
    details?: {
      lcp: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      cls: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      fcp: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
      tbt: { value: number; score: number; status: 'good' | 'warning' | 'poor' };
    } | null;
    penalties: Array<{ section: string; reason: string; points: number }>;
  };
  quality: {
    score: number;
    liquidQuality: number;
    bestPractices: number;
    architecture: number;
    issues: Array<{ section: string; issue: string; severity: 'high' | 'medium' | 'low' }>;
  };
  conversion: {
    score: number;
    ecommerce: number;
    mobile: number;
    revenueImpact: number;
    estimatedMonthlyLoss: number;
  };
  hasRealData: boolean;
}

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exzellent';
  if (score >= 70) return 'Gut';
  if (score >= 50) return 'Verbesserungswürdig';
  return 'Kritisch';
}

function getStatusColor(status: 'good' | 'warning' | 'poor'): string {
  switch (status) {
    case 'good': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
    case 'warning': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
    case 'poor': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30';
  }
}

function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case 'lcp':
    case 'fcp':
      return `${(value / 1000).toFixed(1)}s`;
    case 'cls':
      return value.toFixed(2);
    case 'tbt':
      return `${Math.round(value)}ms`;
    default:
      return String(value);
  }
}

// Mini Score Circle
function MiniScoreCircle({ score, size = 60 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="25" cy="25" r="22" fill="none"
          className={getScoreBg(score).replace('bg-', 'stroke-')}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
    </div>
  );
}

// Main Score Display
export function MainScoreDisplay({ score, shop }: { score: ScoreData; shop: string }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">ThemeMetrics Score</h2>
          <p className="text-sm text-muted-foreground mt-1">Dein Theme Performance Rating</p>
        </div>
        <Link 
          href={`/dashboard/score-info?shop=${shop}`}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Wie wird berechnet?
        </Link>
      </div>

      <div className="flex items-center gap-8">
        {/* Main Score Circle */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              className={getScoreBg(score.overall).replace('bg-', 'stroke-')}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score.overall)}`}>{score.overall}</span>
            <span className="text-xs text-muted-foreground">von 100</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="flex-1 space-y-3">
          {/* Speed */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Speed</span>
                <span className={`text-sm font-semibold ${getScoreColor(score.speed.score)}`}>{score.speed.score}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${getScoreBg(score.speed.score)} rounded-full transition-all duration-500`} style={{ width: `${score.speed.score}%` }} />
              </div>
            </div>
          </div>

          {/* Quality */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Quality</span>
                <span className={`text-sm font-semibold ${getScoreColor(score.quality.score)}`}>{score.quality.score}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${getScoreBg(score.quality.score)} rounded-full transition-all duration-500`} style={{ width: `${score.quality.score}%` }} />
              </div>
            </div>
          </div>

          {/* Conversion */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Conversion</span>
                <span className={`text-sm font-semibold ${getScoreColor(score.conversion.score)}`}>{score.conversion.score}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${getScoreBg(score.conversion.score)} rounded-full transition-all duration-500`} style={{ width: `${score.conversion.score}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Badge */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {score.hasRealData ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Basierend auf echten Google PageSpeed Daten</span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Schätzung basierend auf Code-Analyse</span>
            </>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          score.overall >= 70 ? 'bg-emerald-50 text-emerald-700' :
          score.overall >= 50 ? 'bg-amber-50 text-amber-700' :
          'bg-red-50 text-red-700'
        }`}>
          {getScoreLabel(score.overall)}
        </span>
      </div>
    </div>
  );
}

// Detailed Score Breakdown Card
export function ScoreBreakdownCard({ score, showDetails = false }: { score: ScoreData; showDetails?: boolean }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Score Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-1">Detailanalyse deiner Theme-Performance</p>
      </div>

      {/* Speed Section */}
      <div className="border-b border-border">
        <button
          onClick={() => setExpandedSection(expandedSection === 'speed' ? null : 'speed')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <MiniScoreCircle score={score.speed.score} size={48} />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-foreground">Speed Score</span>
                <span className="text-xs text-muted-foreground">(40%)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Core Web Vitals & Section Load Impact</p>
            </div>
          </div>
          {expandedSection === 'speed' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        
        {expandedSection === 'speed' && (
          <div className="px-4 pb-4 space-y-3">
            {/* Core Web Vitals */}
            {score.speed.details && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Core Web Vitals (Google)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['lcp', 'cls', 'fcp', 'tbt'] as const).map(metric => {
                    const data = score.speed.details![metric];
                    return (
                      <div key={metric} className="flex items-center justify-between bg-card rounded p-2">
                        <span className="text-xs text-muted-foreground uppercase">{metric}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStatusColor(data.status)}`}>
                          {formatMetricValue(metric, data.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Penalties */}
            {showDetails && score.speed.penalties.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Performance-Abzüge</p>
                <div className="space-y-1">
                  {score.speed.penalties.slice(0, 5).map((penalty, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-red-50 rounded px-2 py-1.5">
                      <span className="text-foreground">{penalty.section}: {penalty.reason}</span>
                      <span className="text-red-600 font-medium">-{penalty.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Core Web Vitals: {score.speed.coreWebVitals}/100</span>
              <span>Section Load: {score.speed.sectionLoad}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Quality Section */}
      <div className="border-b border-border">
        <button
          onClick={() => setExpandedSection(expandedSection === 'quality' ? null : 'quality')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <MiniScoreCircle score={score.quality.score} size={48} />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-foreground">Quality Score</span>
                <span className="text-xs text-muted-foreground">(35%)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Liquid Code, Best Practices & Architektur</p>
            </div>
          </div>
          {expandedSection === 'quality' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        
        {expandedSection === 'quality' && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.quality.liquidQuality)}`}>{score.quality.liquidQuality}</div>
                <div className="text-xs text-muted-foreground">Liquid Code</div>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.quality.bestPractices)}`}>{score.quality.bestPractices}</div>
                <div className="text-xs text-muted-foreground">Best Practices</div>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.quality.architecture)}`}>{score.quality.architecture}</div>
                <div className="text-xs text-muted-foreground">Architektur</div>
              </div>
            </div>

            {showDetails && score.quality.issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Gefundene Probleme</p>
                <div className="space-y-1">
                  {score.quality.issues.map((issue, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 ${
                      issue.severity === 'high' ? 'bg-red-50' :
                      issue.severity === 'medium' ? 'bg-amber-50' : 'bg-muted'
                    }`}>
                      <AlertTriangle className={`w-3 h-3 ${
                        issue.severity === 'high' ? 'text-red-500' :
                        issue.severity === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
                      }`} />
                      <span className="text-foreground">{issue.section}: {issue.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversion Section */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'conversion' ? null : 'conversion')}
          className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <MiniScoreCircle score={score.conversion.score} size={48} />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-foreground">Conversion Score</span>
                <span className="text-xs text-muted-foreground">(25%)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">E-Commerce, Mobile UX & Revenue Impact</p>
            </div>
          </div>
          {expandedSection === 'conversion' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        
        {expandedSection === 'conversion' && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.conversion.ecommerce)}`}>{score.conversion.ecommerce}</div>
                <div className="text-xs text-muted-foreground">E-Commerce</div>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.conversion.mobile)}`}>{score.conversion.mobile}</div>
                <div className="text-xs text-muted-foreground">Mobile UX</div>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className={`text-lg font-bold ${getScoreColor(score.conversion.revenueImpact)}`}>{score.conversion.revenueImpact}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
            </div>

            {score.conversion.estimatedMonthlyLoss > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Geschätzter Umsatzverlust: ~€{score.conversion.estimatedMonthlyLoss.toLocaleString('de-DE')}/Monat
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Basierend auf 7% Conversion-Verlust pro Sekunde Ladezeit über 2s
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact Score Display for header/sidebar
export function CompactScoreDisplay({ score }: { score: ScoreData }) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3">
      <MiniScoreCircle score={score.overall} size={40} />
      <div>
        <div className="text-sm font-semibold text-foreground">ThemeMetrics Score</div>
        <div className="text-xs text-muted-foreground">{getScoreLabel(score.overall)}</div>
      </div>
    </div>
  );
}
