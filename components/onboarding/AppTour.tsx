'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, BarChart3, Lightbulb, Image, Accessibility, Gauge } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const tourSteps: TourStep[] = [
  {
    target: 'dashboard',
    title: 'Dashboard',
    description: 'Hier siehst du deinen Gesamt-Score, Trends und Quick-Wins auf einen Blick.',
    icon: BarChart3,
  },
  {
    target: 'themes',
    title: 'Theme Analysis',
    description: 'Detaillierte Analyse jeder einzelnen Section deines Themes mit konkreten Empfehlungen.',
    icon: Sparkles,
  },
  {
    target: 'performance',
    title: 'Performance',
    description: 'Core Web Vitals und Lighthouse Scores - teste jede URL deines Shops.',
    icon: Gauge,
  },
  {
    target: 'accessibility',
    title: 'Accessibility',
    description: 'Prüfe dein Theme auf Barrierefreiheit und WCAG-Konformität.',
    icon: Accessibility,
  },
  {
    target: 'images',
    title: 'Bildoptimierung',
    description: 'Finde zu große Bilder und fehlende Lazy-Loading Attribute.',
    icon: Image,
  },
  {
    target: 'recommendations',
    title: 'Empfehlungen',
    description: 'Alle Optimierungen priorisiert nach Impact und Aufwand - mit Copy-Paste Code.',
    icon: Lightbulb,
  },
];

export function AppTour() {
  const { showAppTour, setShowAppTour } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('tm_app_tour_completed', 'true');
    setShowAppTour(false);
  };

  const skipTour = () => {
    localStorage.setItem('tm_app_tour_completed', 'true');
    setShowAppTour(false);
  };

  if (!showAppTour) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button 
            onClick={skipTour}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            App Tour • {currentStep + 1} von {tourSteps.length}
          </div>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
          </div>
          
          <h2 className="text-2xl font-bold mb-1">{step.title}</h2>
          <p className="text-white/90">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="px-6 pt-4">
          <div className="flex justify-center gap-1.5">
            {tourSteps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep 
                    ? 'w-6 bg-indigo-500' 
                    : i < currentStep 
                      ? 'w-1.5 bg-indigo-300' 
                      : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                currentStep === 0 ? 'w-full' : ''
              }`}
            >
              {isLastStep ? 'Los geht\'s!' : 'Weiter'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={skipTour}
            className="w-full mt-3 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Tour überspringen
          </button>
        </div>
      </div>
    </div>
  );
}
