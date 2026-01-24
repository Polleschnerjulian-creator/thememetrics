'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  MessageCircle,
  BookOpen,
  Zap,
  Shield,
  CreditCard,
  BarChart3,
  Settings
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // Allgemein
  {
    category: 'Allgemein',
    question: 'Was ist ThemeMetrics?',
    answer: 'ThemeMetrics ist eine Shopify-App, die dein Theme auf Performance, Accessibility und Code-Qualität analysiert. Wir geben dir einen Score von 0-100 und konkrete Empfehlungen, wie du deinen Shop verbessern kannst.'
  },
  {
    category: 'Allgemein',
    question: 'Wie wird mein ThemeMetrics Score berechnet?',
    answer: 'Der Score setzt sich aus drei Komponenten zusammen: Liquid Code Qualität (40%), Best Practices (30%) und Performance (30%). Jede Komponente wird anhand von über 20 verschiedenen Checks bewertet. Details findest du auf der "Wie wird der Score berechnet?" Seite im Dashboard.'
  },
  {
    category: 'Allgemein',
    question: 'Wird mein Theme durch die Analyse verändert?',
    answer: 'Nein! ThemeMetrics liest nur deinen Theme-Code und analysiert ihn. Wir ändern niemals etwas an deinem Theme. Alle Fixes musst du selbst umsetzen – wir zeigen dir nur, was und wie.'
  },
  {
    category: 'Allgemein',
    question: 'Welche Themes werden unterstützt?',
    answer: 'ThemeMetrics funktioniert mit allen Shopify Online Store 2.0 Themes – egal ob kostenlose Themes wie Dawn oder Premium-Themes. Ältere "Vintage" Themes werden eingeschränkt unterstützt.'
  },
  
  // Features
  {
    category: 'Features',
    question: 'Was prüft der Accessibility Check?',
    answer: 'Der Accessibility Check prüft dein Theme auf WCAG 2.1 Level AA Konformität. Das umfasst: Alt-Texte für Bilder, Formular-Labels, Heading-Struktur, Farbkontraste, Keyboard-Navigation und vieles mehr. Ab Juni 2025 ist Barrierefreiheit in der EU gesetzlich vorgeschrieben (European Accessibility Act).'
  },
  {
    category: 'Features',
    question: 'Was prüft die Bildoptimierung?',
    answer: 'Wir analysieren alle Bilder in deinem Theme auf: WebP-Format, richtige Größen, Lazy Loading, responsive srcset, und korrekte Shopify-Filter (image_url). Du siehst genau wie viele MB und Sekunden Ladezeit du sparen kannst.'
  },
  {
    category: 'Features',
    question: 'Woher kommen die Performance-Daten?',
    answer: 'Wir nutzen die offizielle Google PageSpeed Insights API, um echte Performance-Daten zu messen. Das sind die gleichen Daten, die Google für SEO-Rankings verwendet.'
  },
  {
    category: 'Features',
    question: 'Was bedeuten die Severity-Level (Kritisch, Hoch, Mittel, Niedrig)?',
    answer: 'Kritisch = Muss sofort behoben werden, massiver Impact. Hoch = Sollte zeitnah behoben werden. Mittel = Empfohlen zu beheben. Niedrig = Nice-to-have Optimierung. Fokussiere dich zuerst auf kritische und hohe Probleme.'
  },
  
  // Billing
  {
    category: 'Billing',
    question: 'Wie funktioniert die Abrechnung?',
    answer: 'ThemeMetrics wird über Shopify Billing abgerechnet. Du siehst die Kosten in deiner normalen Shopify-Rechnung. Du kannst jederzeit kündigen – die Kündigung wird zum Ende des Abrechnungszeitraums wirksam.'
  },
  {
    category: 'Billing',
    question: 'Gibt es eine kostenlose Testphase?',
    answer: 'Ja! Du kannst ThemeMetrics 14 Tage kostenlos testen. Danach wählst du einen Plan, der zu deinen Bedürfnissen passt. Keine Kreditkarte für den Test erforderlich.'
  },
  {
    category: 'Billing',
    question: 'Kann ich meinen Plan wechseln?',
    answer: 'Ja, du kannst jederzeit upgraden oder downgraden. Bei einem Upgrade wird der neue Preis anteilig berechnet. Bei einem Downgrade bleibt dein aktueller Plan bis zum Ende des Abrechnungszeitraums aktiv.'
  },
  
  // Technisch
  {
    category: 'Technisch',
    question: 'Wie oft sollte ich mein Theme analysieren?',
    answer: 'Wir empfehlen eine Analyse nach jeder größeren Theme-Änderung und mindestens einmal pro Woche. So erkennst du Probleme früh und kannst die Auswirkungen deiner Optimierungen verfolgen.'
  },
  {
    category: 'Technisch',
    question: 'Warum unterscheiden sich meine Scores manchmal?',
    answer: 'Performance-Daten von Google können leicht variieren, da sie von echten Netzwerkbedingungen abhängen. Kleine Schwankungen (±5 Punkte) sind normal. Der Liquid-Code-Score ist stabil und ändert sich nur, wenn du den Code änderst.'
  },
  {
    category: 'Technisch',
    question: 'Kann ich ThemeMetrics mit mehreren Shops nutzen?',
    answer: 'Ja! Du installierst ThemeMetrics separat in jedem Shop. Je nach Plan können unterschiedliche Limits für die Anzahl der Analysen gelten.'
  },
  
  // Datenschutz
  {
    category: 'Datenschutz',
    question: 'Welche Daten speichert ThemeMetrics?',
    answer: 'Wir speichern: Deine Shop-Domain, Theme-Analyse-Ergebnisse und Scores. Wir speichern KEINE Kundendaten, Bestellungen oder personenbezogenen Daten deiner Kunden. Details findest du in unserer Datenschutzerklärung.'
  },
  {
    category: 'Datenschutz',
    question: 'Ist ThemeMetrics DSGVO-konform?',
    answer: 'Ja! Wir sind ein deutsches Unternehmen und vollständig DSGVO-konform. Deine Daten werden auf Servern in der EU gespeichert. Du kannst jederzeit die Löschung deiner Daten beantragen.'
  },
];

const categories = ['Allgemein', 'Features', 'Billing', 'Technisch', 'Datenschutz'];

const categoryIcons: Record<string, React.ReactNode> = {
  'Allgemein': <BookOpen className="w-5 h-5" />,
  'Features': <Zap className="w-5 h-5" />,
  'Billing': <CreditCard className="w-5 h-5" />,
  'Technisch': <Settings className="w-5 h-5" />,
  'Datenschutz': <Shield className="w-5 h-5" />,
};

function HelpContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleQuestion = (question: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(question)) {
      newExpanded.delete(question);
    } else {
      newExpanded.add(question);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredFaqs = activeCategory 
    ? faqs.filter(f => f.category === activeCategory)
    : faqs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/settings?shop=${shop}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zu Einstellungen
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-indigo-600" />
          Help Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Häufig gestellte Fragen und Anleitungen
        </p>
      </div>

      {/* Contact Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-indigo-900">Frage nicht dabei?</h2>
            <p className="text-indigo-700 mt-1">
              Unser Support-Team hilft dir gerne weiter.
            </p>
          </div>
          <a 
            href="mailto:cs@thememetrics.de"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            cs@thememetrics.de
          </a>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeCategory === null 
              ? 'bg-indigo-600 text-white' 
              : 'bg-secondary text-foreground hover:bg-muted'
          }`}
        >
          Alle
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeCategory === category 
                ? 'bg-indigo-600 text-white' 
                : 'bg-secondary text-foreground hover:bg-muted'
            }`}
          >
            {categoryIcons[category]}
            {category}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {filteredFaqs.map((faq, index) => (
          <div key={index}>
            <button
              onClick={() => toggleQuestion(faq.question)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedQuestions.has(faq.question) ? (
                  <ChevronDown className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium text-foreground">{faq.question}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full ml-4 flex-shrink-0">
                {faq.category}
              </span>
            </button>
            
            {expandedQuestions.has(faq.question) && (
              <div className="px-6 pb-4 pl-14">
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href={`/dashboard/score-info?shop=${shop}`}
          className="bg-card rounded-xl border border-border p-6 hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-semibold text-foreground">Score-Berechnung</h3>
          <p className="text-sm text-muted-foreground mt-1">Wie der ThemeMetrics Score funktioniert</p>
        </Link>
        
        <Link
          href={`/dashboard/privacy?shop=${shop}`}
          className="bg-card rounded-xl border border-border p-6 hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <Shield className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-semibold text-foreground">Datenschutz</h3>
          <p className="text-sm text-muted-foreground mt-1">Wie wir mit deinen Daten umgehen</p>
        </Link>
        
        <Link
          href={`/dashboard/terms?shop=${shop}`}
          className="bg-card rounded-xl border border-border p-6 hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="font-semibold text-foreground">Nutzungsbedingungen</h3>
          <p className="text-sm text-muted-foreground mt-1">AGB und rechtliche Hinweise</p>
        </Link>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <HelpContent />
    </Suspense>
  );
}
