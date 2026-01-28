'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  Crown,
  Rocket,
  CheckCircle,
  Gift
} from 'lucide-react';
import { PlanId } from '@/lib/billing';

interface UpgradeGateProps {
  feature: string;
  requiredPlan: PlanId;
  currentPlan: PlanId;
  shop: string;
  children: ReactNode;
  // Customization
  title?: string;
  description?: string;
  benefits?: string[];
  showPreview?: boolean; // Show blurred preview of content
}

const PLAN_DISPLAY: Record<PlanId, {
  name: string;
  price: string;
  color: string;
  icon: typeof Zap;
  gradient: string;
  bg: string;
  ring: string;
}> = {
  free: {
    name: 'Free',
    price: '0',
    color: 'slate',
    icon: Gift,
    gradient: 'from-slate-500 to-gray-500',
    bg: 'bg-slate-500',
    ring: 'ring-slate-500',
  },
  starter: {
    name: 'Starter',
    price: '29',
    color: 'blue',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500',
    ring: 'ring-blue-500',
  },
  pro: {
    name: 'Pro',
    price: '79',
    color: 'indigo',
    icon: Rocket,
    gradient: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-500',
    ring: 'ring-indigo-500',
  },
  agency: {
    name: 'Agency',
    price: '249',
    color: 'purple',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500',
    ring: 'ring-purple-500',
  },
};

const FEATURE_CONFIG: Record<string, {
  title: string;
  description: string;
  benefits: string[];
  icon: typeof Sparkles;
  stat?: { value: string; label: string };
}> = {
  images: {
    title: 'Bildoptimierung freischalten',
    description: 'Finde alle Bild-Probleme in deinem Theme und bekomme konkrete Fixes für bessere Ladezeiten.',
    benefits: [
      'Alle Bild-Issues auf einen Blick',
      'Copy-Paste Code-Fixes',
      'Schritt-für-Schritt Anleitungen',
      'Einsparpotenzial in KB/MB',
    ],
    icon: Sparkles,
  },
  accessibility: {
    title: 'Accessibility-Analyse freischalten',
    description: 'Mach deinen Shop barrierefrei und verbessere gleichzeitig dein SEO-Ranking.',
    benefits: [
      'WCAG 2.1 Compliance Check',
      'Konkrete Verbesserungsvorschläge',
      'SEO-Boost durch Accessibility',
      'Barrierefreie Navigation',
    ],
    icon: TrendingUp,
  },
  benchmarks: {
    title: 'Competitor Benchmarking freischalten',
    description: 'Vergleiche deinen Shop mit der Konkurrenz und finde heraus, wo du besser sein kannst.',
    benefits: [
      'Vergleich mit Competitors',
      'Performance-Rankings',
      'Branchenspezifische Insights',
      'Konkrete Handlungsempfehlungen',
    ],
    icon: TrendingUp,
  },
  sectionDetails: {
    title: 'Section-Details freischalten',
    description: 'Analysiere jede Section deines Themes im Detail und finde versteckte Performance-Killer.',
    benefits: [
      'Detaillierte Section-Analyse',
      'Performance pro Section',
      'Code-Level Einblicke',
      'Priorisierte Empfehlungen',
    ],
    icon: Zap,
  },
  codeFixes: {
    title: 'Code-Fixes freischalten',
    description: 'Bekomme konkrete, copy-paste-fertige Code-Fixes für alle Performance-Probleme.',
    benefits: [
      'Copy-Paste Code-Snippets',
      'Für dein Theme optimiert',
      'Schritt-für-Schritt Anleitungen',
      'Getestet & funktioniert',
    ],
    icon: Rocket,
  },
  pdfReport: {
    title: 'PDF Reports freischalten',
    description: 'Erstelle professionelle PDF-Reports für dich oder deine Kunden.',
    benefits: [
      'Professionelles Design',
      'Alle Metriken auf einen Blick',
      'Perfekt für Kunden',
      'White-Label Option (Pro)',
    ],
    icon: Sparkles,
  },
  // Pro Features (Starter → Pro)
  scoreSimulator: {
    title: 'Score-Simulator freischalten',
    description: 'Simuliere wie sich dein Score verbessert wenn du bestimmte Fixes umsetzt.',
    benefits: [
      'Vorher/Nachher Prognose',
      'Priorisiere die richtigen Fixes',
      'Impact pro Fix sehen',
      'Zeitersparnis durch Fokus',
    ],
    icon: TrendingUp,
  },
  pdfWhiteLabel: {
    title: 'White-Label Reports freischalten',
    description: 'Erstelle Reports ohne ThemeMetrics Branding - perfekt für Agenturen und Freelancer.',
    benefits: [
      'Kein ThemeMetrics Logo',
      'Professioneller für Kunden',
      'Als eigener Service verkaufen',
      'Eigenes Branding möglich',
    ],
    icon: Sparkles,
  },
  desktopPerformance: {
    title: 'Desktop-Analyse freischalten',
    description: 'Analysiere nicht nur Mobile, sondern auch die Desktop-Performance deines Shops.',
    benefits: [
      'Desktop Core Web Vitals',
      'Vollständiges Performance-Bild',
      'Mobile + Desktop Vergleich',
      'Separate Optimierungen',
    ],
    icon: Zap,
  },
  // Agency Features (Pro → Agency)
  apiAccess: {
    title: 'API-Zugang freischalten',
    description: 'Integriere ThemeMetrics in deine eigenen Tools und Workflows.',
    benefits: [
      'REST API Zugang',
      'Automatisierte Analysen',
      'Custom Integrationen',
      'Webhooks für Updates',
    ],
    icon: Rocket,
  },
  batchAnalysis: {
    title: 'Batch-Analyse freischalten',
    description: 'Analysiere mehrere Shops oder Themes gleichzeitig - perfekt für Agenturen.',
    benefits: [
      'Mehrere Shops gleichzeitig',
      'Bulk-Export der Ergebnisse',
      'Vergleichsreports',
      'Zeitersparnis für Agenturen',
    ],
    icon: Zap,
  },
  clientDashboard: {
    title: 'Client Dashboard freischalten',
    description: 'Gib deinen Kunden Zugang zu einem eigenen Dashboard mit ihren Reports.',
    benefits: [
      'Separates Client Portal',
      'Automatische Report-Zustellung',
      'Kunden-Login',
      'Professioneller Service',
    ],
    icon: Crown,
  },
  teamMembers: {
    title: 'Team-Zugang freischalten',
    description: 'Lade dein Team ein und arbeitet gemeinsam an Shop-Optimierungen.',
    benefits: [
      'Bis zu 5 Team-Mitglieder',
      'Gemeinsamer Zugang',
      'Team-Collaboration',
      'Zentrale Verwaltung',
    ],
    icon: Crown,
    stat: { value: '5', label: 'Team-Mitglieder' },
  },
  workspaces: {
    title: 'Multi-Shop Workspaces freischalten',
    description: 'Verwalte bis zu 10 verschiedene Shops in einem Account.',
    benefits: [
      '10 separate Workspaces',
      'Übersicht aller Shops',
      'Zentrale Verwaltung',
      'Perfekt für Agenturen',
    ],
    icon: Crown,
    stat: { value: '10', label: 'Shops' },
  },
  unlimitedHistory: {
    title: 'Unbegrenzte Historie freischalten',
    description: 'Behalte alle historischen Daten für immer - verfolge Trends über Jahre.',
    benefits: [
      'Unbegrenzte Datenspeicherung',
      'Langzeit-Trends erkennen',
      'Saisonale Patterns',
      'Historische Vergleiche',
    ],
    icon: TrendingUp,
  },
  // Combined Agency feature for Agency page
  agency: {
    title: 'Agency Dashboard freischalten',
    description: 'Das komplette Agentur-Paket: Verwalte mehrere Shops, Teams und Kunden in einem Dashboard.',
    benefits: [
      '10 Shop-Workspaces verwalten',
      '5 Team-Mitglieder einladen',
      'Client Dashboards für Kunden',
      'Batch-Analyse & API-Zugang',
    ],
    icon: Crown,
  },
};

export function UpgradeGate({
  feature,
  requiredPlan,
  currentPlan,
  shop,
  children,
  title,
  description,
  benefits,
  showPreview = true,
}: UpgradeGateProps) {
  // Check if user has access
  const planOrder: PlanId[] = ['free', 'starter', 'pro', 'agency'];
  const currentPlanIndex = planOrder.indexOf(currentPlan);
  const requiredPlanIndex = planOrder.indexOf(requiredPlan);

  const hasAccess = currentPlanIndex >= requiredPlanIndex;

  // If user has access, just render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Get config for this feature
  const config = FEATURE_CONFIG[feature] || {
    title: title || 'Feature freischalten',
    description: description || 'Upgrade für Zugriff auf dieses Feature.',
    benefits: benefits || ['Alle Features verfügbar'],
    icon: Sparkles,
  };

  const planInfo = PLAN_DISPLAY[requiredPlan] || PLAN_DISPLAY.starter;
  const PlanIcon = planInfo.icon;
  const FeatureIcon = config.icon;

  return (
    <div className="relative">
      {/* Blurred Preview */}
      {showPreview && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="blur-sm opacity-30 pointer-events-none select-none">
            {children}
          </div>
        </div>
      )}

      {/* Upgrade CTA Overlay */}
      <div className={`relative z-10 ${showPreview ? 'min-h-[500px]' : ''} flex items-center justify-center p-4`}>
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-card border-2 border-border rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${planInfo.gradient} p-6 text-white text-center`}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FeatureIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
              <p className="text-white/90 text-sm">{config.description}</p>
            </div>

            {/* Stat Highlight */}
            {config.stat && (
              <div className="bg-secondary/50 px-6 py-4 text-center border-b border-border">
                <span className={`text-3xl font-bold bg-gradient-to-r ${planInfo.gradient} bg-clip-text text-transparent`}>
                  {config.stat.value}
                </span>
                <span className="text-muted-foreground ml-2">{config.stat.label}</span>
              </div>
            )}

            {/* Benefits */}
            <div className="p-6 space-y-3">
              {config.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${planInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Pricing & CTA */}
            <div className="p-6 pt-0 space-y-4">
              {/* Price Display */}
              <div className="text-center py-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-muted-foreground text-sm">Ab nur</span>
                  <span className="text-4xl font-bold text-foreground">€{planInfo.price}</span>
                  <span className="text-muted-foreground">/Monat</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">7 Tage kostenlos testen • Jederzeit kündbar</p>
              </div>

              {/* CTA Button */}
              <Link
                href={`/dashboard/pricing?shop=${shop}`}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r ${planInfo.gradient} text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200`}
              >
                <Gift className="w-5 h-5" />
                7 Tage gratis testen
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Trust Elements */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Sichere Zahlung
                </span>
                <span>•</span>
                <span>Jederzeit kündbar</span>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className={`bg-gradient-to-r ${planInfo.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1`}>
              <Sparkles className="w-3 h-3" />
              {planInfo.name} Feature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use
export function UpgradeInline({
  feature,
  requiredPlan,
  shop,
  message,
}: {
  feature: string;
  requiredPlan: PlanId;
  shop: string;
  message?: string;
}) {
  const planInfo = PLAN_DISPLAY[requiredPlan] || PLAN_DISPLAY.starter;

  return (
    <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${planInfo.gradient}/10 border border-${planInfo.color}-500/30 rounded-xl`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${planInfo.bg} rounded-lg flex items-center justify-center`}>
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {message || `${planInfo.name} Feature`}
          </p>
          <p className="text-sm text-muted-foreground">
            Ab €{planInfo.price}/Monat • 7 Tage kostenlos
          </p>
        </div>
      </div>
      <Link
        href={`/dashboard/pricing?shop=${shop}`}
        className={`px-4 py-2 ${planInfo.bg} hover:opacity-90 text-white rounded-lg font-medium text-sm transition-opacity flex items-center gap-1`}
      >
        Upgraden
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// Hook for checking access
export function useFeatureAccess(currentPlan: PlanId, requiredPlan: PlanId): boolean {
  const planOrder: PlanId[] = ['free', 'starter', 'pro', 'agency'];
  return planOrder.indexOf(currentPlan) >= planOrder.indexOf(requiredPlan);
}
