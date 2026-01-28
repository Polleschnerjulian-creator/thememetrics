'use client';

import { useState } from 'react';
import { X, Lock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { PLANS, PlanId } from '@/lib/billing';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  reason: string;
  recommendedPlan: PlanId;
  shop: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  feature, 
  reason, 
  recommendedPlan,
  shop 
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const plan = PLANS[recommendedPlan];
  
  const benefits = {
    starter: [
      '5 Theme-Analysen/Monat',
      '10 Performance-Tests/Monat',
      'Mobile + Desktop Performance',
      'Vollständige Section-Analyse',
      'Alle Empfehlungen',
      'PDF Reports',
      '30 Tage Historie',
    ],
    pro: [
      'Unbegrenzte Theme-Analysen',
      'Unbegrenzte Performance-Tests',
      'Konkrete Code-Fixes',
      'Score-Simulator',
      'White-Label PDF Reports',
      'Competitor Benchmarking',
      '90 Tage Historie',
    ],
    agency: [
      'Alles von Pro',
      '10 Workspaces (Shops)',
      '5 Team Members',
      'Custom Logo in Reports',
      'API Zugang',
      'Batch-Analyse',
      'Client Dashboard',
    ],
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: recommendedPlan, shop }),
      });

      const data = await response.json();
      
      if (data.confirmationUrl) {
        // Redirect to Shopify billing confirmation
        if (window.top) {
          window.top.location.href = data.confirmationUrl;
        } else {
          window.location.href = data.confirmationUrl;
        }
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{feature}</h2>
          <p className="text-white/90">{reason}</p>
        </div>

        <div className="p-6">
          {/* Recommended Plan */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-5 mb-6 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-lg text-foreground">{plan.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">Empfohlen für dich</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-muted-foreground">/Monat</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              {(benefits[recommendedPlan as keyof typeof benefits] || []).slice(0, 5).map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Info */}
          {plan.trialDays > 0 && (
            <p className="text-center text-sm text-muted-foreground mb-4">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {plan.trialDays} Tage kostenlos testen
              </span>
              {' '}– jederzeit kündbar
            </p>
          )}

          {/* CTAs */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Wird geladen...'
            ) : (
              <>
                Jetzt upgraden
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}

// Simpler inline upgrade banner for less intrusive prompts
export function UpgradeBanner({ 
  feature, 
  plan,
  className = '' 
}: { 
  feature: string; 
  plan: PlanId;
  className?: string;
}) {
  const planInfo = PLANS[plan];
  
  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-foreground">{feature}</p>
            <p className="text-sm text-muted-foreground">
              Verfügbar ab {planInfo.name} (€{planInfo.price}/Mo)
            </p>
          </div>
        </div>
        <a 
          href="/dashboard/pricing"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Upgraden
        </a>
      </div>
    </div>
  );
}

// Feature lock overlay for sections
export function FeatureLock({ 
  children,
  feature,
  reason,
  plan,
  shop,
}: { 
  children: React.ReactNode;
  feature: string;
  reason: string;
  plan: PlanId;
  shop: string;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none blur-[2px]">
        {children}
      </div>
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-border max-w-sm">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">{feature}</h3>
          <p className="text-sm text-muted-foreground mb-4">{reason}</p>
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            Feature freischalten
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        reason={reason}
        recommendedPlan={plan}
        shop={shop}
      />
    </div>
  );
}
