'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, Code2, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';

function ScoreInfoContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Wie berechnet sich der ThemeMetrics Score?</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Unser proprietärer Score kombiniert echte Performance-Daten mit Shopify-spezifischer Code-Analyse.
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-3">Was unterscheidet uns von Google PageSpeed?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-4">
            <h3 className="font-medium text-foreground mb-2">🔍 Google PageSpeed sagt:</h3>
            <p className="text-muted-foreground text-sm">"Deine Seite hat einen Score von 45."</p>
            <p className="text-xs text-muted-foreground mt-2">→ Hilfreich, aber nicht actionable</p>
          </div>
          <div className="bg-card rounded-xl p-4 border-2 border-indigo-200">
            <h3 className="font-medium text-foreground mb-2">🎯 ThemeMetrics sagt:</h3>
            <p className="text-muted-foreground text-sm">"Dein Hero-Video kostet dich 15 Punkte und ~€850/Monat. Hier ist der Fix."</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">→ Spezifisch, messbar, umsetzbar</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Die ThemeMetrics Score Formel</h2>
        <div className="bg-slate-900 rounded-xl p-6 text-center mb-6">
          <code className="text-emerald-400 text-lg">ThemeMetrics Score = (Speed × 40%) + (Quality × 35%) + (Conversion × 25%)</code>
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 dark:bg-blue-500/30 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Speed Score (40%)</h3>
                <p className="text-sm text-muted-foreground">Wie schnell lädt dein Theme?</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">60%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Core Web Vitals (von Google)</p>
                  <p className="text-sm text-muted-foreground">LCP, CLS, TBT, FCP – echte Messdaten aus Google PageSpeed Insights</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">40%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Section Load Impact (von uns)</p>
                  <p className="text-sm text-muted-foreground">Videos, externe Embeds, fehlendes Lazy Loading pro Section</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-purple-500/10 dark:bg-purple-500/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 dark:bg-purple-500/30 rounded-xl flex items-center justify-center">
                <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Quality Score (35%)</h3>
                <p className="text-sm text-muted-foreground">Wie gut ist dein Code?</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 dark:bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">50%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Liquid Code Quality</p>
                  <p className="text-sm text-muted-foreground">Verschachtelte Loops, Komplexität, Assigns, Inline Styles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 dark:bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">30%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Shopify Best Practices</p>
                  <p className="text-sm text-muted-foreground">Responsive Images, Lazy Loading, Preload für kritische Assets</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 dark:bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">20%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Theme Architecture</p>
                  <p className="text-sm text-muted-foreground">Snippet-Nutzung, Translations, Section-Anzahl</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Conversion Score (25%)</h3>
                <p className="text-sm text-muted-foreground">Wie wirkt sich Performance auf deinen Umsatz aus?</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">50%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">E-Commerce Optimization</p>
                  <p className="text-sm text-muted-foreground">Hero, Produkt-Grid, Trust Badges, CTA-Platzierung</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">30%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Mobile Experience</p>
                  <p className="text-sm text-muted-foreground">Touch Targets, Mobile-spezifische Performance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">20%</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Revenue Impact</p>
                  <p className="text-sm text-muted-foreground">7% Conversion-Verlust pro Sekunde über 2s Ladezeit (Industry Benchmark)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Score-Bewertung</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">90-100</div>
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mt-1">Exzellent</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Top Performance</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 dark:bg-green-500/20 rounded-xl">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">70-89</div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Gut</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Solide Basis</p>
          </div>
          <div className="text-center p-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">50-69</div>
            <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-1">Verbesserungswürdig</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Optimierung nötig</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 dark:bg-red-500/20 rounded-xl">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">0-49</div>
            <div className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Kritisch</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Dringend handeln</p>
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-2xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Warum dieser Ansatz?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Verifizierbar</p>
              <p className="text-sm text-muted-foreground">Google PageSpeed Daten als Basis – keine Black-Box-Behauptungen</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Shopify-spezifisch</p>
              <p className="text-sm text-muted-foreground">Liquid Code Analyse – kein generisches Web-Tool kann das</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Business-fokussiert</p>
              <p className="text-sm text-muted-foreground">Revenue Impact in Euro, nicht nur Millisekunden</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Actionable</p>
              <p className="text-sm text-muted-foreground">Konkrete Fixes pro Section, nicht vage Empfehlungen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-6">
        <Link 
          href={`/dashboard?shop=${shop}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function ScoreInfoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <ScoreInfoContent />
    </Suspense>
  );
}
