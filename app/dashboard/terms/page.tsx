'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

function TermsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/settings?shop=${shop}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zu Einstellungen
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-muted-foreground mt-1">
          Zuletzt aktualisiert: 23. Januar 2026
        </p>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border p-8 prose prose-slate max-w-none">
        
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Shopify-App 
          "ThemeMetrics" (nachfolgend "App" oder "Dienst"). Mit der Installation der App 
          akzeptierst du diese AGB.
        </p>

        <h2>2. Leistungsbeschreibung</h2>
        <p>ThemeMetrics bietet folgende Leistungen:</p>
        <ul>
          <li>Analyse von Shopify-Themes auf Code-Qualität und Performance</li>
          <li>Berechnung eines ThemeMetrics Scores</li>
          <li>Accessibility-Prüfung nach WCAG 2.1 Standard</li>
          <li>Bildoptimierungs-Analyse</li>
          <li>Konkrete Optimierungsempfehlungen</li>
          <li>Performance-Messung via Google PageSpeed Insights</li>
        </ul>
        <p>
          Der genaue Funktionsumfang richtet sich nach dem gewählten Tarif.
        </p>

        <h2>3. Vertragsschluss</h2>
        <p>
          Der Vertrag kommt durch die Installation der App aus dem Shopify App Store zustande. 
          Mit der Installation bestätigst du, diese AGB gelesen und akzeptiert zu haben.
        </p>

        <h2>4. Preise und Zahlung</h2>
        <p>
          Die Abrechnung erfolgt über Shopify Billing. Die aktuellen Preise findest du 
          im Shopify App Store und in der App unter "Pricing".
        </p>
        <p>
          Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer, sofern nicht 
          anders angegeben.
        </p>

        <h2>5. Kostenlose Testphase</h2>
        <p>
          Neue Nutzer erhalten eine kostenlose Testphase von 14 Tagen. Nach Ablauf der 
          Testphase wird der gewählte Tarif automatisch kostenpflichtig, sofern du nicht 
          vorher kündigst.
        </p>

        <h2>6. Kündigung</h2>
        <p>
          Du kannst die App jederzeit über den Shopify App Store deinstallieren. Die 
          Kündigung wird zum Ende des aktuellen Abrechnungszeitraums wirksam.
        </p>
        <p>
          Eine anteilige Erstattung für den laufenden Abrechnungszeitraum erfolgt nicht.
        </p>

        <h2>7. Verfügbarkeit</h2>
        <p>
          Wir bemühen uns um eine Verfügbarkeit von 99,5% im Jahresdurchschnitt. Geplante 
          Wartungsarbeiten werden im Voraus angekündigt. Für Ausfälle aufgrund von 
          Shopify-Störungen oder Drittanbietern (z.B. Google PageSpeed) übernehmen wir 
          keine Haftung.
        </p>

        <h2>8. Nutzungsrechte</h2>
        <p>
          Du erhältst ein einfaches, nicht übertragbares Nutzungsrecht an der App für 
          die Dauer des Vertragsverhältnisses.
        </p>
        <p>Es ist untersagt:</p>
        <ul>
          <li>Die App zu dekompilieren oder zurückzuentwickeln</li>
          <li>Die App für illegale Zwecke zu nutzen</li>
          <li>Die App systematisch auszulesen oder zu scrapen</li>
          <li>Die App an Dritte weiterzugeben oder unterzulizenzieren</li>
        </ul>

        <h2>9. Geistiges Eigentum</h2>
        <p>
          Alle Rechte an der App, einschließlich des ThemeMetrics Scores, der Algorithmen 
          und der Benutzeroberfläche, verbleiben bei ThemeMetrics. Der "ThemeMetrics Score" 
          ist eine proprietäre Metrik.
        </p>

        <h2>10. Haftung</h2>
        <p>
          ThemeMetrics haftet unbeschränkt für Schäden aus der Verletzung des Lebens, 
          des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
        </p>
        <p>
          Für leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher 
          Vertragspflichten, begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
        </p>
        <p>
          Wir haften nicht für:
        </p>
        <ul>
          <li>Entgangenen Gewinn oder indirekte Schäden</li>
          <li>Schäden durch unsachgemäße Umsetzung unserer Empfehlungen</li>
          <li>Ausfälle oder Fehler von Drittanbietern (Shopify, Google)</li>
          <li>Datenverlust bei nicht ordnungsgemäßer Datensicherung</li>
        </ul>

        <h2>11. Gewährleistung</h2>
        <p>
          Die Analyse-Ergebnisse und Empfehlungen stellen keine Garantie für bestimmte 
          Ergebnisse (z.B. bessere Rankings, höhere Conversion) dar. Die Umsetzung 
          von Empfehlungen erfolgt auf eigene Verantwortung.
        </p>

        <h2>12. Datenschutz</h2>
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer 
          <Link href={`/dashboard/privacy?shop=${shop}`} className="text-indigo-600 hover:underline mx-1">
            Datenschutzerklärung
          </Link>.
        </p>

        <h2>13. Änderungen der AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB mit angemessener Ankündigungsfrist zu ändern. 
          Du wirst über Änderungen per E-Mail informiert. Bei Widerspruch kannst du den 
          Vertrag zum Änderungszeitpunkt kündigen.
        </p>

        <h2>14. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist, 
          soweit gesetzlich zulässig, Berlin.
        </p>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
          der übrigen Bestimmungen unberührt.
        </p>

        <h2>15. Kontakt</h2>
        <p>
          Bei Fragen zu diesen AGB kontaktiere uns unter:<br />
          E-Mail: cs@thememetrics.de
        </p>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
