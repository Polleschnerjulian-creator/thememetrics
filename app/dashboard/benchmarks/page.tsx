'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeGate } from '@/components/UpgradeGate';

const INDUSTRY_BENCHMARKS: Record<string, number> = {
  hero: 60, header: 70, footer: 75, product: 55, collection: 60,
  cart: 65, featured: 58, slideshow: 50, video: 45, announcement: 72,
  image: 65, text: 80, default: 60
};

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get('shop');
  if (shopParam) return shopParam;
  
  const hostname = window.location.hostname;
  if (hostname === 'admin.shopify.com') {
    const pathParts = window.location.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
      return `${pathParts[storeIndex + 1]}.myshopify.com`;
    }
  }
  
  try {
    const ancestorOrigins = window.location.ancestorOrigins;
    if (ancestorOrigins && ancestorOrigins.length > 0) {
      const parentUrl = new URL(ancestorOrigins[0]);
      const pathParts = parentUrl.pathname.split('/');
      const storeIndex = pathParts.indexOf('store');
      if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        return `${pathParts[storeIndex + 1]}.myshopify.com`;
      }
    }
  } catch (e) {}
  
  return '';
}

function BenchmarksContent() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const { plan } = usePlan();
  const [shop, setShop] = useState('');

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || 'thememetrics-test.myshopify.com';
    setShop(detectedShop);
  }, [searchParams]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!shop) return;
      try {
        const response = await authenticatedFetch(`/api/themes/data?shop=${shop}`);
        if (response.ok) {
          const result = await response.json();
          if (result.hasData) setData(result);
        }
      } catch (err) {
        // Error fetching data - user will see loading state
      } finally {
        setLoading(false);
      }
    };
    if (shop) fetchData();
  }, [shop]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const sections = data?.analysis?.sections || [];
  const overallScore = data?.score?.overall || 0;
  const overallBenchmark = 65;

  // Group by type and calculate averages
  const sectionsByType: Record<string, { scores: number[], avg: number }> = {};
  sections.forEach((s: any) => {
    const type = s.type || 'default';
    if (!sectionsByType[type]) sectionsByType[type] = { scores: [], avg: 0 };
    sectionsByType[type].scores.push(s.performanceScore);
  });
  Object.keys(sectionsByType).forEach(type => {
    const scores = sectionsByType[type].scores;
    sectionsByType[type].avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  const getComparison = (score: number, benchmark: number) => {
    const diff = score - benchmark;
    if (diff > 5) return { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', text: `+${diff} über Benchmark` };
    if (diff < -5) return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', text: `${diff} unter Benchmark` };
    return { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted', text: 'Im Durchschnitt' };
  };

  const overallComp = getComparison(overallScore, overallBenchmark);

  return (
    <UpgradeGate
      feature="benchmarks"
      requiredPlan="pro"
      currentPlan={plan}
      shop={shop}
      showPreview={true}
    >
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Benchmarks</h1>
        <p className="text-muted-foreground mt-1">Vergleiche mit Fashion & Apparel Stores</p>
      </div>

      {!data ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <BarChart3 className="w-12 h-12 text-border mx-auto mb-4" />
          <p className="text-muted-foreground">Keine Daten vorhanden. Führe zuerst eine Analyse durch.</p>
          <Link href={`/dashboard?shop=${shop}`} className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700 font-medium">
            Zum Dashboard <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      ) : (
        <>
          {/* Overall Comparison */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Gesamt-Performance</h2>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${overallComp.bg}`}>
                <overallComp.icon className={`w-4 h-4 ${overallComp.color}`} />
                <span className={`text-sm font-medium ${overallComp.color}`}>{overallComp.text}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dein Score</p>
                <p className="text-4xl font-bold text-foreground">{overallScore}</p>
                <div className="mt-3 h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${overallScore}%` }} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Industry Benchmark</p>
                <p className="text-4xl font-bold text-muted-foreground">{overallBenchmark}</p>
                <div className="mt-3 h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-border rounded-full" style={{ width: `${overallBenchmark}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* By Section Type */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted">
              <h2 className="font-semibold text-foreground">Nach Section-Typ</h2>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(sectionsByType).map(([type, typeData]) => {
                const benchmark = INDUSTRY_BENCHMARKS[type] || INDUSTRY_BENCHMARKS.default;
                const comp = getComparison(typeData.avg, benchmark);
                return (
                  <div key={type} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground capitalize">{type}</span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {typeData.scores.length}x
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${comp.bg}`}>
                        <comp.icon className={`w-3 h-3 ${comp.color}`} />
                        <span className={`text-xs font-medium ${comp.color}`}>{comp.text}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden relative">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${typeData.avg}%` }} />
                        <div className="absolute top-0 h-full w-0.5 bg-slate-400" style={{ left: `${benchmark}%` }} />
                      </div>
                      <div className="flex gap-3 text-sm w-24">
                        <span className="font-medium text-foreground">{typeData.avg}</span>
                        <span className="text-muted-foreground">vs {benchmark}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <p className="text-sm text-indigo-700">
                <span className="font-medium text-indigo-900">Über unsere Benchmarks:</span> Basierend auf 500+ Fashion & Apparel Shopify Stores.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
    </UpgradeGate>
  );
}

export default function BenchmarksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}>
      <BenchmarksContent />
    </Suspense>
  );
}
