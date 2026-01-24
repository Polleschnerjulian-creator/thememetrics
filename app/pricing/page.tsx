'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Perfekt für einzelne Shops',
    features: [
      'Bis zu 20 Sections analysieren',
      '10 Analysen pro Monat',
      '30 Tage Historie',
      'E-Mail Support',
      'Basis-Empfehlungen',
    ],
    cta: 'Starter wählen',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'Für wachsende Brands',
    features: [
      'Bis zu 50 Sections analysieren',
      '50 Analysen pro Monat',
      '90 Tage Historie',
      'Priority Support',
      'Industry Benchmarks',
      'PDF Export Reports',
      'Conversion Tracking',
    ],
    cta: 'Pro wählen',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 299,
    description: 'Für Agenturen & Enterprise',
    features: [
      'Unbegrenzte Sections',
      'Unbegrenzte Analysen',
      '365 Tage Historie',
      'Dedicated Support',
      'White-Label Reports',
      'Multi-Store Management',
      'API Zugang',
      'Custom Benchmarks',
    ],
    cta: 'Agency wählen',
    popular: false,
  },
];

function PricingContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!shop) {
      setError('Shop nicht gefunden. Bitte starte von der App.');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (data.confirmationUrl) {
        // Redirect to Shopify billing approval page
        window.location.href = data.confirmationUrl;
      } else {
        setError(data.error || 'Fehler beim Erstellen des Abonnements');
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuche es erneut.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Wähle deinen Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            14 Tage kostenlos testen. Keine Kreditkarte erforderlich.
            Jederzeit kündbar.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
                plan.popular
                  ? 'border-violet-500 scale-105'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    €{plan.price}
                  </span>
                  <span className="text-slate-500">/Monat</span>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Wird geladen...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </button>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? 'text-violet-500' : 'text-green-500'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Trust */}
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Fragen? Schreib uns an{' '}
            <a
              href="mailto:support@thememetrics.app"
              className="text-violet-600 hover:underline"
            >
              support@thememetrics.app
            </a>
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-slate-400">
            <span>🔒 Sichere Zahlung über Shopify</span>
            <span>✓ 14 Tage Testphase</span>
            <span>✓ Jederzeit kündbar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Lädt...</div>}>
      <PricingContent />
    </Suspense>
  );
}
