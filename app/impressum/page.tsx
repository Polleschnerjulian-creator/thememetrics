'use client';

import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function ImpressumPage() {
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
            <Scale className="w-8 h-8 text-indigo-500" />
            Impressum
          </h1>
          <p className="text-slate-400 mt-2">
            Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)
          </p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Anbieter</h2>
            <p className="text-slate-300 leading-relaxed">
              ahrensandco<br />
              Inhaber: Julian Rouven Maximilian Polleschner<br />
              Parkweg 28<br />
              14656 Brieselang<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Kontakt</h2>
            <p className="text-slate-300 leading-relaxed">
              Telefon: +49 157 53416009<br />
              E-Mail: cs@thememetrics.de
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Wir sind bemüht, Ihre Anfragen innerhalb von 24 Stunden zu beantworten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Umsatzsteuer</h2>
            <p className="text-slate-300 leading-relaxed">
              Kleinunternehmer gemäß § 19 UStG. Es wird keine Umsatzsteuer berechnet 
              und ausgewiesen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Verantwortlich für den Inhalt</h2>
            <p className="text-slate-300 leading-relaxed">
              Julian Rouven Maximilian Polleschner<br />
              Am Maselakepark 37<br />
              13587 Berlin
            </p>
            <p className="text-slate-400 text-sm mt-2">
              (Angaben gemäß § 18 Abs. 2 MStV)
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">EU-Streitschlichtung</h2>
            <p className="text-slate-300 leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            </p>
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline block mt-2"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            <p className="text-slate-300 mt-4">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Verbraucherstreitbeilegung</h2>
            <p className="text-slate-300 leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Haftung für Inhalte</h2>
            <p className="text-slate-300 leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen 
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind 
              wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte 
              fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine 
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach 
              den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung 
              ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung 
              möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese 
              Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Haftung für Links</h2>
            <p className="text-slate-300 leading-relaxed">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir 
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine 
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige 
              Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden 
              zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige 
              Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne 
              konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden 
              von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Urheberrecht</h2>
            <p className="text-slate-300 leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. 
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen 
              Gebrauch gestattet.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden 
              die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche 
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam 
              werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von 
              Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
          <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
          <Link href="/widerruf" className="hover:text-white transition-colors">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
