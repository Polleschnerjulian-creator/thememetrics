'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PLANS, PlanId } from '@/lib/billing';

interface PlanFeatures {
  themeAnalysisPerMonth: number;
  performanceTestsPerMonth: number;
  mobilePerformance: boolean;
  desktopPerformance: boolean;
  sectionDetails: boolean;
  recommendations: number;
  codeFixes: boolean;
  scoreSimulator: boolean;
  pdfReport: boolean;
  pdfWhiteLabel: boolean;
  pdfCustomLogo: boolean;
  historyDays: number;
  competitorBenchmark: boolean;
  workspaces: number;
  teamMembers: number;
  apiAccess: boolean;
  support: string;
  whiteLabel: boolean;
  batchAnalysis: boolean;
  clientDashboard: boolean;
  onboardingCall: boolean;
}

interface Usage {
  month: string;
  themeAnalyses: {
    used: number;
    limit: number;
    remaining: number;
  };
  performanceTests: {
    used: number;
    limit: number;
    remaining: number;
  };
  pdfReports: {
    used: number;
  };
}

interface PlanContextType {
  plan: PlanId;
  planName: string;
  features: PlanFeatures;
  usage: Usage | null;
  loading: boolean;
  error: string | null;
  
  // Helper functions
  canUseFeature: (feature: keyof PlanFeatures) => boolean;
  canAnalyzeTheme: () => { allowed: boolean; reason?: string };
  canRunPerformanceTest: () => { allowed: boolean; reason?: string };
  canUseDesktop: () => { allowed: boolean; reason?: string };
  canUsePdfReport: () => { allowed: boolean; reason?: string };
  canUseCodeFixes: () => { allowed: boolean; reason?: string };
  canUseScoreSimulator: () => { allowed: boolean; reason?: string };
  canUseSectionDetails: () => { allowed: boolean; reason?: string };
  getUpgradePlan: (feature: keyof PlanFeatures) => PlanId | null;
  refreshUsage: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const DEFAULT_FEATURES: PlanFeatures = PLANS.free.features as PlanFeatures;

export function PlanProvider({ children, shop }: { children: ReactNode; shop: string }) {
  const [plan, setPlan] = useState<PlanId>('free');
  const [planName, setPlanName] = useState('Free');
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FEATURES);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!shop) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription?shop=${shop}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      const data = await response.json();
      setPlan(data.plan);
      setPlanName(data.planName);
      setFeatures(data.features);
      setUsage(data.usage);
      setError(null);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setError('Subscription konnte nicht geladen werden');
      // Default to free plan on error
      setPlan('free');
      setFeatures(DEFAULT_FEATURES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [shop]);

  const canUseFeature = (feature: keyof PlanFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return true;
  };

  const canAnalyzeTheme = () => {
    if (!usage) return { allowed: true };
    
    const { remaining, limit } = usage.themeAnalyses;
    if (limit === -1) return { allowed: true };
    
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `Du hast dein Limit von ${limit} Theme-Analyse${limit === 1 ? '' : 'n'} diesen Monat erreicht.`,
      };
    }
    return { allowed: true };
  };

  const canRunPerformanceTest = () => {
    if (!usage) return { allowed: true };
    
    const { remaining, limit } = usage.performanceTests;
    if (limit === -1) return { allowed: true };
    
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `Du hast dein Limit von ${limit} Performance-Test${limit === 1 ? '' : 's'} diesen Monat erreicht.`,
      };
    }
    return { allowed: true };
  };

  const canUseDesktop = () => {
    if (!features.desktopPerformance) {
      return {
        allowed: false,
        reason: 'Desktop Performance ist ab dem Starter Plan verfügbar.',
      };
    }
    return { allowed: true };
  };

  const canUsePdfReport = () => {
    if (!features.pdfReport) {
      return {
        allowed: false,
        reason: 'PDF Reports sind ab dem Starter Plan verfügbar.',
      };
    }
    return { allowed: true };
  };

  const canUseCodeFixes = () => {
    if (!features.codeFixes) {
      return {
        allowed: false,
        reason: 'Code-Fixes sind ab dem Pro Plan verfügbar.',
      };
    }
    return { allowed: true };
  };

  const canUseScoreSimulator = () => {
    if (!features.scoreSimulator) {
      return {
        allowed: false,
        reason: 'Der Score-Simulator ist ab dem Pro Plan verfügbar.',
      };
    }
    return { allowed: true };
  };

  const canUseSectionDetails = () => {
    if (!features.sectionDetails) {
      return {
        allowed: false,
        reason: 'Detaillierte Section-Analysen sind ab dem Starter Plan verfügbar.',
      };
    }
    return { allowed: true };
  };

  const getUpgradePlan = (feature: keyof PlanFeatures): PlanId | null => {
    // Find the cheapest plan that has this feature
    const planOrder: PlanId[] = ['starter', 'pro', 'agency'];
    
    for (const planId of planOrder) {
      const planFeatures = PLANS[planId].features as PlanFeatures;
      const value = planFeatures[feature];
      
      if (typeof value === 'boolean' && value) return planId;
      if (typeof value === 'number' && value !== 0) return planId;
    }
    
    return null;
  };

  const refreshUsage = async () => {
    await fetchSubscription();
  };

  return (
    <PlanContext.Provider
      value={{
        plan,
        planName,
        features,
        usage,
        loading,
        error,
        canUseFeature,
        canAnalyzeTheme,
        canRunPerformanceTest,
        canUseDesktop,
        canUsePdfReport,
        canUseCodeFixes,
        canUseScoreSimulator,
        canUseSectionDetails,
        getUpgradePlan,
        refreshUsage,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

// Export types
export type { PlanFeatures, Usage, PlanContextType };
