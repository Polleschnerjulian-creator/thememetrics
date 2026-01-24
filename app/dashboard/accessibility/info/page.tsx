'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  ArrowLeft, 
  Accessibility,
  AlertTriangle,
  AlertCircle,
  Info,
  Image,
  FormInput,
  Navigation,
  MousePointer,
  Heading,
  Eye,
  CheckCircle,
  Scale,
  Users,
  Gavel
} from 'lucide-react';

function AccessibilityInfoContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/accessibility?shop=${shop}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Accessibility Check
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Accessibility className="w-8 h-8 text-indigo-600" />
          Wie wird der Accessibility Score berechnet?
        </h1>
        <p className="text-muted-foreground mt-2">
          Transparente Erklärung unserer WCAG 2.1 AA Barrierefreiheitsprüfung
        </p>
      </div>

      {/* Why Accessibility Matters */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Warum Barrierefreiheit wichtig ist
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">~15%</p>
            <p className="text-sm text-muted-foreground">der Weltbevölkerung lebt mit einer Behinderung</p>
          </div>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">71%</p>
            <p className="text-sm text-muted-foreground">der Nutzer mit Behinderungen verlassen unzugängliche Websites sofort</p>
          </div>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-3xl font-bold text-indigo-600">€13B+</p>
            <p className="text-sm text-muted-foreground">Kaufkraft von Menschen mit Behinderungen in Deutschland</p>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
          <Gavel className="w-5 h-5" />
          Rechtlicher Hintergrund
        </h2>
        <p className="text-amber-700 dark:text-amber-300">
          <strong>Ab 28. Juni 2025</strong> gilt der European Accessibility Act (EAA) / Barrierefreiheitsstärkungsgesetz (BFSG). 
          Online-Shops müssen barrierefrei sein. Bei Verstößen drohen Bußgelder bis zu <strong>100.000€</strong>.
        </p>
        <p className="text-amber-700 text-sm mt-2">
          ThemeMetrics prüft dein Theme auf WCAG 2.1 Level AA Konformität – den Standard, den das BFSG referenziert.
        </p>
      </div>

      {/* Score Formula */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          Score-Berechnung
        </h2>
        
        <div className="bg-slate-900 rounded-xl p-6 text-center mb-6">
          <code className="text-emerald-400 text-lg">
            Score = 100 - (Kritisch × 10) - (Warnung × 3) - (Info × 1)
          </code>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-600 dark:text-red-400">Kritisch</span>
            </div>
            <p className="text-red-600 text-2xl font-bold">-10 Punkte</p>
            <p className="text-sm text-red-600 mt-1">
              Macht Inhalte für bestimmte Nutzergruppen komplett unzugänglich
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">Warnung</span>
            </div>
            <p className="text-amber-600 text-2xl font-bold">-3 Punkte</p>
            <p className="text-sm text-amber-600 mt-1">
              Erschwert die Nutzung, aber Inhalte sind noch erreichbar
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">Hinweis</span>
            </div>
            <p className="text-blue-600 text-2xl font-bold">-1 Punkt</p>
            <p className="text-sm text-blue-600 mt-1">
              Best Practice Empfehlung zur Verbesserung der UX
            </p>
          </div>
        </div>
      </div>

      {/* Score Ranges */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Score-Bewertung</h2>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">90+</span>
            </div>
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Exzellent</p>
              <p className="text-sm text-emerald-600">WCAG 2.1 AA konform. Dein Shop ist gut zugänglich für alle Nutzer.</p>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-500 ml-auto" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">70-89</span>
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">Gut</p>
              <p className="text-sm text-green-600">Kleine Verbesserungen nötig. Die meisten Nutzer können deinen Shop nutzen.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">50-69</span>
            </div>
            <div>
              <p className="font-semibold text-amber-600 dark:text-amber-400">Problematisch</p>
              <p className="text-sm text-amber-600">Signifikante Barrieren vorhanden. Einige Nutzergruppen sind ausgeschlossen.</p>
            </div>
            <AlertCircle className="w-6 h-6 text-amber-500 ml-auto" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">0-49</span>
            </div>
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">Kritisch</p>
              <p className="text-sm text-red-600">Nicht barrierefrei. Viele Nutzer können deinen Shop nicht verwenden.</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* What We Check */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Was wir prüfen</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground">Bilder & Medien</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Alt-Texte für Bilder</li>
              <li>• Qualität der Alt-Texte</li>
              <li>• Video-Untertitel</li>
              <li>• Hintergrundbilder mit Text</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 1.1.1, 1.2.2</p>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FormInput className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Formulare</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Label für Eingabefelder</li>
              <li>• Placeholder vs. echte Labels</li>
              <li>• Autocomplete Attribute</li>
              <li>• Fehlermeldungen</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 3.3.2, 1.3.5</p>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">Navigation</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Skip-Links vorhanden</li>
              <li>• Leere Links erkennen</li>
              <li>• Generische Link-Texte</li>
              <li>• Links in neuem Tab</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 2.4.1, 2.4.4</p>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground">Interaktive Elemente</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Button-Beschriftungen</li>
              <li>• Keyboard-Zugänglichkeit</li>
              <li>• Focus-Styles</li>
              <li>• ARIA-Attribute</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 2.1.1, 2.4.7, 4.1.2</p>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Heading className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-foreground">Struktur</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Heading-Hierarchie (h1-h6)</li>
              <li>• Keine übersprungenen Ebenen</li>
              <li>• Leere Überschriften</li>
              <li>• Semantische Landmarks</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 1.3.1, 2.4.6</p>
          </div>
          
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-foreground">Kontrast & Sichtbarkeit</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Text-Kontrastverhältnis</li>
              <li>• Focus-Indikatoren sichtbar</li>
              <li>• Nicht nur Farbe als Info</li>
              <li>• outline:none Probleme</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">WCAG 1.4.3, 1.4.11</p>
          </div>
        </div>
      </div>

      {/* Affected User Groups */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Betroffene Nutzergruppen</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              👁️
            </div>
            <div>
              <p className="font-medium text-foreground">Sehbehinderte Nutzer</p>
              <p className="text-sm text-muted-foreground">Nutzen Screen Reader wie NVDA, JAWS oder VoiceOver. Brauchen Alt-Texte und semantische Struktur.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              🖐️
            </div>
            <div>
              <p className="font-medium text-foreground">Motorisch eingeschränkte Nutzer</p>
              <p className="text-sm text-muted-foreground">Navigieren nur mit Tastatur oder Sprachsteuerung. Brauchen Focus-Styles und Keyboard-Support.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              👂
            </div>
            <div>
              <p className="font-medium text-foreground">Gehörlose Nutzer</p>
              <p className="text-sm text-muted-foreground">Brauchen Untertitel für Videos und visuelle Alternativen für Audio-Inhalte.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              🧠
            </div>
            <div>
              <p className="font-medium text-foreground">Kognitiv eingeschränkte Nutzer</p>
              <p className="text-sm text-muted-foreground">Profitieren von klarer Struktur, konsistenter Navigation und verständlichen Texten.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Bereit für einen barrierefreien Shop?</h2>
        <p className="text-indigo-100 mb-6">
          Starte den Accessibility Check und finde heraus, wie du deinen Shop für alle zugänglich machst.
        </p>
        <Link
          href={`/dashboard/accessibility?shop=${shop}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          <Accessibility className="w-5 h-5" />
          Zum Accessibility Check
        </Link>
      </div>
    </div>
  );
}

export default function AccessibilityInfoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <AccessibilityInfoContent />
    </Suspense>
  );
}
