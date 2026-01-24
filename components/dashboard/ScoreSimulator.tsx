'use client';

import { useState } from 'react';
import { Sparkles, Check, TrendingUp, Zap, Clock, ShoppingCart } from 'lucide-react';

interface Fix {
  id: string;
  title: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  section: string;
}

interface SimulatorProps {
  currentScore: number;
  fixes: Fix[];
}

export function ScoreSimulator({ currentScore, fixes }: SimulatorProps) {
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());

  const toggleFix = (id: string) => {
    setSelectedFixes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedFixes(new Set(fixes.map(f => f.id)));
  };

  const clearAll = () => {
    setSelectedFixes(new Set());
  };

  const totalImpact = fixes
    .filter(f => selectedFixes.has(f.id))
    .reduce((sum, f) => sum + f.impact, 0);

  const projectedScore = Math.min(100, currentScore + totalImpact);
  const scoreIncrease = projectedScore - currentScore;

  // Estimate conversion impact (rough formula)
  const conversionImpact = (scoreIncrease * 0.3).toFixed(1);
  
  // Estimate time savings
  const timeSavings = (scoreIncrease * 12).toFixed(0); // ms per point

  const effortLabels = {
    low: { label: '~5 Min', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
    medium: { label: '~30 Min', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
    high: { label: '~2 Std', color: 'text-red-600 dark:text-red-400 bg-red-500/10' },
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-foreground">Score Simulator</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={selectAll}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Alle auswählen
            </button>
            <span className="text-muted-foreground text-300">|</span>
            <button 
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Aktuell</p>
            <p className="text-4xl font-bold">{currentScore}</p>
          </div>
          
          <div className="flex-1 mx-8">
            <div className="h-2 bg-secondary bg-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${projectedScore}%` }}
              />
            </div>
            {scoreIncrease > 0 && (
              <div className="flex justify-center mt-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +{scoreIncrease} Punkte
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Projiziert</p>
            <p className={`text-4xl font-bold ${scoreIncrease > 0 ? 'text-emerald-400' : ''}`}>
              {projectedScore}
            </p>
          </div>
        </div>

        {/* Impact Metrics */}
        {scoreIncrease > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border border-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">+{conversionImpact}%</p>
              <p className="text-xs text-muted-foreground">Conversion</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">-{timeSavings}ms</p>
              <p className="text-xs text-muted-foreground">Load Time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">{selectedFixes.size}</p>
              <p className="text-xs text-muted-foreground">Fixes</p>
            </div>
          </div>
        )}
      </div>

      {/* Fix Selection */}
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {fixes.map((fix) => {
          const isSelected = selectedFixes.has(fix.id);
          const effort = effortLabels[fix.effort];
          
          return (
            <button
              key={fix.id}
              onClick={() => toggleFix(fix.id)}
              className={`w-full px-6 py-4 flex items-center gap-4 text-left transition-colors ${
                isSelected ? 'bg-indigo-500/10' : 'hover:bg-muted'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-border border-300'
              }`}>
                {isSelected && <Check className="w-4 h-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-foreground'}`}>
                  {fix.title}
                </p>
                <p className="text-sm text-muted-foreground">{fix.section}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${effort.color}`}>
                  {effort.label}
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  +{fix.impact}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      {selectedFixes.size > 0 && (
        <div className="px-6 py-4 bg-muted border-t border-border">
          <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
            {selectedFixes.size} Fixes anwenden → Score auf {projectedScore} verbessern
          </button>
        </div>
      )}
    </div>
  );
}
