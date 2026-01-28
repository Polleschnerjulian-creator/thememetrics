'use client';

import { useEffect, useRef, useState } from 'react';
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

interface RevenueData {
  monthlyRevenue: number;
  potentialMonthlyGain: number;
  dataSource: 'shopify' | 'estimated';
  sectionImpacts: Array<{
    name: string;
    currentScore: number;
    monthlyImpact: number;
  }>;
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
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  // Fetch real revenue data from API
  useEffect(() => {
    if (shop && isOnboarding && analysisData) {
      fetch(`/api/revenue?shop=${shop}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setRevenueData({
              monthlyRevenue: data.monthlyRevenue,
              potentialMonthlyGain: data.potentialMonthlyGain,
              dataSource: data.dataSource,
              sectionImpacts: data.sectionImpacts || [],
            });
          }
        })
        .catch(err => {});
    }
  }, [shop, isOnboarding, analysisData]);

  // Set results once when analysis data exists and we're onboarding
  useEffect(() => {
    if (analysisData && isOnboarding && !hasSetInitialResults.current) {
      hasSetInitialResults.current = true;
      
      // Use revenue data if available, otherwise estimate conservatively
      const sectionsToShow = revenueData?.sectionImpacts.length 
        ? revenueData.sectionImpacts.map(s => ({
            name: s.name.replace('.liquid', ''),
            score: s.currentScore,
            monthlyLoss: s.monthlyImpact,
          }))
        : analysisData.sections
            .filter(s => s.performanceScore < 85)
            .sort((a, b) => a.performanceScore - b.performanceScore)
            .slice(0, 5)
            .map(s => ({
              name: s.name.replace('.liquid', ''),
              score: s.performanceScore,
              monthlyLoss: 0, // Will show "Berechnung läuft..."
            }));

      const totalMonthlyLoss = revenueData?.potentialMonthlyGain || 0;
      
      const percentile = analysisData.score >= 80 ? 75 : 
                         analysisData.score >= 70 ? 55 :
                         analysisData.score >= 60 ? 35 : 20;

      setResults({
        score: analysisData.score,
        criticalSections: sectionsToShow.length > 0 ? sectionsToShow : [
          { name: 'Optimierungspotenzial wird berechnet', score: analysisData.score, monthlyLoss: 0 }
        ],
        totalMonthlyLoss,
        percentile,
        dataSource: revenueData?.dataSource || 'estimated',
      });
    }
  }, [analysisData, isOnboarding, setResults, revenueData]);

  // Update results when revenue data arrives
  useEffect(() => {
    if (revenueData && results && isOnboarding) {
      const sectionsToShow = revenueData.sectionImpacts.map(s => ({
        name: s.name.replace('.liquid', ''),
        score: s.currentScore,
        monthlyLoss: s.monthlyImpact,
      }));

      setResults({
        ...results,
        criticalSections: sectionsToShow,
        totalMonthlyLoss: revenueData.potentialMonthlyGain,
        dataSource: revenueData.dataSource,
      });
    }
  }, [revenueData]);

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
      setTimeout(() => {
        setStep('score-reveal');
      }, 500);
    }
  }, [analysisData, currentStep, isAnalyzing, setStep]);

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
