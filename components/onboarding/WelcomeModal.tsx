'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, TrendingUp, ArrowRight, X } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface WelcomeModalProps {
  shopName: string;
  themeName: string;
  onStartAnalysis: () => void;
}

export function WelcomeModal({ shopName, themeName, onStartAnalysis }: WelcomeModalProps) {
  const { currentStep, setStep, skipOnboarding } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentStep === 'welcome') {
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [currentStep]);

  if (currentStep !== 'welcome') return null;

  const handleStart = () => {
    setStep('analyzing');
    onStartAnalysis();
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  const displayShopName = shopName?.replace('.myshopify.com', '') || 'deinem Shop';

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-card rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              Willkommen, {displayShopName}! 👋
            </h1>
            <p className="text-white/90 text-lg">
              Lass uns herausfinden, welche Sections deines Themes deine Conversion bremsen.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Theme Info */}
          {themeName && (
            <div className="bg-muted rounded-2xl p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theme erkannt</p>
                <p className="font-semibold text-foreground">{themeName}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Analyse-Zeit</p>
                <p className="font-semibold text-foreground">~45 Sek.</p>
              </div>
            </div>
          )}

          {/* What we'll do */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-foreground">Was wir analysieren:</h3>
            <div className="grid gap-3">
              {[
                { icon: Zap, text: 'Jede Section auf Performance-Probleme', color: 'text-blue-500' },
                { icon: TrendingUp, text: 'Auswirkungen auf deine Conversion', color: 'text-emerald-500' },
                { icon: Sparkles, text: 'Konkrete Fixes mit Aufwand & Impact', color: 'text-purple-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
          >
            Analyse starten
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleSkip}
            className="w-full mt-3 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Überspringen – ich kenne mich aus
          </button>
        </div>
      </div>
    </div>
  );
}
