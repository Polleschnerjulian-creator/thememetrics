'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type OnboardingStep = 
  | 'welcome'
  | 'analyzing'
  | 'score-reveal'
  | 'problems-reveal'
  | 'money-impact'
  | 'first-fix'
  | 'completion'
  | 'done';

interface OnboardingState {
  currentStep: OnboardingStep;
  isOnboarding: boolean;
  shopName: string;
  themeName: string;
  analysisProgress: {
    step: string;
    current: number;
    total: number;
    percent: number;
  };
  results: {
    score: number;
    criticalSections: Array<{
      name: string;
      score: number;
      monthlyLoss: number;
    }>;
    totalMonthlyLoss: number;
    percentile: number;
    dataSource?: 'shopify' | 'estimated';
  } | null;
  completedFixes: string[];
}

interface OnboardingContextType extends OnboardingState {
  startOnboarding: (shopName: string, themeName: string) => void;
  setStep: (step: OnboardingStep) => void;
  updateAnalysisProgress: (step: string, current: number, total: number) => void;
  setResults: (results: OnboardingState['results']) => void;
  markFixComplete: (fixId: string) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'done',
    isOnboarding: false,
    shopName: '',
    themeName: '',
    analysisProgress: {
      step: '',
      current: 0,
      total: 0,
      percent: 0,
    },
    results: null,
    completedFixes: [],
  });

  // Check if user has completed onboarding before
  useEffect(() => {
    const completed = localStorage.getItem('tm_onboarding_completed');
    const savedFixes = localStorage.getItem('tm_completed_fixes');
    const savedStep = localStorage.getItem('tm_onboarding_step') as OnboardingStep | null;
    
    if (savedFixes) {
      setState(prev => ({ ...prev, completedFixes: JSON.parse(savedFixes) }));
    }
    
    if (!completed) {
      // Restore saved step or start from welcome
      const stepToUse = savedStep || 'welcome';
      setState(prev => ({ ...prev, currentStep: stepToUse, isOnboarding: true }));
    }
  }, []);

  const startOnboarding = (shopName: string, themeName: string) => {
    setState(prev => ({
      ...prev,
      isOnboarding: true,
      currentStep: 'welcome',
      shopName,
      themeName,
    }));
  };

  const setStep = (step: OnboardingStep) => {
    setState(prev => {
      // Prevent setting to the same step (avoid loops)
      if (prev.currentStep === step) return prev;
      return { ...prev, currentStep: step };
    });
    
    // Persist step to localStorage so it survives re-renders
    if (step !== 'done') {
      localStorage.setItem('tm_onboarding_step', step);
    }
    
    if (step === 'done') {
      localStorage.setItem('tm_onboarding_completed', 'true');
      localStorage.removeItem('tm_onboarding_step');
      setState(prev => ({ ...prev, isOnboarding: false }));
    }
  };

  const updateAnalysisProgress = (step: string, current: number, total: number) => {
    setState(prev => ({
      ...prev,
      analysisProgress: {
        step,
        current,
        total,
        percent: Math.round((current / total) * 100),
      },
    }));
  };

  const setResults = (results: OnboardingState['results']) => {
    setState(prev => ({ ...prev, results }));
  };

  const markFixComplete = (fixId: string) => {
    setState(prev => {
      const newFixes = [...prev.completedFixes, fixId];
      localStorage.setItem('tm_completed_fixes', JSON.stringify(newFixes));
      return { ...prev, completedFixes: newFixes };
    });
  };

  const skipOnboarding = () => {
    localStorage.setItem('tm_onboarding_completed', 'true');
    setState(prev => ({ ...prev, currentStep: 'done', isOnboarding: false }));
  };

  const resetOnboarding = () => {
    localStorage.removeItem('tm_onboarding_completed');
    localStorage.removeItem('tm_completed_fixes');
    setState({
      currentStep: 'welcome',
      isOnboarding: true,
      shopName: '',
      themeName: '',
      analysisProgress: { step: '', current: 0, total: 0, percent: 0 },
      results: null,
      completedFixes: [],
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        startOnboarding,
        setStep,
        updateAnalysisProgress,
        setResults,
        markFixComplete,
        skipOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
