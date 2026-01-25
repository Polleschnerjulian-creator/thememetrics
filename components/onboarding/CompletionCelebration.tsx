'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, PartyPopper, TrendingUp, Sparkles, CheckCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

export function CompletionCelebration() {
  const { currentStep, setStep, results } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (currentStep === 'completion') {
      setIsVisible(true);
      // Trigger confetti animation
      setTimeout(() => setShowConfetti(true), 300);
    } else {
      setIsVisible(false);
      setShowConfetti(false);
    }
  }, [currentStep]);

  if (!isVisible || !results) return null;

  // Calculate potential new score
  const potentialScore = Math.min(100, results.score + 8);
  const monthlyGain = Math.round(results.totalMonthlyLoss * 0.3);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div 
                className={`w-3 h-3 ${
                  ['bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-blue-500'][Math.floor(Math.random() * 5)]
                }`}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Großartig! 🎉</h2>
          <p className="text-white/90">Du hast deinen ersten Fix umgesetzt!</p>
        </div>

        <div className="p-6">
          {/* Score Change */}
          <div className="bg-muted rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Vorher</p>
                <p className="text-3xl font-bold text-foreground">{results.score}</p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-6 h-6 text-emerald-500" />
                <div className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+8</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Potenzial</p>
                <p className="text-3xl font-bold text-emerald-500">{potentialScore}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Geschätzte Ersparnis: <span className="font-semibold text-emerald-600 dark:text-emerald-400">~€{monthlyGain}/Monat</span>
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Nächste Schritte
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-foreground">Theme speichern & veröffentlichen</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded-full" />
                <span className="text-foreground">Neu analysieren um Fortschritt zu sehen</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded-full" />
                <span className="text-foreground">Weitere Empfehlungen umsetzen</span>
              </div>
            </div>
          </div>

          {/* Next Recommendation Teaser */}
          {results.criticalSections.length > 1 && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
                <span className="font-medium">Nächste Empfehlung:</span>
              </p>
              <p className="text-indigo-900 dark:text-indigo-100 font-medium">
                {results.criticalSections[1].name} optimieren
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                +12 Punkte möglich
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('done')}
              className="flex-1 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
            >
              Zum Dashboard
            </button>
            <button
              onClick={() => setStep('done')}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Neu analysieren
            </button>
          </div>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
