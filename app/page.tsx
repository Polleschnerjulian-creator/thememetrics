'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Check, 
  X,
  Zap, 
  Sparkles,
  ChevronDown,
  Gift,
  Rocket,
  Building2,
  Star,
  Image as ImageIcon,
  Accessibility,
  FileText,
  ListChecks,
  LineChart,
  Layers,
  CheckCircle2,
  Mail,
  Gauge,
  AlertTriangle,
  TrendingDown,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface SpeedReport {
  score: number;
  grade: string;
  lcp: number;
  fcp: number;
  cls: number;
  tbt: number;
  topIssues: string[];
  opportunities: { title: string; savings: string }[];
  estimatedMonthlyLoss: number;
}

function SpeedCheckModal({ 
  isOpen, 
  onClose, 
  report 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  report: SpeedReport | null;
}) {
  if (!isOpen || !report) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'from-emerald-500 to-green-500';
    if (grade === 'B') return 'from-green-500 to-lime-500';
    if (grade === 'C') return 'from-amber-500 to-yellow-500';
    if (grade === 'D') return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Dein Speed Report</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Score */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getGradeColor(report.grade)} mb-4`}>
              <div className="w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center">
                <div>
                  <span className={`text-5xl font-bold ${getScoreColor(report.score)}`}>{report.score}</span>
                  <span className="text-slate-500 text-lg">/100</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400">
              Note: <span className={`font-bold text-2xl ${getScoreColor(report.score)}`}>{report.grade}</span>
            </p>
          </div>

          {/* Estimated Loss */}
          {report.estimatedMonthlyLoss > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-semibold">Geschätzter Umsatzverlust</p>
                  <p className="text-2xl font-bold text-white">~€{report.estimatedMonthlyLoss.toLocaleString('de-DE')}/Monat</p>
                  <p className="text-sm text-slate-400 mt-1">Basierend auf Branchendurchschnitten</p>
                </div>
              </div>
            </div>
          )}

          {/* Core Web Vitals */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">LCP</p>
              <p className={`text-lg font-bold ${report.lcp < 2500 ? 'text-emerald-400' : report.lcp < 4000 ? 'text-amber-400' : 'text-red-400'}`}>
                {(report.lcp / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">FCP</p>
              <p className={`text-lg font-bold ${report.fcp < 1800 ? 'text-emerald-400' : report.fcp < 3000 ? 'text-amber-400' : 'text-red-400'}`}>
                {(report.fcp / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">CLS</p>
              <p className={`text-lg font-bold ${report.cls < 0.1 ? 'text-emerald-400' : report.cls < 0.25 ? 'text-amber-400' : 'text-red-400'}`}>
                {report.cls}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">TBT</p>
              <p className={`text-lg font-bold ${report.tbt < 300 ? 'text-emerald-400' : report.tbt < 600 ? 'text-amber-400' : 'text-red-400'}`}>
                {report.tbt}ms
              </p>
            </div>
          </div>

          {/* Top Issues */}
          {report.topIssues.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Gefundene Probleme
              </h3>
              <ul className="space-y-2">
                {report.topIssues.map((issue, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400 text-center">
              Mit ThemeMetrics findest du <strong className="text-white">genau welche Theme-Sections</strong> diese Probleme verursachen.
            </p>
            <a
              href="/api/auth/install"
              className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-center transition-colors"
            >
              Vollständige Analyse starten →
            </a>
            <p className="text-xs text-slate-500 text-center">
              ✓ Kostenlos • ✓ Keine Kreditkarte nötig
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPageContent() {
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Speed Check State
  const [speedCheckEmail, setSpeedCheckEmail] = useState('');
  const [speedCheckUrl, setSpeedCheckUrl] = useState('');
  const [speedCheckLoading, setSpeedCheckLoading] = useState(false);
  const [speedCheckError, setSpeedCheckError] = useState('');
  const [speedReport, setSpeedReport] = useState<SpeedReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [speedCheckSuccess, setSpeedCheckSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const shopParam = searchParams.get('shop');
    const hostParam = searchParams.get('host');
    
    if (shopParam && hostParam) {
      router.push(`/dashboard?shop=${shopParam}&host=${hostParam}`);
    } else {
      setIsCheckingAuth(false);
    }
  }, [searchParams, router]);

  const handleInstall = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shop.trim()) {
      setError('Bitte gib deine Shop-Domain ein');
      return;
    }

    setIsLoading(true);
    let shopDomain = shop.trim().toLowerCase();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = shopDomain.replace('.myshopify.com', '');
    }
    window.location.href = `/api/auth/install?shop=${encodeURIComponent(shopDomain)}`;
  };

  const handleSpeedCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpeedCheckError('');
    
    if (!speedCheckEmail.trim() || !speedCheckEmail.includes('@')) {
      setSpeedCheckError('Bitte gib eine gültige E-Mail ein');
      return;
    }
    
    if (!speedCheckUrl.trim()) {
      setSpeedCheckError('Bitte gib deine Shop-URL ein');
      return;
    }

    setSpeedCheckLoading(true);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: speedCheckEmail,
          shopUrl: speedCheckUrl,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.analysisAvailable && data.report) {
          // Full analysis available
          setSpeedReport(data.report);
          setShowModal(true);
        }
        // Always mark as success - lead is saved
        setSpeedCheckSuccess(true);
        
        // If no analysis, show the tip message
        if (!data.analysisAvailable) {
          setSpeedCheckError('');
        }
      } else {
        setSpeedCheckError(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setSpeedCheckError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setSpeedCheckLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Lädt...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Layers, title: 'Section-Level Analyse', description: 'Sieh genau welche Sections deines Themes langsam sind und deine Conversion killen.', color: 'indigo' },
    { icon: ImageIcon, title: 'Bildoptimierung', description: 'Finde unoptimierte Bilder, fehlende Lazy-Loading und falsche Formate automatisch.', color: 'emerald' },
    { icon: Accessibility, title: 'Accessibility Check', description: 'Prüfe WCAG-Konformität: Kontraste, Alt-Texte, ARIA-Labels und mehr.', color: 'purple' },
    { icon: FileText, title: 'PDF Reports', description: 'Generiere professionelle Reports für dich oder deine Kunden mit einem Klick.', color: 'blue' },
    { icon: ListChecks, title: 'Step-by-Step Guides', description: 'Jedes Problem kommt mit einer detaillierten Anleitung zum Beheben - kein Dev nötig.', color: 'amber' },
    { icon: LineChart, title: 'Performance Tracking', description: 'Verfolge deinen Score über Zeit und sieh wie deine Optimierungen wirken.', color: 'pink' },
  ];

  const stats = [
    { value: '60%', label: 'schnellere Ladezeit', desc: 'durchschnittlich nach Optimierung' },
    { value: '7%', label: 'mehr Conversion', desc: 'pro Sekunde schnellerer Ladezeit' },
    { value: '< 5min', label: 'zur ersten Analyse', desc: 'kein Setup nötig' },
  ];

  const plans = [
    { id: 'free', name: 'Free', price: 0, description: 'Perfekt zum Testen', icon: Gift, color: 'slate',
      features: [
        { text: '1 Theme-Analyse/Monat', included: true },
        { text: 'Section Performance Score', included: true },
        { text: 'Top 3 Empfehlungen', included: true },
        { text: 'Accessibility Check', included: false },
        { text: 'PDF Reports', included: false },
      ], cta: 'Kostenlos starten', popular: false },
    { id: 'starter', name: 'Starter', price: 29, description: 'Für Solo-Merchants', icon: Zap, color: 'blue',
      features: [
        { text: '5 Theme-Analysen/Monat', included: true },
        { text: 'Bildoptimierung', included: true },
        { text: 'Accessibility Check', included: true },
        { text: 'PDF Reports', included: true },
        { text: '30 Tage Historie', included: true },
      ], cta: 'Starter wählen', popular: false },
    { id: 'pro', name: 'Pro', price: 79, description: 'Für wachsende Shops', icon: Rocket, color: 'indigo',
      features: [
        { text: 'Unbegrenzte Analysen', included: true },
        { text: 'Konkrete Code-Fixes', included: true },
        { text: 'Step-by-Step Guides', included: true },
        { text: 'White-Label Reports', included: true },
        { text: 'Competitor Benchmarking', included: true },
      ], cta: 'Pro wählen', popular: true },
    { id: 'agency', name: 'Agency', price: 249, description: 'Für Agenturen & Teams', icon: Building2, color: 'purple',
      features: [
        { text: 'Alles aus Pro', included: true },
        { text: '10 Workspaces', included: true },
        { text: 'API Zugang', included: true },
        { text: 'Team Collaboration', included: true },
        { text: 'Dedicated Support', included: true },
      ], cta: 'Agency wählen', popular: false },
  ];

  const faqs = [
    { question: 'Was genau analysiert ThemeMetrics?', answer: 'ThemeMetrics analysiert jede einzelne Section deines Shopify Themes, prüft alle Bilder auf Optimierungspotenzial, testet Accessibility (WCAG) und gibt dir konkrete Empfehlungen mit Step-by-Step Anleitungen.' },
    { question: 'Brauche ich technisches Wissen?', answer: 'Nein! ThemeMetrics ist für Merchants gemacht. Jede Empfehlung kommt mit einer detaillierten Schritt-für-Schritt Anleitung die du direkt im Theme Editor umsetzen kannst.' },
    { question: 'Was ist der Unterschied zu PageSpeed Insights?', answer: 'PageSpeed Insights zeigt dir nur einen Gesamt-Score. ThemeMetrics zeigt dir WELCHE Sections das Problem sind und WIE du sie fixst. Außerdem analysieren wir Accessibility und Bilder im Detail.' },
    { question: 'Wie schnell sehe ich Ergebnisse?', answer: 'Die erste Analyse dauert weniger als 5 Minuten. Du siehst sofort deinen Score, alle Probleme und konkrete Empfehlungen zum Beheben.' },
    { question: 'Kann ich jederzeit kündigen?', answer: 'Ja, du kannst jederzeit kündigen. Keine versteckten Gebühren, keine Kündigungsfrist. Die Abrechnung läuft sicher über Shopify.' },
    { question: 'Funktioniert es mit jedem Shopify Theme?', answer: 'Ja! ThemeMetrics funktioniert mit allen Shopify Themes – egal ob kostenlos, Premium oder Custom-entwickelt.' },
  ];

  const testimonials = [
    { quote: "Endlich verstehe ich warum mein Shop langsam ist. Die Step-by-Step Guides sind Gold wert!", author: "Sarah M.", role: "Shopify Store Owner" },
    { quote: "Wir nutzen ThemeMetrics für all unsere Kunden-Audits. Die PDF Reports sparen uns Stunden.", author: "Max K.", role: "Shopify Agentur" },
    { quote: "Nach den Bildoptimierungen ist mein Shop 2 Sekunden schneller. Conversion ist direkt gestiegen!", author: "Julia S.", role: "Beauty Store Owner" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Speed Check Modal */}
      <SpeedCheckModal isOpen={showModal} onClose={() => setShowModal(false)} report={speedReport} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size={40} showText={true} className="text-white" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#speed-check" className="text-sm text-slate-400 hover:text-white transition-colors">Speed Check</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
          </nav>
          <button onClick={() => document.getElementById('speed-check')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden md:block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
            Kostenloser Speed Check
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Das All-in-One Tool für Shopify Theme Performance
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Finde heraus welche<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Sections dich Umsatz kosten
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            ThemeMetrics analysiert Performance, Bilder & Accessibility deines Shopify Themes 
            auf Section-Level und zeigt dir <strong className="text-white">genau was du fixen musst</strong> – mit Step-by-Step Anleitungen.
          </p>

          <div className="flex items-center justify-center gap-8 mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-400">Section-Level Analyse</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-400">Konkrete Code-Fixes</span>
              </div>
            </div>
          </div>
          
          {/* Quick CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => document.getElementById('speed-check')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Gauge className="w-5 h-5" />
              Kostenloser Speed Check
            </button>
            <button 
              onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              App installieren
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* SPEED CHECK SECTION - Main Lead Magnet */}
      <section id="speed-check" className="py-20 px-6 bg-gradient-to-b from-indigo-950/50 to-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gauge className="w-4 h-4" />
              Kostenlos • Keine Anmeldung nötig
            </div>
            <h2 className="text-4xl font-bold mb-4">Wie schnell ist dein Shop wirklich?</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Gib deine Shop-URL ein und erhalte in 30 Sekunden deinen Performance Score + 
              geschätzten Umsatzverlust durch langsame Ladezeiten.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8">
            {speedCheckSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                {speedReport ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">Dein Report ist fertig!</h3>
                    <p className="text-slate-400 mb-6">Score: <span className={`font-bold text-2xl ${speedReport.score >= 70 ? 'text-emerald-400' : speedReport.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{speedReport.score}/100</span></p>
                    <button 
                      onClick={() => setShowModal(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium"
                    >
                      Vollständigen Report anzeigen
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">Du bist auf der Liste! ✉️</h3>
                    <p className="text-slate-400 mb-4">
                      Wir konnten deinen Shop gerade nicht automatisch analysieren. Das passiert manchmal bei neuen oder passwortgeschützten Shops.
                    </p>
                    <p className="text-slate-300 mb-6">
                      <strong>Kein Problem:</strong> Wir haben deine E-Mail gespeichert und senden dir bald Performance-Tipps!
                    </p>
                    <a
                      href="#hero-form"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium inline-block"
                    >
                      Für vollständige Analyse → App installieren
                    </a>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSpeedCheck} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Deine Shop-URL</label>
                    <input
                      type="text"
                      placeholder="dein-shop.myshopify.com"
                      value={speedCheckUrl}
                      onChange={(e) => setSpeedCheckUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Deine E-Mail</label>
                    <input
                      type="email"
                      placeholder="du@beispiel.de"
                      value={speedCheckEmail}
                      onChange={(e) => setSpeedCheckEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500"
                    />
                  </div>
                </div>
                
                {speedCheckError && (
                  <p className="text-red-400 text-sm">{speedCheckError}</p>
                )}
                
                <button
                  type="submit"
                  disabled={speedCheckLoading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {speedCheckLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analysiere... (ca. 30 Sekunden)
                    </>
                  ) : (
                    <>
                      <Gauge className="w-5 h-5" />
                      Jetzt Speed Check starten
                    </>
                  )}
                </button>
                
                <p className="text-xs text-slate-500 text-center">
                  Mit dem Absenden stimmst du zu, gelegentlich Performance-Tipps per E-Mail zu erhalten. 
                  Du kannst dich jederzeit abmelden.
                </p>
              </form>
            )}
          </div>

          {/* What you get */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Gauge className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-1">Performance Score</h3>
              <p className="text-sm text-slate-400">0-100 Score basierend auf Core Web Vitals</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-semibold mb-1">Umsatzverlust</h3>
              <p className="text-sm text-slate-400">Geschätzter monatlicher Verlust durch Ladezeit</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-1">Top Probleme</h3>
              <p className="text-sm text-slate-400">Die wichtigsten Issues auf einen Blick</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-slate-800">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-sm text-slate-500">{stat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Alles was du brauchst</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Von Performance-Analyse bis Accessibility-Check – ThemeMetrics gibt dir alle Tools um deinen Shop zu optimieren.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const colorClasses: Record<string, string> = {
                indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
              };
              return (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color]} border flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Section Analysis */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Layers className="w-4 h-4" /> Section-Level Analyse
              </div>
              <h3 className="text-3xl font-bold mb-4">Sieh genau welche Section das Problem ist</h3>
              <p className="text-slate-400 mb-6">Andere Tools zeigen dir nur einen Gesamt-Score. ThemeMetrics analysiert JEDE Section einzeln - Hero, Product Grid, Footer - und zeigt dir genau wo die Performance-Killer stecken.</p>
              <ul className="space-y-3">
                {['Performance Score pro Section', 'Geschätzte Ladezeit', 'Code-Komplexität', 'Konkrete Empfehlungen'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-slate-300">{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="space-y-4">
                {[{ name: 'Hero Section', score: 45, status: 'critical' }, { name: 'Product Grid', score: 72, status: 'warning' }, { name: 'Footer', score: 89, status: 'good' }].map((section, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                    <div><p className="font-medium">{section.name}</p><p className="text-sm text-slate-500">~{Math.round(500 - section.score * 4)}ms Ladezeit</p></div>
                    <div className={`text-2xl font-bold ${section.status === 'critical' ? 'text-red-400' : section.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{section.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Image Optimization */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Bild-Score</span><span className="text-2xl font-bold text-amber-400">62/100</span></div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full w-[62%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" /></div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-3 text-sm"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Kritisch</span><span className="text-slate-300">12 Bilder ohne Lazy Loading</span></div>
                  <div className="flex items-center gap-3 text-sm"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Warnung</span><span className="text-slate-300">8 Bilder ohne srcset</span></div>
                  <div className="flex items-center gap-3 text-sm"><span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Info</span><span className="text-slate-300">Einsparpotenzial: ~2.4 MB</span></div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <ImageIcon className="w-4 h-4" /> Bildoptimierung
              </div>
              <h3 className="text-3xl font-bold mb-4">Finde jedes unoptimierte Bild</h3>
              <p className="text-slate-400 mb-6">Bilder machen 60-80% deiner Seitengröße aus. ThemeMetrics findet fehlende Lazy-Loading, falsche Formate und überdimensionierte Bilder automatisch.</p>
              <ul className="space-y-3">
                {['Lazy Loading Check', 'Srcset & Responsive Images', 'WebP/AVIF Empfehlungen', 'Shopify image_url Best Practices'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-slate-300">{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Accessibility */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Accessibility className="w-4 h-4" /> Accessibility Check
              </div>
              <h3 className="text-3xl font-bold mb-4">Mach deinen Shop für alle zugänglich</h3>
              <p className="text-slate-400 mb-6">15% aller Menschen haben eine Behinderung. Ein barrierefreier Shop bedeutet mehr Kunden UND besseres SEO. ThemeMetrics prüft WCAG-Konformität automatisch.</p>
              <ul className="space-y-3">
                {['Farbkontrast-Prüfung', 'Alt-Text Analyse', 'ARIA Labels Check', 'Keyboard Navigation'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-400" /><span className="text-slate-300">{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6"><span className="font-medium">Accessibility Score</span><span className="text-3xl font-bold text-purple-400">78/100</span></div>
              <div className="space-y-4">
                {[{ label: 'Kontraste', value: 85, color: 'emerald' }, { label: 'Alt-Texte', value: 60, color: 'amber' }, { label: 'ARIA Labels', value: 90, color: 'emerald' }, { label: 'Formulare', value: 75, color: 'amber' }].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">{item.label}</span><span className={item.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}>{item.value}%</span></div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${item.value}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">So einfach geht's</h2>
            <p className="text-slate-400 text-lg">In 3 Schritten zu besserer Theme-Performance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ step: '1', title: 'App installieren', desc: 'Ein Klick Installation. Keine Konfiguration nötig, kein Code.' },
              { step: '2', title: 'Theme analysieren', desc: 'ThemeMetrics scannt automatisch Sections, Bilder & Accessibility.' },
              { step: '3', title: 'Step-by-Step fixen', desc: 'Folge den Anleitungen im Theme Editor und sieh deinen Score steigen.' }].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-4xl font-bold mb-4">Was unsere Nutzer sagen</h2></div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                <p className="text-slate-300 mb-4">"{t.quote}"</p>
                <div><p className="font-medium">{t.author}</p><p className="text-sm text-slate-500">{t.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Install CTA */}
      <section id="hero-form" className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">App installieren</h2>
            <p className="text-slate-400 mb-6">Für die vollständige Section-Level Analyse installiere die Shopify App.</p>
            <form onSubmit={handleInstall} className="space-y-4">
              <div className="relative">
                <input type="text" placeholder="dein-shop" value={shop} onChange={(e) => setShop(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">.myshopify.com</span>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>App installieren <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
            <p className="text-slate-500 text-sm mt-4">✓ Kostenlos starten • ✓ Keine Kreditkarte</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Einfaches, transparentes Pricing</h2>
            <p className="text-slate-400 text-lg">Starte kostenlos. Upgrade wenn du mehr brauchst.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className={`relative bg-slate-900 rounded-2xl border-2 p-6 ${plan.popular ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-800'}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1"><Star className="w-3 h-3" />Beliebt</span></div>}
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${plan.color === 'slate' ? 'bg-slate-800' : plan.color === 'blue' ? 'bg-blue-500/10' : plan.color === 'indigo' ? 'bg-indigo-500/10' : 'bg-purple-500/10'}`}>
                      <Icon className={`w-6 h-6 ${plan.color === 'slate' ? 'text-slate-400' : plan.color === 'blue' ? 'text-blue-400' : plan.color === 'indigo' ? 'text-indigo-400' : 'text-purple-400'}`} />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{plan.price === 0 ? 'Gratis' : `€${plan.price}`}</span>
                    {plan.price > 0 && <span className="text-slate-500">/Monat</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <X className="w-5 h-5 text-slate-600 flex-shrink-0" />}
                        <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${plan.popular ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-4xl font-bold mb-4">Häufige Fragen</h2></div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors">
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-4 text-slate-400">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-xl mx-auto text-center">
          <Mail className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Shopify Performance Tipps</h2>
          <p className="text-slate-400 mb-6">Wöchentliche Tipps für schnellere Ladezeiten und mehr Conversion. Kein Spam.</p>
          <form className="flex gap-3" onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
            if (emailInput.value) {
              await fetch(`/api/leads?email=${encodeURIComponent(emailInput.value)}&source=newsletter`);
              emailInput.value = '';
              alert('Erfolgreich angemeldet!');
            }
          }}>
            <input type="email" placeholder="deine@email.de" className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500" />
            <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium">
              Anmelden
            </button>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Bereit deinen Shop zu optimieren?</h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">Starte mit dem kostenlosen Speed Check oder installiere die App für die vollständige Analyse.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => document.getElementById('speed-check')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
                <Gauge className="w-5 h-5" /> Kostenloser Speed Check
              </button>
              <button onClick={() => document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-semibold transition-colors inline-flex items-center gap-2">
                App installieren <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size={40} showText={true} className="text-white" />
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="mailto:cs@thememetrics.de" className="hover:text-white transition-colors">Support</a>
              <a href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
              <a href="/agb" className="hover:text-white transition-colors">AGB</a>
              <a href="/widerruf" className="hover:text-white transition-colors">Widerruf</a>
              <a href="/impressum" className="hover:text-white transition-colors">Impressum</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © 2026 ThemeMetrics – Julian Polleschner. Made with ❤️ in Berlin für Shopify Merchants.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
