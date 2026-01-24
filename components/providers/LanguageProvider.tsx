'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'de' | 'en';

const translations = {
  de: {
    // Navigation
    dashboard: 'Dashboard',
    themeAnalysis: 'Theme Analysis',
    recommendations: 'Empfehlungen',
    benchmarks: 'Benchmarks',
    settings: 'Einstellungen',
    logout: 'Logout',
    
    // Dashboard
    analyzeTheme: 'Theme analysieren',
    reanalyze: 'Neu analysieren',
    analyzing: 'Analysiere...',
    readyToAnalyze: 'Bereit zur Analyse',
    readyToAnalyzeDesc: 'Klicke auf "Theme analysieren" um herauszufinden, welche Sections deines Themes deine Conversion beeinflussen.',
    analyzeNow: 'Jetzt analysieren',
    overallScore: 'Gesamtscore',
    sections: 'Sections',
    critical: 'Kritisch',
    warnings: 'Warnungen',
    good: 'Gut',
    
    // Scores
    excellent: 'Excellent',
    needsWork: 'Needs Work',
    
    // Actions
    immediateAction: 'Sofortige Handlung erforderlich',
    sectionsAffecting: 'Sections beeinträchtigen deine Conversion',
    showAll: 'Alle anzeigen',
    lowestScores: 'Sections mit niedrigstem Score',
    tips: 'Tipps',
    
    // Report
    downloadReport: 'Report herunterladen',
    generatingPdf: 'Generiere PDF...',
    
    // Benchmarks
    compareWith: 'Branchenvergleich',
    overallPerformance: 'Gesamt-Performance',
    yourScore: 'Dein Score',
    industryBenchmark: 'Industry Benchmark',
    aboveBenchmark: 'über Benchmark',
    belowBenchmark: 'unter Benchmark',
    average: 'Im Durchschnitt',
    bySectionType: 'Nach Section-Typ',
    
    // Settings
    language: 'Sprache',
    theme: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    
    // Common
    loading: 'Lädt...',
    back: 'Zurück',
    backToDashboard: 'Zurück zum Dashboard',
    noData: 'Keine Daten vorhanden',
    runAnalysisFirst: 'Führe zuerst eine Analyse durch.',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    themeAnalysis: 'Theme Analysis',
    recommendations: 'Recommendations',
    benchmarks: 'Benchmarks',
    settings: 'Settings',
    logout: 'Logout',
    
    // Dashboard
    analyzeTheme: 'Analyze Theme',
    reanalyze: 'Re-analyze',
    analyzing: 'Analyzing...',
    readyToAnalyze: 'Ready to Analyze',
    readyToAnalyzeDesc: 'Click "Analyze Theme" to find out which sections of your theme affect your conversion.',
    analyzeNow: 'Analyze Now',
    overallScore: 'Overall Score',
    sections: 'Sections',
    critical: 'Critical',
    warnings: 'Warnings',
    good: 'Good',
    
    // Scores
    excellent: 'Excellent',
    needsWork: 'Needs Work',
    
    // Actions
    immediateAction: 'Immediate Action Required',
    sectionsAffecting: 'sections affecting your conversion',
    showAll: 'Show all',
    lowestScores: 'Lowest Scoring Sections',
    tips: 'Tips',
    
    // Report
    downloadReport: 'Download Report',
    generatingPdf: 'Generating PDF...',
    
    // Benchmarks
    compareWith: 'Industry Comparison',
    overallPerformance: 'Overall Performance',
    yourScore: 'Your Score',
    industryBenchmark: 'Industry Benchmark',
    aboveBenchmark: 'above benchmark',
    belowBenchmark: 'below benchmark',
    average: 'Average',
    bySectionType: 'By Section Type',
    
    // Settings
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Common
    loading: 'Loading...',
    back: 'Back',
    backToDashboard: 'Back to Dashboard',
    noData: 'No data available',
    runAnalysisFirst: 'Run an analysis first.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.de) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');

  useEffect(() => {
    const stored = localStorage.getItem('language') as Language | null;
    if (stored) setLanguage(stored);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations.de): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
