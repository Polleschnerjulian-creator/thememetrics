'use client';

import { useState, useEffect } from 'react';
import { useShop } from '@/hooks/useShop';
import { 
  Check, 
  X, 
  Zap, 
  Building2, 
  Rocket,
  Gift,
  Crown
} from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '€0',
    period: 'für immer',
    description: 'Perfekt zum Testen',
    icon: Gift,
    color: 'slate',
    features: [
      { text: '1 Theme-Analyse/Monat', included: true },
      { text: '1 Performance-Test/Monat', included: true },
      { text: 'Mobile Performance', included: true },
      { text: 'Gesamt-Score', included: true },
      { text: 'Top 3 Empfehlungen', included: true },
      { text: 'Desktop Performance', included: false },
      { text: 'Section-Details', included: false },
      { text: 'PDF Reports', included: false },
      { text: 'Code-Fixes', included: false },
    ],
    cta: 'Aktueller Plan',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceLabel: '€29',
    period: '/Monat',
    description: 'Für Solo-Merchants',
    icon: Zap,
    color: 'blue',
    features: [
      { text: '5 Theme-Analysen/Monat', included: true },
      { text: '10 Performance-Tests/Monat', included: true },
      { text: 'Mobile + Desktop Performance', included: true },
      { text: 'Vollständige Section-Analyse', included: true },
      { text: 'Alle Empfehlungen', included: true },
      { text: 'PDF Report', included: true },
      { text: '30 Tage Historie', included: true },
      { text: 'E-Mail Support', included: true },
      { text: 'Code-Fixes', included: false },
      { text: 'Score-Simulator', included: false },
    ],
    cta: 'Upgrade zu Starter',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceLabel: '€79',
    period: '/Monat',
    description: 'Für wachsende Shops',
    icon: Rocket,
    color: 'indigo',
    features: [
      { text: 'Unbegrenzte Theme-Analysen', included: true },
      { text: 'Unbegrenzte Performance-Tests', included: true },
      { text: 'Mobile + Desktop Performance', included: true },
      { text: 'Konkrete Code-Fixes', included: true },
      { text: 'Score-Simulator', included: true },
      { text: 'White-Label PDF Reports', included: true },
      { text: 'Competitor Benchmarking', included: true },
      { text: '90 Tage Historie', included: true },
      { text: 'Priority Support', included: true },
    ],
    cta: 'Upgrade zu Pro',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 249,
    priceLabel: '€249',
    period: '/Monat',
    description: 'Für Agenturen & Teams',
    icon: Building2,
    color: 'purple',
    features: [
      { text: 'Alles von Pro', included: true },
      { text: '10 Workspaces (Shops)', included: true },
      { text: '5 Team Members', included: true },
      { text: 'Custom Logo in Reports', included: true },
      { text: 'API Zugang', included: true },
      { text: 'Unbegrenzte Historie', included: true },
      { text: 'Batch-Analyse', included: true },
      { text: 'Client Dashboard', included: true },
      { text: 'Dedicated Support', included: true },
      { text: 'Onboarding Call', included: true },
    ],
    cta: 'Upgrade zu Agency',
    popular: false,
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [usage, setUsage] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const { shop, isLoading: shopLoading } = useShop();

  // Load current plan and usage from API
  useEffect(() => {
    async function loadSubscription() {
      if (!shop) return;
      
      try {
        const response = await fetch(`/api/subscription?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.plan || 'free');
          setUsage(data.usage);
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setLoadingPlan(false);
      }
    }
    
    if (shop) {
      loadSubscription();
    }
  }, [shop]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;
    
    if (!shop) {
      alert('Shop nicht gefunden. Bitte lade die Seite neu.');
      return;
    }
    
    setLoading(planId);
    
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: planId, 
          shop,
          returnUrl: window.location.href 
        }),
      });

      const data = await response.json();
      console.log('Billing response:', data);
      
      if (data.error) {
        alert(`Fehler: ${data.error}`);
        return;
      }
      
      if (data.confirmationUrl) {
        // Redirect to Shopify payment confirmation
        // For embedded apps, use top-level redirect
        if (window.top !== window.self) {
          window.top!.location.href = data.confirmationUrl;
        } else {
          window.location.href = data.confirmationUrl;
        }
      } else if (data.success && data.plan === 'free') {
        alert('Du bist jetzt auf dem Free Plan!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(null);
    }
  };

  const getButtonStyle = (planId: string, color: string) => {
    if (planId === currentPlan) {
      return 'bg-secondary text-muted-foreground cursor-not-allowed';
    }
    
    const colors: Record<string, string> = {
      slate: 'bg-slate-600 hover:bg-slate-700 text-white',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    };
    
    return colors[color] || colors.indigo;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Wähle deinen Plan</h1>
        <p className="text-muted-foreground mt-2">
          Starte kostenlos und upgrade wenn du mehr brauchst
        </p>
      </div>

      {/* Current Usage Display */}
      {usage && (
        <div className="bg-muted rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-foreground mb-4">Deine aktuelle Nutzung ({usage.month})</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm text-muted-foreground">Theme-Analysen</div>
              <div className="text-2xl font-bold text-foreground">
                {usage.themeAnalyses.used}
                <span className="text-sm font-normal text-muted-foreground">
                  /{usage.themeAnalyses.limit === -1 ? '∞' : usage.themeAnalyses.limit}
                </span>
              </div>
              {usage.themeAnalyses.limit !== -1 && (
                <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.themeAnalyses.used / usage.themeAnalyses.limit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm text-muted-foreground">Performance-Tests</div>
              <div className="text-2xl font-bold text-foreground">
                {usage.performanceTests.used}
                <span className="text-sm font-normal text-muted-foreground">
                  /{usage.performanceTests.limit === -1 ? '∞' : usage.performanceTests.limit}
                </span>
              </div>
              {usage.performanceTests.limit !== -1 && (
                <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.performanceTests.used / usage.performanceTests.limit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yearly Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          Monatlich
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            isYearly ? 'bg-indigo-600' : 'bg-border'
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-card rounded-full shadow transition-transform ${
              isYearly ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          Jährlich
          <span className="ml-1 text-xs text-emerald-600 font-medium">-17%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const yearlyPrice = Math.round(plan.price * 10);
          const displayPrice = isYearly && plan.price > 0 ? yearlyPrice : plan.price;
          const displayPeriod = isYearly && plan.price > 0 ? '/Jahr' : plan.period;

          return (
            <div
              key={plan.id}
              className={`relative bg-card rounded-2xl border-2 p-6 flex flex-col ${
                plan.popular 
                  ? 'border-indigo-500 shadow-lg shadow-indigo-100' 
                  : 'border-border'
              } ${currentPlan === plan.id ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Beliebt
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Aktuell
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                  plan.color === 'slate' ? 'bg-secondary' :
                  plan.color === 'blue' ? 'bg-blue-100' :
                  plan.color === 'indigo' ? 'bg-indigo-100' :
                  'bg-purple-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    plan.color === 'slate' ? 'text-muted-foreground' :
                    plan.color === 'blue' ? 'text-blue-600' :
                    plan.color === 'indigo' ? 'text-indigo-600' :
                    'text-purple-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-foreground">
                  {plan.price === 0 ? 'Kostenlos' : `€${displayPrice}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">{displayPeriod}</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-border flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === currentPlan || loading === plan.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${getButtonStyle(plan.id, plan.color)}`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lädt...
                  </span>
                ) : plan.id === currentPlan ? (
                  'Aktueller Plan'
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <div className="bg-muted rounded-2xl p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Fragen zum Pricing?
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Alle Pläne haben eine 7-tägige Testphase. Du kannst jederzeit upgraden, 
          downgraden oder kündigen. Bei jährlicher Zahlung sparst du 17%.
        </p>
      </div>

      {/* Subtle Promo Code Section */}
      <PromoCodeSection shop={shop} onSuccess={() => window.location.reload()} />
    </div>
  );
}

// Separate component for promo code to keep it clean
function PromoCodeSection({ shop, onSuccess }: { shop: string | null; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !shop) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), shop }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.success) {
        setSuccess(data.message);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          Promo-Code einlösen?
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben"
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Einlösen'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-500">{success}</p>}
          <button
            type="button"
            onClick={() => { setIsOpen(false); setCode(''); setError(''); }}
            className="text-xs text-muted-foreground hover:text-muted-foreground"
          >
            Abbrechen
          </button>
        </form>
      )}
    </div>
  );
}
