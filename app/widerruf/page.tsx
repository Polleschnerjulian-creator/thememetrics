'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export default function WiderrufPage() {
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
            <RotateCcw className="w-8 h-8 text-indigo-500" />
            Widerrufsbelehrung
          </h1>
          <p className="text-slate-400 mt-2">
            Zuletzt aktualisiert: 24. Januar 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 space-y-8 text-slate-300">
          
          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Widerrufsrecht</h2>
            <p className="leading-relaxed">
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag 
              zu widerrufen.
            </p>
            <p className="leading-relaxed mt-4">
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses 
              (Installation der App).
            </p>
            <p className="leading-relaxed mt-4">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
            </p>
            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p>
                ahrensandco<br />
                Inhaber: Julian Rouven Maximilian Polleschner<br />
                Parkweg 28<br />
                14656 Brieselang<br />
                Deutschland<br /><br />
                Telefon: +49 157 53416009<br />
                E-Mail: cs@thememetrics.de
              </p>
            </div>
            <p className="leading-relaxed mt-4">
              mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder 
              E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie 
              können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht 
              vorgeschrieben ist.
            </p>
            <p className="leading-relaxed mt-4">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die 
              Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Folgen des Widerrufs</h2>
            <p className="leading-relaxed">
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von 
              Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen 
              Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von 
              uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und 
              spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung 
              über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
            </p>
            <p className="leading-relaxed mt-4">
              Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der 
              ursprünglichen Transaktion eingesetzt haben (Erstattung über Shopify Billing), 
              es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem 
              Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            <p className="leading-relaxed mt-4">
              Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen 
              sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der 
              bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich 
              dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum 
              Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Besonderer Hinweis</h2>
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
              <p className="text-amber-200">
                <strong>Vorzeitiges Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht 
                erlischt bei einem Vertrag zur Erbringung von Dienstleistungen vorzeitig, wenn 
                wir die Dienstleistung vollständig erbracht haben und mit der Ausführung der 
                Dienstleistung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung 
                gegeben haben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr 
                Widerrufsrecht bei vollständiger Vertragserfüllung durch uns verlieren.
              </p>
            </div>
            <p className="leading-relaxed mt-4">
              Mit der Installation der App und der aktiven Nutzung der Analyse-Funktionen stimmen 
              Sie dem vorzeitigen Beginn der Dienstleistung zu und nehmen zur Kenntnis, dass Sie 
              Ihr Widerrufsrecht mit vollständiger Erbringung der Dienstleistung verlieren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Muster-Widerrufsformular</h2>
            <p className="leading-relaxed mb-4">
              (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus 
              und senden Sie es zurück.)
            </p>
            <div className="bg-slate-800 rounded-lg p-6 font-mono text-sm">
              <p>An:</p>
              <p className="mt-2">
                ahrensandco<br />
                Inhaber: Julian Rouven Maximilian Polleschner<br />
                Parkweg 28<br />
                14656 Brieselang<br />
                E-Mail: cs@thememetrics.de
              </p>
              <p className="mt-4">
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag 
                über die Erbringung der folgenden Dienstleistung (*)
              </p>
              <p className="mt-4">_______________________________________________</p>
              <p className="mt-4">Bestellt am (*) / erhalten am (*): _______________</p>
              <p className="mt-4">Name des/der Verbraucher(s): _______________</p>
              <p className="mt-4">Anschrift des/der Verbraucher(s):</p>
              <p>_______________________________________________</p>
              <p>_______________________________________________</p>
              <p className="mt-4">Shop-Domain (falls zutreffend): _______________</p>
              <p className="mt-6">_______________________________________________</p>
              <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
              <p className="mt-4">_______________________________________________</p>
              <p>Datum</p>
              <p className="mt-4 text-slate-500">(*) Unzutreffendes streichen.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Praktische Umsetzung</h2>
            <p className="leading-relaxed">
              Sie können Ihren Widerruf auch einfach per E-Mail an uns senden:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-white">Betreff: Widerruf ThemeMetrics</p>
              <p className="mt-2 text-slate-400">
                Inhalt: "Hiermit widerrufe ich meinen Vertrag zur Nutzung von ThemeMetrics. 
                Meine Shop-Domain ist: [Ihre Shop-Domain]"
              </p>
            </div>
            <p className="mt-4">
              Senden an:{' '}
              <a href="mailto:cs@thememetrics.de?subject=Widerruf%20ThemeMetrics" className="text-indigo-400 hover:text-indigo-300">
                cs@thememetrics.de
              </a>
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
        </div>
      </div>
    </div>
  );
}
