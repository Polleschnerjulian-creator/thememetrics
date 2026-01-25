'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, Copy, Clock, TrendingUp, Sparkles, Code, ExternalLink } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface FixStep {
  title: string;
  description: string;
  code?: string;
  tip?: string;
}

interface QuickFix {
  id: string;
  title: string;
  section: string;
  timeEstimate: string;
  impact: number;
  monthlyGain: number;
  steps: FixStep[];
}

// Generate a quick fix based on the most impactful section
function generateQuickFix(section: { name: string; score: number; monthlyLoss: number }): QuickFix {
  const sectionName = section.name.replace('.liquid', '');
  
  // Default lazy loading fix - most common quick win
  return {
    id: `fix-${sectionName}`,
    title: 'Lazy Loading aktivieren',
    section: section.name,
    timeEstimate: '5 Min',
    impact: 8,
    monthlyGain: Math.round(section.monthlyLoss * 0.3), // Estimate 30% recovery
    steps: [
      {
        title: 'Section-Datei öffnen',
        description: `Öffne die Datei sections/${section.name} in deinem Theme-Editor`,
        tip: 'Online Editor: Theme → Actions → Edit Code'
      },
      {
        title: 'Bilder finden',
        description: 'Suche nach allen <img> Tags oder {{ image | image_url }} Aufrufen',
        code: `<!-- Suche nach Zeilen wie: -->
{{ section.settings.image | image_url: width: 800 | image_tag }}

<!-- Oder: -->
<img src="{{ image | image_url }}" alt="...">`,
      },
      {
        title: 'Lazy Loading hinzufügen',
        description: 'Füge loading: "lazy" zu allen Bildern hinzu, die nicht sofort sichtbar sind',
        code: `<!-- Vorher: -->
{{ section.settings.image | image_url: width: 800 | image_tag }}

<!-- Nachher: -->
{{ section.settings.image | image_url: width: 800 | image_tag: loading: 'lazy', decoding: 'async' }}`,
        tip: 'Hero-Bilder ganz oben sollten NICHT lazy sein – die sollen sofort laden!'
      },
    ],
  };
}

export function GuidedFix() {
  const { currentStep, setStep, results, markFixComplete } = useOnboarding();
  const [currentFixStep, setCurrentFixStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentStep === 'first-fix') {
      setIsVisible(true);
      setCurrentFixStep(0);
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  if (!isVisible || !results || results.criticalSections.length === 0) return null;

  const mostCritical = results.criticalSections[0];
  const fix = generateQuickFix(mostCritical);
  const step = fix.steps[currentFixStep];
  const isLastStep = currentFixStep === fix.steps.length - 1;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (isLastStep) {
      markFixComplete(fix.id);
      setStep('completion');
    } else {
      setCurrentFixStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFixStep > 0) {
      setCurrentFixStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80 text-sm">Dein erster Quick-Win</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {fix.timeEstimate}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +{fix.impact} Punkte
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1">{fix.title}</h2>
          <p className="text-white/80">
            für <span className="font-medium text-white">{fix.section}</span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
            <Sparkles className="w-4 h-4" />
            Geschätzte Ersparnis: ~€{fix.monthlyGain}/Monat
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">
              Schritt {currentFixStep + 1} von {fix.steps.length}
            </span>
          </div>
          <div className="flex gap-1">
            {fix.steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentFixStep ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-muted-foreground mb-4">{step.description}</p>

          {/* Code Block */}
          {step.code && (
            <div className="bg-slate-900 rounded-xl overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Liquid</span>
                </div>
                <button
                  onClick={() => handleCopy(step.code!)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
                <code>{step.code}</code>
              </pre>
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">💡 Tipp:</span> {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex-shrink-0">
          <div className="flex gap-3">
            {currentFixStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  Als erledigt markieren
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setStep('done')}
            className="w-full mt-3 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Überspringen – später machen
          </button>
        </div>
      </div>
    </div>
  );
}
