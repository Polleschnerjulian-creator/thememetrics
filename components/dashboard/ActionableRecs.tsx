'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

interface Recommendation {
  id: string;
  text: string;
  section: string;
  score: number;
  impact: 'high' | 'medium' | 'low';
  effort?: 'low' | 'medium' | 'high';
  codeSnippet?: string;
  learnMoreUrl?: string;
}

interface ActionableRecCardProps {
  rec: Recommendation;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
}

export function ActionableRecCard({ rec, isCompleted, onToggleComplete }: ActionableRecCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const impactConfig = {
    high: { 
      label: 'Hoher Impact', 
      icon: Zap, 
      color: 'text-red-600 bg-red-50 border-red-200',
      badge: 'bg-red-500'
    },
    medium: { 
      label: 'Mittlerer Impact', 
      icon: TrendingUp, 
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'bg-amber-500'
    },
    low: { 
      label: 'Niedriger Impact', 
      icon: Lightbulb, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-500'
    },
  };

  const effortConfig = {
    low: { label: '~5 Min', color: 'text-emerald-600' },
    medium: { label: '~30 Min', color: 'text-amber-600' },
    high: { label: '~2 Std', color: 'text-red-600' },
  };

  const config = impactConfig[rec.impact];
  const effort = rec.effort ? effortConfig[rec.effort] : null;
  const Icon = config.icon;

  const handleCopy = async () => {
    if (rec.codeSnippet) {
      await navigator.clipboard.writeText(rec.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-card rounded-xl border transition-all ${
      isCompleted ? 'opacity-60 border-border' : config.color
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button 
            onClick={() => onToggleComplete(rec.id)}
            className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-border border-300 hover:border-border border-400'
            }`}
          >
            {isCompleted && <CheckCircle2 className="w-4 h-4" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${config.badge}`}>
                {config.label}
              </span>
              {effort && (
                <span className={`flex items-center gap-1 text-xs ${effort.color}`}>
                  <Clock className="w-3 h-3" />
                  {effort.label}
                </span>
              )}
            </div>
            
            <p className={`text-foreground ${isCompleted ? 'line-through' : ''}`}>
              {rec.text}
            </p>
            
            <p className="text-sm text-muted-foreground mt-1">
              Section: <span className="font-medium">{rec.section}</span>
              <span className="mx-2">•</span>
              Score: <span className={`font-medium ${
                rec.score < 50 ? 'text-red-600' : 
                rec.score < 70 ? 'text-amber-600' : 'text-emerald-600'
              }`}>{rec.score}</span>
            </p>
          </div>

          {(rec.codeSnippet || rec.learnMoreUrl) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {rec.codeSnippet && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Code-Snippet</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
                <pre className="bg-secondary bg-900 text-muted-foreground text-100 rounded-lg p-3 text-sm overflow-x-auto">
                  <code>{rec.codeSnippet}</code>
                </pre>
              </div>
            )}
            
            {rec.learnMoreUrl && (
              <a
                href={rec.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Mehr erfahren
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickWinsProps {
  recommendations: Recommendation[];
  completedIds: Set<string>;
  onToggleComplete: (id: string) => void;
}

export function QuickWins({ recommendations, completedIds, onToggleComplete }: QuickWinsProps) {
  // Filter for high-impact, low-effort items
  const quickWins = recommendations.filter(r => 
    r.impact === 'high' && (r.effort === 'low' || !r.effort)
  ).slice(0, 3);

  if (quickWins.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">Quick Wins</h3>
          <p className="text-sm text-white/80">Hoher Impact, wenig Aufwand</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {quickWins.map((rec) => (
          <div 
            key={rec.id}
            className={`bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3 ${
              completedIds.has(rec.id) ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => onToggleComplete(rec.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                completedIds.has(rec.id)
                  ? 'bg-card border-white text-emerald-500'
                  : 'border-white/50 hover:border-white'
              }`}
            >
              {completedIds.has(rec.id) && <CheckCircle2 className="w-3 h-3" />}
            </button>
            <span className={`text-sm ${completedIds.has(rec.id) ? 'line-through' : ''}`}>
              {rec.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImpactMatrix({ recommendations }: { recommendations: Recommendation[] }) {
  const matrix = {
    quickWins: recommendations.filter(r => r.impact === 'high' && r.effort === 'low'),
    bigBets: recommendations.filter(r => r.impact === 'high' && r.effort !== 'low'),
    fillIns: recommendations.filter(r => r.impact !== 'high' && r.effort === 'low'),
    avoid: recommendations.filter(r => r.impact === 'low' && r.effort === 'high'),
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">Impact-Effort Matrix</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Quick Wins</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{matrix.quickWins.length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Big Bets</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{matrix.bigBets.length}</p>
        </div>
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Fill-Ins</span>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">{matrix.fillIns.length}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Später</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{matrix.avoid.length}</p>
        </div>
      </div>
    </div>
  );
}
