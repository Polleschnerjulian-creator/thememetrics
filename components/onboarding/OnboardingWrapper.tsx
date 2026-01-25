'use client';

import { useEffect } from 'react';
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
    setResults 
  } = useOnboarding();

  // Simulate analysis progress when analyzing
  useEffect(() => {
    if (!isAnalyzing || currentStep !== 'analyzing') return;

    const steps = [
      { step: 'theme', delay: 500 },
      { step: 'sections', delay: 1500 },
      { step: 'analyze', delay: 2500 },
      { step: 'vitals', delay: 8000 },
      { step: 'score', delay: 12000 },
      { step: 'complete', delay: 14000 },
    ];

    const timers: NodeJS.Timeout[] = [];
    let sectionCount = 0;
    const totalSections = 24; // Estimated

    steps.forEach(({ step, delay }, index) => {
      const timer = setTimeout(() => {
        if (step === 'analyze') {
          // Simulate section-by-section progress
          const sectionTimer = setInterval(() => {
            sectionCount++;
            const percent = Math.round((index / steps.length) * 100) + Math.round((sectionCount / totalSections) * 20);
            updateAnalysisProgress(step, sectionCount, totalSections);
            if (sectionCount >= totalSections) {
              clearInterval(sectionTimer);
            }
          }, 200);
          timers.push(sectionTimer as unknown as NodeJS.Timeout);
        } else {
          const percent = Math.round(((index + 1) / steps.length) * 100);
          updateAnalysisProgress(step, index + 1, steps.length);
        }
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isAnalyzing, currentStep, updateAnalysisProgress]);

  // When analysis completes, set results
  useEffect(() => {
    if (analysisData && currentStep === 'analyzing') {
      // Calculate results from analysis data
      const criticalSections = analysisData.sections
        .filter(s => s.performanceScore < 70)
        .sort((a, b) => a.performanceScore - b.performanceScore)
        .slice(0, 5)
        .map(s => ({
          name: s.name.replace('.liquid', ''),
          score: s.performanceScore,
          monthlyLoss: Math.round((70 - s.performanceScore) * 12), // Rough estimate
        }));

      const totalMonthlyLoss = criticalSections.reduce((sum, s) => sum + s.monthlyLoss, 0);
      
      // Calculate percentile (simplified - in reality would compare to benchmark)
      const percentile = analysisData.score >= 80 ? 75 : 
                         analysisData.score >= 70 ? 55 :
                         analysisData.score >= 60 ? 35 : 20;

      setResults({
        score: analysisData.score,
        criticalSections,
        totalMonthlyLoss,
        percentile,
      });

      // Move to score reveal after a short delay
      setTimeout(() => {
        updateAnalysisProgress('complete', 100, 100);
      }, 500);
    }
  }, [analysisData, currentStep, setResults, updateAnalysisProgress]);

  const handleAnalysisComplete = () => {
    // Results reveal will show automatically via setStep in AnalysisProgress
  };

  if (!isOnboarding) return null;

  const shopName = shop?.replace('.myshopify.com', '') || '';

  return (
    <>
      <WelcomeModal 
        shopName={shopName}
        themeName={themeName}
        onStartAnalysis={onStartAnalysis}
      />
      <AnalysisProgress onComplete={handleAnalysisComplete} />
      <ResultsReveal />
      <GuidedFix />
      <CompletionCelebration />
    </>
  );
}
