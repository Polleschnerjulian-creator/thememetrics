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
    
    // Agency
    agencyDashboard: 'Agency Dashboard',
    agencyDescription: 'Verwalte deine Shops und Team-Mitglieder',
    agencyRequired: 'Agency Plan erforderlich',
    agencyUpgradeDesc: 'Verwalte mehrere Shops, Team-Mitglieder und Client-Zugänge mit dem Agency Plan.',
    upgradeToAgency: 'Upgrade auf Agency',
    branding: 'Branding',
    batchAnalyze: 'Batch-Analyse',
    workspaces: 'Workspaces',
    teamMembers: 'Team Members',
    clientAccess: 'Client-Zugang',
    addWorkspace: 'Workspace hinzufügen',
    inviteMember: 'Mitglied einladen',
    newWorkspace: 'Neuer Workspace',
    workspaceName: 'Workspace Name',
    workspaceNamePlaceholder: 'z.B. Kunde A - Fashion Store',
    shopDomain: 'Shop Domain',
    shopDomainHint: 'Der Shop muss ThemeMetrics installiert haben',
    notesOptional: 'Notizen (optional)',
    notesPlaceholder: 'Interne Notizen zum Kunden...',
    cancel: 'Abbrechen',
    create: 'Erstellen',
    creating: 'Erstelle...',
    save: 'Speichern',
    saving: 'Speichere...',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    enable: 'Aktivieren',
    disable: 'Deaktivieren',
    lastAnalyzed: 'Zuletzt analysiert',
    neverAnalyzed: 'Noch nicht analysiert',
    noWorkspaces: 'Noch keine Workspaces',
    noWorkspacesDesc: 'Füge deinen ersten Client-Shop hinzu.',
    noTeamMembers: 'Noch keine Team-Mitglieder',
    noTeamMembersDesc: 'Lade Kollegen ein, um zusammenzuarbeiten.',
    brandingSettings: 'Branding Einstellungen',
    agencyName: 'Agency Name',
    logoForPdf: 'Logo für PDF Reports',
    uploadLogo: 'Logo hochladen',
    logoHint: 'PNG, JPG oder SVG, max. 500KB',
    logoTooLarge: 'Logo darf maximal 500KB groß sein',
    primaryColor: 'Primärfarbe',
    tryAgain: 'Erneut versuchen',
    networkError: 'Netzwerkfehler',
    errorLoading: 'Fehler beim Laden',
    confirmDelete: 'wirklich löschen?',
    pending: 'Ausstehend',
    active: 'Aktiv',
    owner: 'Owner',
    admin: 'Admin',
    member: 'Mitglied',
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
    
    // Agency
    agencyDashboard: 'Agency Dashboard',
    agencyDescription: 'Manage your shops and team members',
    agencyRequired: 'Agency Plan Required',
    agencyUpgradeDesc: 'Manage multiple shops, team members, and client access with the Agency Plan.',
    upgradeToAgency: 'Upgrade to Agency',
    branding: 'Branding',
    batchAnalyze: 'Batch Analysis',
    workspaces: 'Workspaces',
    teamMembers: 'Team Members',
    clientAccess: 'Client Access',
    addWorkspace: 'Add Workspace',
    inviteMember: 'Invite Member',
    newWorkspace: 'New Workspace',
    workspaceName: 'Workspace Name',
    workspaceNamePlaceholder: 'e.g. Client A - Fashion Store',
    shopDomain: 'Shop Domain',
    shopDomainHint: 'The shop must have ThemeMetrics installed',
    notesOptional: 'Notes (optional)',
    notesPlaceholder: 'Internal notes about the client...',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    edit: 'Edit',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    enabled: 'Enabled',
    disabled: 'Disabled',
    enable: 'Enable',
    disable: 'Disable',
    lastAnalyzed: 'Last analyzed',
    neverAnalyzed: 'Not analyzed yet',
    noWorkspaces: 'No workspaces yet',
    noWorkspacesDesc: 'Add your first client shop.',
    noTeamMembers: 'No team members yet',
    noTeamMembersDesc: 'Invite colleagues to collaborate.',
    brandingSettings: 'Branding Settings',
    agencyName: 'Agency Name',
    logoForPdf: 'Logo for PDF Reports',
    uploadLogo: 'Upload Logo',
    logoHint: 'PNG, JPG or SVG, max. 500KB',
    logoTooLarge: 'Logo must be 500KB or smaller',
    primaryColor: 'Primary Color',
    tryAgain: 'Try again',
    networkError: 'Network error',
    errorLoading: 'Error loading',
    confirmDelete: 'really delete?',
    pending: 'Pending',
    active: 'Active',
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
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
