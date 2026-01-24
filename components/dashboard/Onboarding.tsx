'use client';

import { useState } from 'react';
import { X, Sparkles, BarChart3, Zap, CheckCircle } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onStartAnalysis: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Willkommen bei ThemeMetrics!',
    description: 'Entdecke, welche Sections deines Themes deine Conversion beeinflussen.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Section-Level Analyse',
    description: 'Wir analysieren jede Section einzeln und geben dir konkrete Empfehlungen.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: 'Schnellere Ladezeiten',
    description: 'Verbessere deinen Score und sieh die Auswirkungen auf deine Conversion.',
    color: 'from-amber-500 to-orange-500',
  },
];

export function OnboardingModal({ onComplete, onStartAnalysis }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      onComplete();
      onStartAnalysis();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${step.color} p-8 text-white relative`}>
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
          <p className="text-white/90">{step.description}</p>
        </div>

        {/* Progress & Actions */}
        <div className="p-6">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-indigo-500 w-6' : 
                  i < currentStep ? 'bg-indigo-300' : 'bg-secondary bg-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl font-medium transition-colors"
            >
              Überspringen
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
            >
              {currentStep === steps.length - 1 ? 'Analyse starten' : 'Weiter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingChecklist({ completedSteps }: { completedSteps: string[] }) {
  const checklistItems = [
    { id: 'analyze', label: 'Erste Analyse durchführen', icon: Sparkles },
    { id: 'review', label: 'Empfehlungen ansehen', icon: BarChart3 },
    { id: 'fix', label: 'Erste Optimierung umsetzen', icon: Zap },
  ];

  const allCompleted = checklistItems.every(item => completedSteps.includes(item.id));

  if (allCompleted) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Erste Schritte
      </h3>
      <div className="space-y-2">
        {checklistItems.map((item) => {
          const isCompleted = completedSteps.includes(item.id);
          return (
            <div 
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCompleted ? 'bg-white/50' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-card border-2 border-border'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <item.icon className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
