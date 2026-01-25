'use client';

import { useEffect, useRef } from 'react';
import { 
  useOnboarding,
  WelcomeModal, 
  AnalysisProgress, 
  ResultsReveal, 
  GuidedFix, 
  CompletionCelebration 
} from '@/components/onboarding';

interface OnboardingWrapperProps {
  shop: string;
  themeName: string;
  onStartAnalysis: () => void;
  analysisData?: {
    score: number;
    sections: Array<{
      name: string;
      performanceScore: number;
      performanceImpact?: number;
    }>;
  } | null;
  isAnalyzing: boolean;
}

function calculateResults(analysisData: OnboardingWrapperProps['analysisData']) {
  if (!analysisData) return null;
  
  const criticalSections = analysisData.sections
    .filter(s => s.performanceScore < 85)
    .sort((a, b) => a.performanceScore - b.performanceScore)
    .slice(0, 5)
    .map(s => ({
      name: s.name.replace('.liquid', ''),
      score: s.performanceScore,
      monthlyLoss: Math.max(50, Math.round((85 - s.performanceScore) * 8)),
    }));

  const sectionsToShow = criticalSections.length > 0 ? criticalSections : [
    { name: 'Allgemeine Optimierung', score: analysisData.score, monthlyLoss: 127 }
  ];

  const totalMonthlyLoss = sectionsToShow.reduce((sum, s) => sum + s.monthlyLoss, 0);
  
  const percentile = analysisData.score >= 80 ? 75 : 
                     analysisData.score >= 70 ? 55 :
                     analysisData.score >= 60 ? 35 : 20;

  return {
    score: analysisData.score,
    criticalSections: sectionsToShow,
    totalMonthlyLoss,
    percentile,
  };
}

export function OnboardingWrapper({ 
  shop, 
  themeName, 
  onStartAnalysis, 
  analysisData,
  isAnalyzing 
}: OnboardingWrapperProps) {
  const { 
    currentStep, 
    isOnboarding, 
    setStep, 
    updateAnalysisProgress, 
    setResults,
    results 
  } = useOnboarding();
  
  const hasSetInitialResults = useRef(false);
  const analysisStarted = useRef(false);

  // Set results once when analysis data exists and we're onboarding
  useEffect(() => {
    if (analysisData && isOnboarding && !hasSetInitialResults.current) {
      hasSetInitialResults.current = true;
      const calculatedResults = calculateResults(analysisData);
      if (calculatedResults) {
        setResults(calculatedResults);
      }
    }
  }, [analysisData, isOnboarding, setResults]);

  // Handle analysis progress simulation
  useEffect(() => {
    if (!isAnalyzing || currentStep !== 'analyzing' || analysisStarted.current) return;
    
    analysisStarted.current = true;

    const progressSteps = [
      { step: 'theme', delay: 500 },
      { step: 'sections', delay: 1500 },
      { step: 'analyze', delay: 2500 },
      { step: 'vitals', delay: 8000 },
      { step: 'score', delay: 12000 },
    ];

    progressSteps.forEach(({ step, delay }, index) => {
      setTimeout(() => {
        updateAnalysisProgress(step, index + 1, progressSteps.length);
      }, delay);
    });
  }, [isAnalyzing, currentStep, updateAnalysisProgress]);

  // When analysis finishes, move to score reveal
  useEffect(() => {
    if (analysisData && currentStep === 'analyzing' && !isAnalyzing) {
      const calculatedResults = calculateResults(analysisData);
      if (calculatedResults) {
        setResults(calculatedResults);
      }
      setTimeout(() => {
        setStep('score-reveal');
      }, 500);
    }
  }, [analysisData, currentStep, isAnalyzing, setResults, setStep]);

  if (!isOnboarding) return null;

  const shopName = shop?.replace('.myshopify.com', '') || '';

  return (
    <>
      <WelcomeModal 
        shopName={shopName}
        themeName={themeName}
        onStartAnalysis={onStartAnalysis}
      />
      <AnalysisProgress onComplete={() => {}} />
      <ResultsReveal />
      <GuidedFix />
      <CompletionCelebration />
    </>
  );
}
