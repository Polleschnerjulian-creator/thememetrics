'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface SectionImpact {
  name: string;
  currentScore: number;
  potentialScore: number;
  monthlyImpact: number;
  issue: string;
}

interface RevenueImpactData {
  currentScore: number;
  currentLoadTime: number;
  currentConversionRate: number;
  projectedScore: number;
  projectedLoadTime: number;
  projectedConversionRate: number;
  monthlyRevenue: number;
  monthlySessions: number;
  averageOrderValue: number;
  monthlyRevenueLoss: number;
  potentialMonthlyGain: number;
  potentialYearlyGain: number;
  conversionRateIncrease: number;
  sectionImpacts: SectionImpact[];
  dataSource: 'shopify' | 'estimated';
}

interface RevenueCalculatorProps {
  shop: string;
}

export function RevenueCalculator({ shop }: RevenueCalculatorProps) {
  const [data, setData] = useState<RevenueImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/revenue?shop=${shop}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          const err = await response.json();
          setError(err.message || 'Daten konnten nicht geladen werden');
        }
      } catch (err) {
        setError('Verbindungsfehler');
      } finally {
        setLoading(false);
      }
    };

    if (shop) {
      fetchData();
    }
  }, [shop]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-secondary bg-200 rounded" />
          <div className="h-24 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Don't show anything if no analysis yet
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-border border-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border border-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Revenue Impact Calculator</h3>
            <p className="text-sm text-muted-foreground">
              {data.dataSource === 'shopify' ? 'Basierend auf deinen Shop-Daten' : 'Geschätzt basierend auf Branchendaten'}
            </p>
          </div>
        </div>
        {data.dataSource === 'estimated' && (
          <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
            <Info className="w-3 h-3" />
            Schätzung
          </div>
        )}
      </div>

      {/* Main Impact Display */}
      <div className="p-6">
        {/* Loss Highlight */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-red-300 text-sm">Aktueller monatlicher Verlust durch langsames Theme</p>
              <p className="text-3xl font-bold text-red-400">
                ~{formatCurrency(data.monthlyRevenueLoss)}
              </p>
            </div>
          </div>
        </div>

        {/* Potential Gain */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-300 text-sm">Potentieller Mehrwert nach Optimierung</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-emerald-400">
                  +{formatCurrency(data.potentialMonthlyGain)}/Monat
                </p>
                <p className="text-emerald-500 text-lg">
                  = {formatCurrency(data.potentialYearlyGain)}/Jahr
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <ShoppingCart className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{formatCurrency(data.monthlyRevenue)}</p>
            <p className="text-xs text-slate-400">Umsatz/Monat</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{formatNumber(data.monthlySessions)}</p>
            <p className="text-xs text-slate-400">Sessions/Monat</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{data.currentConversionRate}%</p>
            <p className="text-xs text-slate-400">Conversion Rate</p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Current */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-sm font-medium text-slate-300">Aktuell</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Score</span>
                <span className="text-white font-medium">{data.currentScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Ladezeit</span>
                <span className="text-white font-medium">~{data.currentLoadTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Conv. Rate</span>
                <span className="text-white font-medium">{data.currentConversionRate}%</span>
              </div>
            </div>
          </div>

          {/* After Optimization */}
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-sm font-medium text-emerald-300">Nach Optimierung</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-300/70 text-sm">Score</span>
                <span className="text-emerald-300 font-medium">{data.projectedScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70 text-sm">Ladezeit</span>
                <span className="text-emerald-300 font-medium">~{data.projectedLoadTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300/70 text-sm">Conv. Rate</span>
                <span className="text-emerald-300 font-medium">{data.projectedConversionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Breakdown Toggle */}
        {data.sectionImpacts.length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
            >
              <span className="text-sm font-medium text-slate-300">
                Impact pro Section ({data.sectionImpacts.length})
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2">
                {data.sectionImpacts.map((section, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          section.currentScore < 50 ? 'bg-red-400' :
                          section.currentScore < 70 ? 'bg-amber-400' :
                          'bg-emerald-400'
                        }`} />
                        <span className="text-sm font-medium text-white truncate">
                          {section.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {section.currentScore} → {section.potentialScore}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {section.issue}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-emerald-400">
                        +{formatCurrency(section.monthlyImpact)}
                      </p>
                      <p className="text-xs text-slate-400">/Monat</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/dashboard/recommendations?shop=${shop}`}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Optimierungen starten
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mt-4">
          Schätzung basierend auf Branchendaten (7% Conversion-Verlust pro Sekunde Ladezeit).
          Tatsächliche Ergebnisse können variieren.
        </p>
      </div>
    </div>
  );
}

// Compact version for dashboard cards
export function RevenueImpactCard({ shop }: { shop: string }) {
  const [data, setData] = useState<RevenueImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/revenue?shop=${shop}`);
        if (response.ok) {
          setData(await response.json());
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    if (shop) fetchData();
  }, [shop]);

  if (loading || !data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Link 
      href={`/dashboard/recommendations?shop=${shop}`}
      className="block bg-gradient-to-br from-red-50 to-amber-50 border border-red-200 rounded-xl p-4 hover:border-red-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-red-700">Geschätzter monatlicher Verlust</p>
          <p className="text-xl font-bold text-red-600">
            ~{formatCurrency(data.monthlyRevenueLoss)}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-red-400 ml-auto" />
      </div>
    </Link>
  );
}
