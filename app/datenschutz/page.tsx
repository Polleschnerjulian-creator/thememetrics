'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function DatenschutzPage() {
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
            <Shield className="w-8 h-8 text-indigo-500" />
            Datenschutzerklärung
          </h1>
          <p className="text-slate-400 mt-2">
            Zuletzt aktualisiert: 24. Januar 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 space-y-8 text-slate-300">
          
          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">1. Verantwortlicher</h2>
            <p className="leading-relaxed">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <p className="mt-4 leading-relaxed">
              ahrensandco<br />
              Inhaber: Julian Rouven Maximilian Polleschner<br />
              Parkweg 28<br />
              14656 Brieselang<br />
              Deutschland
            </p>
            <p className="mt-4">
              Telefon: +49 157 53416009<br />
              E-Mail: cs@thememetrics.de
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">2. Übersicht der Verarbeitungen</h2>
            <p className="leading-relaxed">
              Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke 
              ihrer Verarbeitung zusammen und verweist auf die betroffenen Personen.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3 text-white">Arten der verarbeiteten Daten</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Bestandsdaten (z.B. Shop-Domain, Shop-Name)</li>
              <li>Kontaktdaten (z.B. E-Mail-Adresse)</li>
              <li>Nutzungsdaten (z.B. Analyse-Ergebnisse, Scores)</li>
              <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen, Zeitpunkte)</li>
              <li>Vertragsdaten (z.B. gewählter Tarif, Zahlungsstatus)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">Kategorien betroffener Personen</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Nutzer der App (Shopify-Händler)</li>
              <li>Interessenten (Besucher der Website)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">Zwecke der Verarbeitung</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Bereitstellung der Theme-Analyse-Funktionen</li>
              <li>Vertragserfüllung und Kundenservice</li>
              <li>Abrechnung über Shopify Billing</li>
              <li>Sicherheitsmaßnahmen</li>
              <li>Reichweitenmessung und Verbesserung des Dienstes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">3. Rechtsgrundlagen</h2>
            <p className="leading-relaxed">
              Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren 
              Basis wir personenbezogene Daten verarbeiten:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>
                <strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</strong> – Die Verarbeitung 
                ist für die Erfüllung des Vertrags (App-Nutzung) erforderlich.
              </li>
              <li>
                <strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</strong> – Die 
                Verarbeitung ist zur Wahrung unserer berechtigten Interessen erforderlich 
                (z.B. Sicherheit, Verbesserung des Dienstes).
              </li>
              <li>
                <strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</strong> – Die 
                Verarbeitung ist zur Erfüllung rechtlicher Pflichten erforderlich (z.B. 
                Aufbewahrungspflichten).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">4. Welche Daten wir erheben</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-3 text-white">4.1 Shop-Daten (bei App-Installation)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Shop-Domain (z.B. dein-shop.myshopify.com)</li>
              <li>Shop-Name</li>
              <li>E-Mail-Adresse des Shop-Inhabers</li>
              <li>Installierte Theme-Informationen (Name, ID, Rolle)</li>
              <li>Gewählter Tarif und Abonnement-Status</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">4.2 Analyse-Daten</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Theme-Code zur Analyse (wird temporär verarbeitet, nicht dauerhaft gespeichert)</li>
              <li>Analyse-Ergebnisse und Scores</li>
              <li>Performance-Metriken von Google PageSpeed</li>
              <li>Historische Score-Verläufe</li>
              <li>Generierte Empfehlungen</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">4.3 Technische Daten</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP-Adresse (wird nach 7 Tagen anonymisiert)</li>
              <li>Browser-Typ und -Version</li>
              <li>Betriebssystem</li>
              <li>Zugriffszeitpunkt</li>
              <li>Referrer-URL</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">4.4 Was wir NICHT erheben</h3>
            <p className="leading-relaxed">ThemeMetrics erhebt ausdrücklich KEINE:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Kundendaten deines Shops (Namen, Adressen, etc.)</li>
              <li>Bestellungen oder Transaktionsdaten</li>
              <li>Zahlungsinformationen deiner Kunden</li>
              <li>Personenbezogene Daten deiner Shop-Besucher</li>
              <li>Produktdaten, Preise oder Lagerbestände</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">5. Empfänger und Auftragsverarbeiter</h2>
            <p className="leading-relaxed">
              Wir übermitteln personenbezogene Daten nur dann an Dritte, wenn dies im Rahmen 
              der Vertragserfüllung erforderlich ist, wir gesetzlich hierzu verpflichtet sind 
              oder ein berechtigtes Interesse besteht.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-white">5.1 Auftragsverarbeiter</h3>
            
            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-white">Vercel Inc. (Hosting)</p>
              <p className="text-sm mt-1">440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
              <p className="text-sm mt-1">Zweck: Hosting der Anwendung</p>
              <p className="text-sm mt-1">Datenkategorien: Technische Daten, Nutzungsdaten</p>
              <p className="text-sm mt-1">Garantien: EU-Standardvertragsklauseln, DPF-Zertifizierung</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-white">Neon Inc. (Datenbank)</p>
              <p className="text-sm mt-1">548 Market St #35875, San Francisco, CA 94104, USA</p>
              <p className="text-sm mt-1">Zweck: Speicherung der Analysedaten</p>
              <p className="text-sm mt-1">Datenkategorien: Shop-Daten, Analyse-Daten</p>
              <p className="text-sm mt-1">Serverstandort: EU (Frankfurt/Deutschland)</p>
              <p className="text-sm mt-1">Garantien: EU-Standardvertragsklauseln</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-white">Shopify Inc. (Plattform & Billing)</p>
              <p className="text-sm mt-1">151 O'Connor Street, Ottawa, ON K2P 2L8, Kanada</p>
              <p className="text-sm mt-1">Zweck: OAuth-Authentifizierung, Abrechnung</p>
              <p className="text-sm mt-1">Datenkategorien: Shop-Daten, Vertragsdaten</p>
              <p className="text-sm mt-1">Garantien: EU-Standardvertragsklauseln, BCR</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <p className="font-medium text-white">Google LLC (PageSpeed Insights API)</p>
              <p className="text-sm mt-1">1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
              <p className="text-sm mt-1">Zweck: Performance-Messung</p>
              <p className="text-sm mt-1">Datenkategorien: Shop-URL (öffentlich zugänglich)</p>
              <p className="text-sm mt-1">Garantien: DPF-Zertifizierung</p>
              <p className="text-sm text-slate-400 mt-1">
                Hinweis: Es werden nur öffentlich zugängliche URLs an Google übermittelt, 
                keine personenbezogenen Daten.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">6. Übermittlung in Drittländer</h2>
            <p className="leading-relaxed">
              Einige der oben genannten Auftragsverarbeiter haben ihren Sitz in den USA. Die 
              USA gelten als Drittland ohne angemessenes Datenschutzniveau. Die Übermittlung 
              erfolgt auf Grundlage von:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>
                <strong>EU-US Data Privacy Framework (DPF)</strong> – Für Unternehmen, die unter 
                dem DPF zertifiziert sind (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023).
              </li>
              <li>
                <strong>EU-Standardvertragsklauseln</strong> – Gemäß Art. 46 Abs. 2 lit. c DSGVO.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">7. Speicherdauer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Shop-Daten:</strong> Werden gespeichert, solange die App installiert ist. 
                Nach Deinstallation werden die Daten innerhalb von 30 Tagen gelöscht.
              </li>
              <li>
                <strong>Analyse-Ergebnisse:</strong> Werden für maximal 12 Monate gespeichert, 
                um historische Vergleiche zu ermöglichen.
              </li>
              <li>
                <strong>Rechnungsdaten:</strong> Werden gemäß gesetzlicher Aufbewahrungspflichten 
                (§ 147 AO, § 257 HGB) für 10 Jahre aufbewahrt.
              </li>
              <li>
                <strong>Server-Logs:</strong> Werden nach 7 Tagen gelöscht bzw. anonymisiert.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">8. Ihre Rechte</h2>
            <p className="leading-relaxed">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li><strong>Auskunftsrecht (Art. 15 DSGVO)</strong> – Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
              <li><strong>Berichtigungsrecht (Art. 16 DSGVO)</strong> – Sie können die Berichtigung unrichtiger Daten verlangen.</li>
              <li><strong>Löschungsrecht (Art. 17 DSGVO)</strong> – Sie können die Löschung Ihrer Daten verlangen.</li>
              <li><strong>Einschränkungsrecht (Art. 18 DSGVO)</strong> – Sie können die Einschränkung der Verarbeitung verlangen.</li>
              <li><strong>Datenübertragbarkeit (Art. 20 DSGVO)</strong> – Sie können Ihre Daten in einem maschinenlesbaren Format erhalten.</li>
              <li><strong>Widerspruchsrecht (Art. 21 DSGVO)</strong> – Sie können der Verarbeitung widersprechen.</li>
            </ul>
            <p className="mt-4">
              Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter: <br />
              <a href="mailto:cs@thememetrics.de" className="text-indigo-400 hover:text-indigo-300">cs@thememetrics.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">9. Beschwerderecht</h2>
            <p className="leading-relaxed">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, 
              wenn Sie der Meinung sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt.
            </p>
            <p className="mt-4">
              Zuständige Aufsichtsbehörde:<br />
              Berliner Beauftragte für Datenschutz und Informationsfreiheit<br />
              Friedrichstraße 219<br />
              10969 Berlin<br />
              <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300">
                www.datenschutz-berlin.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">10. Cookies</h2>
            <p className="leading-relaxed">
              ThemeMetrics verwendet ausschließlich technisch notwendige Cookies:
            </p>
            <div className="bg-slate-800 rounded-lg p-4 mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Zweck</th>
                    <th className="text-left py-2">Dauer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="py-2">shop_session</td>
                    <td className="py-2">Authentifizierung</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2">theme</td>
                    <td className="py-2">Dark/Light Mode Präferenz</td>
                    <td className="py-2">1 Jahr</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-slate-400">
              Wir verwenden keine Tracking- oder Marketing-Cookies. Eine Einwilligung ist für 
              technisch notwendige Cookies nicht erforderlich (§ 25 Abs. 2 TDDDG).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">11. Datensicherheit</h2>
            <p className="leading-relaxed">
              Wir setzen technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO ein:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-4">
              <li>Verschlüsselte Übertragung aller Daten (TLS 1.3)</li>
              <li>Verschlüsselte Speicherung sensibler Daten (AES-256)</li>
              <li>Regelmäßige Sicherheitsupdates</li>
              <li>Zugriffsbeschränkungen nach dem Need-to-know-Prinzip</li>
              <li>Regelmäßige Backups</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">12. Änderungen</h2>
            <p className="leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie 
              an geänderte Rechtslagen oder bei Änderungen des Dienstes anzupassen. Die aktuelle 
              Version ist stets auf dieser Seite abrufbar.
            </p>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
          <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
          <Link href="/widerruf" className="hover:text-white transition-colors">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
