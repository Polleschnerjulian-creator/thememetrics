'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Loader2, Lightbulb } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

const educationalTips = [
  { emoji: '💡', text: '1 Sekunde längere Ladezeit kostet durchschnittlich 7% Conversion.' },
  { emoji: '📱', text: '53% der mobilen Nutzer verlassen Seiten die länger als 3 Sekunden laden.' },
  { emoji: '🎯', text: 'Section-Level Optimierung ist effektiver als globale Änderungen.' },
  { emoji: '💰', text: 'Top Shopify Stores haben einen ThemeMetrics Score von 85+.' },
  { emoji: '⚡', text: 'Lazy Loading kann deine initiale Ladezeit um bis zu 40% reduzieren.' },
  { emoji: '🔍', text: 'Google nutzt Core Web Vitals als Ranking-Faktor seit 2021.' },
];

interface AnalysisProgressProps {
  onComplete: () => void;
}

export function AnalysisProgress({ onComplete }: AnalysisProgressProps) {
  const { currentStep, analysisProgress, setStep } = useOnboarding();
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'theme', label: 'Theme-Daten laden', status: 'pending' },
    { id: 'sections', label: 'Sections finden', status: 'pending' },
    { id: 'analyze', label: 'Sections analysieren', status: 'pending' },
    { id: 'vitals', label: 'Core Web Vitals abrufen', status: 'pending' },
    { id: 'score', label: 'Score berechnen', status: 'pending' },
  ]);
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentStep === 'analyzing') {
      setIsVisible(true);
    }
  }, [currentStep]);

  // Rotate tips every 4 seconds
  useEffect(() => {
    if (currentStep !== 'analyzing') return;
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % educationalTips.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentStep]);

  // Update steps based on progress
  useEffect(() => {
    const { step, percent } = analysisProgress;
    
    setSteps(prev => prev.map(s => {
      if (step === 'theme' && s.id === 'theme') {
        return { ...s, status: 'active' };
      }
      if (step === 'sections') {
        if (s.id === 'theme') return { ...s, status: 'complete' };
        if (s.id === 'sections') return { ...s, status: 'active' };
      }
      if (step === 'analyze') {
        if (s.id === 'theme' || s.id === 'sections') return { ...s, status: 'complete' };
        if (s.id === 'analyze') return { ...s, status: 'active' };
      }
      if (step === 'vitals') {
        if (s.id === 'theme' || s.id === 'sections' || s.id === 'analyze') return { ...s, status: 'complete' };
        if (s.id === 'vitals') return { ...s, status: 'active' };
      }
      if (step === 'score') {
        if (s.id !== 'score') return { ...s, status: 'complete' };
        if (s.id === 'score') return { ...s, status: 'active' };
      }
      if (step === 'complete') {
        return { ...s, status: 'complete' };
      }
      return s;
    }));

    // When analysis is complete, move to results
    if (step === 'complete' && percent === 100) {
      setTimeout(() => {
        setStep('score-reveal');
        onComplete();
      }, 500);
    }
  }, [analysisProgress, setStep, onComplete]);

  if (currentStep !== 'analyzing') return null;

  const tip = educationalTips[currentTip];
  const { current, total, percent, step } = analysisProgress;

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Analysiere dein Theme...</h2>
          <p className="text-white/80 text-sm">Dies dauert etwa 45 Sekunden</p>
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* Step List */}
          <div className="space-y-3 mb-6">
            {steps.map((s, i) => (
              <div 
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  s.status === 'active' ? 'bg-indigo-50 dark:bg-indigo-950/30' : 
                  s.status === 'complete' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 
                  'bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {s.status === 'complete' && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {s.status === 'active' && (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  )}
                  {s.status === 'pending' && (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
                <span className={`flex-1 ${
                  s.status === 'complete' ? 'text-emerald-700 dark:text-emerald-400' :
                  s.status === 'active' ? 'text-indigo-700 dark:text-indigo-400 font-medium' :
                  'text-muted-foreground'
                }`}>
                  {s.label}
                  {s.status === 'active' && s.id === 'analyze' && total > 0 && (
                    <span className="text-sm ml-2">({current}/{total})</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium text-foreground">{percent}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Educational Tip */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tip.emoji}</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Wusstest du?</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{tip.text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
