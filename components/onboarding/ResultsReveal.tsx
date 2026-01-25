'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, TrendingUp, AlertTriangle, DollarSign, Sparkles } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

export function ResultsReveal() {
  const { currentStep, setStep, results } = useOnboarding();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const hasAnimated = useRef(false);

  // Animate score counting up - only once
  useEffect(() => {
    if (currentStep === 'score-reveal' && results && !hasAnimated.current) {
      hasAnimated.current = true;
      setShowContent(false);
      const target = results.score;
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedScore(target);
          clearInterval(timer);
          setTimeout(() => setShowContent(true), 300);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [currentStep, results]);

  if (!results) return null;
  
  // Only show for these specific steps
  if (currentStep !== 'score-reveal' && currentStep !== 'problems-reveal' && currentStep !== 'money-impact') {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exzellent';
    if (score >= 80) return 'Sehr gut';
    if (score >= 70) return 'Gut';
    if (score >= 60) return 'Okay';
    if (score >= 50) return 'Verbesserungswürdig';
    return 'Kritisch';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  // Score Reveal Screen
  if (currentStep === 'score-reveal') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-6">Dein ThemeMetrics Score</p>
            
            {/* Animated Score Circle */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={`${getScoreRingColor(results.score)} transition-all duration-1000`}
                  strokeDasharray={`${(animatedScore / 100) * 283} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-bold ${getScoreColor(results.score)}`}>
                  {animatedScore}
                </span>
                <span className="text-muted-foreground text-sm">von 100</span>
              </div>
            </div>

            {/* Score Label */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              results.score >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
              results.score >= 60 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{getScoreLabel(results.score)}</span>
            </div>

            {/* Percentile */}
            {showContent && (
              <p className="text-muted-foreground mb-8 animate-fade-in">
                Das ist besser als <span className="font-semibold text-foreground">{results.percentile}%</span> der Shopify Stores in deiner Branche.
              </p>
            )}

            {/* CTA */}
            {showContent && (
              <button
                onClick={() => setStep('problems-reveal')}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group animate-fade-in"
              >
                Weiter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Problems Reveal Screen
  if (currentStep === 'problems-reveal') {
    const criticalCount = results.criticalSections.filter(s => s.score < 50).length;
    const warningCount = results.criticalSections.filter(s => s.score >= 50 && s.score < 70).length;
    const improvementCount = results.criticalSections.filter(s => s.score >= 70 && s.score < 85).length;
    const totalCount = results.criticalSections.length;

    // Determine messaging based on score quality
    const isGoodScore = results.score >= 70;
    const headerIcon = isGoodScore ? Sparkles : AlertTriangle;
    const headerBgColor = isGoodScore ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30';
    const headerIconColor = isGoodScore ? 'text-amber-500' : 'text-red-500';

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${headerBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {isGoodScore ? (
                  <Sparkles className={`w-8 h-8 ${headerIconColor}`} />
                ) : (
                  <AlertTriangle className={`w-8 h-8 ${headerIconColor}`} />
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isGoodScore 
                  ? `Gut! Aber es gibt noch ${totalCount} Optimierungsmöglichkeiten`
                  : `Wir haben ${criticalCount + warningCount} problematische Sections gefunden`
                }
              </h2>
              <p className="text-muted-foreground">
                {isGoodScore 
                  ? 'Diese Sections haben noch Verbesserungspotenzial'
                  : 'Diese Sections bremsen deine Performance'
                }
              </p>
            </div>

            {/* Problem Sections List */}
            <div className="space-y-3 mb-8">
              {results.criticalSections.slice(0, 5).map((section, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    section.score < 50 ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' :
                    section.score < 70 ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' :
                    'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      section.score < 50 ? 'bg-red-500' : 
                      section.score < 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium text-foreground">{section.name}</span>
                  </div>
                  <span className={`font-bold ${
                    section.score < 50 ? 'text-red-600 dark:text-red-400' : 
                    section.score < 70 ? 'text-amber-600 dark:text-amber-400' : 
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {section.score}/100
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('money-impact')}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              Potenzial ansehen
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Money Impact Screen (the AHA moment!)
  if (currentStep === 'money-impact') {
    const hasRealData = results.dataSource === 'shopify';
    const showMoneyValues = results.totalMonthlyLoss > 0;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <p className="text-white/80 mb-1">Dein geschätztes Optimierungspotenzial</p>
            {showMoneyValues ? (
              <>
                <p className="text-5xl font-bold">~€{results.totalMonthlyLoss.toLocaleString('de-DE')}</p>
                <p className="text-white/80 mt-1">pro Monat zusätzlicher Umsatz möglich</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">Wird berechnet...</p>
                <p className="text-white/80 mt-1">Basierend auf deinen Shop-Daten</p>
              </>
            )}
          </div>

          <div className="p-6">
            {/* Breakdown */}
            {showMoneyValues && (
              <div className="space-y-3 mb-4">
                {results.criticalSections.slice(0, 4).map((section, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <span className="text-foreground">{section.name}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +€{section.monthlyLoss.toLocaleString('de-DE')}/Mo
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Data source & Disclaimer */}
            <div className="bg-muted/30 rounded-xl p-3 mb-6">
              <p className="text-xs text-muted-foreground text-center">
                {hasRealData ? (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Basierend auf deinen echten Shopify-Umsatzdaten</span>
                    <br />
                    Berechnung: 7% Conversion-Verlust pro Sekunde Ladezeit (Industry Standard)
                  </>
                ) : (
                  <>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Schätzung basierend auf Industry Benchmarks</span>
                    <br />
                    Für genauere Werte benötigen wir Zugriff auf deine Shop-Analytics
                  </>
                )}
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('first-fix')}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-5 h-5" />
              Optimierung starten
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setStep('done')}
              className="w-full mt-3 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Später – zum Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
