'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-500" />
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="text-slate-400 mt-2">
            Zuletzt aktualisiert: 24. Januar 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 space-y-8 text-slate-300">
          
          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 1 Geltungsbereich</h2>
            <p className="leading-relaxed">
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle 
              Verträge zwischen ahrensandco, Inhaber Julian Rouven Maximilian Polleschner, 
              Parkweg 28, 14656 Brieselang (nachfolgend "Anbieter") und dem Kunden über die Nutzung 
              der Shopify-App "ThemeMetrics" (nachfolgend "App" oder "Dienst").
            </p>
            <p className="leading-relaxed mt-4">
              (2) Mit der Installation der App akzeptiert der Kunde diese AGB.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der 
              Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 2 Vertragsgegenstand</h2>
            <p className="leading-relaxed">
              (1) Der Anbieter stellt dem Kunden die App ThemeMetrics als Software-as-a-Service 
              (SaaS) zur Verfügung. Der genaue Funktionsumfang ergibt sich aus der jeweiligen 
              Leistungsbeschreibung.
            </p>
            <p className="leading-relaxed mt-4">
              (2) ThemeMetrics bietet folgende Kernfunktionen:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Analyse von Shopify-Themes auf Code-Qualität und Performance</li>
              <li>Berechnung eines ThemeMetrics Scores auf Section-Ebene</li>
              <li>Accessibility-Prüfung nach WCAG 2.1 Standard</li>
              <li>Bildoptimierungs-Analyse</li>
              <li>Konkrete Optimierungsempfehlungen mit Code-Snippets</li>
              <li>Performance-Messung via Google PageSpeed Insights</li>
              <li>Historische Score-Verläufe und Vorher/Nachher-Vergleiche</li>
            </ul>
            <p className="leading-relaxed mt-4">
              (3) Der Funktionsumfang kann je nach gewähltem Tarif variieren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 3 Vertragsschluss</h2>
            <p className="leading-relaxed">
              (1) Der Vertrag kommt durch die Installation der App aus dem Shopify App Store 
              zustande.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Mit der Installation bestätigt der Kunde, diese AGB gelesen und akzeptiert 
              zu haben sowie die Datenschutzerklärung zur Kenntnis genommen zu haben.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Die Vertragssprache ist Deutsch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 4 Preise und Zahlung</h2>
            <p className="leading-relaxed">
              (1) Die Abrechnung erfolgt ausschließlich über Shopify Billing. Die aktuellen 
              Preise sind im Shopify App Store und in der App unter "Pricing" einsehbar.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung). 
              In Rechnungen wird auf die Anwendung der Kleinunternehmerregelung hingewiesen.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Preisänderungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten per 
              E-Mail mitgeteilt. Der Kunde kann in diesem Fall zum Zeitpunkt der Preisänderung 
              kündigen. Kündigt der Kunde nicht, gilt die Zustimmung zur Preisänderung als erteilt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 5 Kostenlose Testphase</h2>
            <p className="leading-relaxed">
              (1) Neue Kunden erhalten eine kostenlose Testphase von 14 Tagen mit vollem 
              Funktionsumfang des gewählten Tarifs.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Nach Ablauf der Testphase wird das Abonnement automatisch kostenpflichtig, 
              sofern der Kunde nicht vorher kündigt.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Der Kunde wird 3 Tage vor Ablauf der Testphase per E-Mail erinnert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 6 Vertragsdauer und Kündigung</h2>
            <p className="leading-relaxed">
              (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Seiten 
              jederzeit zum Ende des jeweiligen Abrechnungszeitraums gekündigt werden.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Die Kündigung erfolgt durch Deinstallation der App über den Shopify App Store 
              oder durch schriftliche Mitteilung an cs@thememetrics.de.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Eine anteilige Erstattung für den laufenden Abrechnungszeitraum erfolgt nicht, 
              es sei denn, der Anbieter hat die Kündigung zu vertreten.
            </p>
            <p className="leading-relaxed mt-4">
              (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 7 Verfügbarkeit</h2>
            <p className="leading-relaxed">
              (1) Der Anbieter bemüht sich um eine Verfügbarkeit von 99,5% im Jahresdurchschnitt.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Geplante Wartungsarbeiten werden nach Möglichkeit im Voraus angekündigt und 
              außerhalb der Hauptgeschäftszeiten durchgeführt.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Der Anbieter haftet nicht für Ausfälle, die auf folgende Umstände zurückzuführen sind:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Störungen bei Shopify oder anderen Drittanbietern</li>
              <li>Höhere Gewalt</li>
              <li>Handlungen oder Unterlassungen des Kunden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 8 Nutzungsrechte</h2>
            <p className="leading-relaxed">
              (1) Der Kunde erhält ein einfaches, nicht übertragbares, nicht unterlizenzierbares 
              Nutzungsrecht an der App für die Dauer des Vertragsverhältnisses.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Es ist dem Kunden untersagt:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Die App zu dekompilieren, zu disassemblieren oder zurückzuentwickeln</li>
              <li>Die App für rechtswidrige Zwecke zu nutzen</li>
              <li>Die App systematisch auszulesen, zu scrapen oder zu kopieren</li>
              <li>Nutzungsrechte an Dritte weiterzugeben oder unterzulizenzieren</li>
              <li>Die Sicherheitsmaßnahmen der App zu umgehen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 9 Geistiges Eigentum</h2>
            <p className="leading-relaxed">
              (1) Alle Rechte an der App, einschließlich der Software, des Designs, der Algorithmen, 
              des ThemeMetrics Scores und der Dokumentation, verbleiben beim Anbieter.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Der "ThemeMetrics Score" ist eine proprietäre Metrik des Anbieters.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 10 Haftung</h2>
            <p className="leading-relaxed">
              (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, 
              des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher 
              Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem Fall auf den 
              vorhersehbaren, vertragstypischen Schaden begrenzt.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Die Haftung für leichte Fahrlässigkeit ist auf maximal den Betrag begrenzt, 
              den der Kunde in den letzten 12 Monaten an den Anbieter gezahlt hat.
            </p>
            <p className="leading-relaxed mt-4">
              (4) Der Anbieter haftet nicht für:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Entgangenen Gewinn oder indirekte Schäden</li>
              <li>Schäden durch unsachgemäße Umsetzung der Empfehlungen</li>
              <li>Ausfälle oder Fehler von Drittanbietern (Shopify, Google)</li>
              <li>Datenverlust bei nicht ordnungsgemäßer Datensicherung durch den Kunden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 11 Gewährleistung</h2>
            <p className="leading-relaxed">
              (1) Die Analyse-Ergebnisse und Empfehlungen stellen keine Garantie für bestimmte 
              Ergebnisse dar (z.B. bessere Rankings, höhere Conversion-Raten, mehr Umsatz).
            </p>
            <p className="leading-relaxed mt-4">
              (2) Die Umsetzung von Empfehlungen erfolgt auf eigene Verantwortung des Kunden. 
              Der Anbieter empfiehlt, vor Änderungen am Theme ein Backup zu erstellen.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Mängelansprüche verjähren in 12 Monaten ab Bereitstellung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 12 Datenschutz</h2>
            <p className="leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt gemäß der{' '}
              <Link href="/datenschutz" className="text-indigo-400 hover:text-indigo-300 underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 13 Änderungen der AGB</h2>
            <p className="leading-relaxed">
              (1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern.
            </p>
            <p className="leading-relaxed mt-4">
              (2) Der Kunde wird über Änderungen mindestens 30 Tage vor Inkrafttreten per E-Mail 
              informiert.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Widerspricht der Kunde den Änderungen nicht innerhalb von 30 Tagen nach Zugang 
              der Mitteilung, gelten die Änderungen als akzeptiert. Der Anbieter wird den Kunden 
              in der Änderungsmitteilung auf diese Rechtsfolge hinweisen.
            </p>
            <p className="leading-relaxed mt-4">
              (4) Bei Widerspruch kann der Kunde den Vertrag zum Zeitpunkt des Inkrafttretens 
              der Änderungen kündigen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 14 Schlussbestimmungen</h2>
            <p className="leading-relaxed">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
              UN-Kaufrechts (CISG).
            </p>
            <p className="leading-relaxed mt-4">
              (2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder 
              öffentlich-rechtliches Sondervermögen, ist Gerichtsstand für alle Streitigkeiten 
              Berlin.
            </p>
            <p className="leading-relaxed mt-4">
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt 
              die Wirksamkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung 
              gilt als durch eine wirksame Bestimmung ersetzt, die dem wirtschaftlichen Zweck 
              der unwirksamen Bestimmung am nächsten kommt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">§ 15 Kontakt</h2>
            <p className="leading-relaxed">
              Bei Fragen zu diesen AGB kontaktieren Sie uns unter:<br />
              E-Mail: cs@thememetrics.de<br />
              Telefon: +49 157 53416009
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          <Link href="/widerruf" className="hover:text-white transition-colors">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
