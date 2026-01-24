'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

function PrivacyContent() {
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
          <Shield className="w-7 h-7 text-indigo-600" />
          Datenschutzerklärung
        </h1>
        <p className="text-muted-foreground mt-1">
          Zuletzt aktualisiert: 23. Januar 2026
        </p>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border p-8 prose prose-slate max-w-none">
        
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher für die Datenverarbeitung ist:<br />
          ahrensandco<br />
          Inhaber: Julian Rouven Maximilian Polleschner<br />
          Parkweg 28, 14656 Brieselang<br />
          Telefon: +49 157 53416009<br />
          E-Mail: cs@thememetrics.de
        </p>

        <h2>2. Welche Daten wir erheben</h2>
        <p>Bei der Nutzung von ThemeMetrics erheben wir folgende Daten:</p>
        
        <h3>2.1 Shop-Daten</h3>
        <ul>
          <li>Shop-Domain (z.B. dein-shop.myshopify.com)</li>
          <li>Shop-Name</li>
          <li>E-Mail-Adresse des Shop-Inhabers</li>
          <li>Installierte Theme-Informationen (Name, ID)</li>
        </ul>

        <h3>2.2 Analyse-Daten</h3>
        <ul>
          <li>Theme-Code zur Analyse (wird nicht dauerhaft gespeichert)</li>
          <li>Analyse-Ergebnisse und Scores</li>
          <li>Performance-Metriken von Google PageSpeed</li>
          <li>Historische Score-Verläufe</li>
        </ul>

        <h3>2.3 Technische Daten</h3>
        <ul>
          <li>IP-Adresse (anonymisiert)</li>
          <li>Browser-Typ und -Version</li>
          <li>Zugriffszeitpunkt</li>
        </ul>

        <h2>3. Was wir NICHT erheben</h2>
        <p>ThemeMetrics erhebt ausdrücklich KEINE:</p>
        <ul>
          <li>Kundendaten deines Shops</li>
          <li>Bestellungen oder Transaktionen</li>
          <li>Zahlungsinformationen deiner Kunden</li>
          <li>Personenbezogene Daten deiner Shop-Besucher</li>
          <li>Produktdaten oder Preise</li>
        </ul>

        <h2>4. Zweck der Datenverarbeitung</h2>
        <p>Wir verarbeiten deine Daten ausschließlich für folgende Zwecke:</p>
        <ul>
          <li>Bereitstellung der Theme-Analyse-Funktionen</li>
          <li>Berechnung und Anzeige deiner Scores</li>
          <li>Generierung von Optimierungsempfehlungen</li>
          <li>Versand von E-Mail-Benachrichtigungen (falls aktiviert)</li>
          <li>Abrechnung über Shopify Billing</li>
          <li>Verbesserung unserer Dienste</li>
        </ul>

        <h2>5. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO 
          (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse 
          an der Bereitstellung und Verbesserung unserer Dienste).
        </p>

        <h2>6. Speicherdauer</h2>
        <p>
          Deine Daten werden gespeichert, solange du ThemeMetrics nutzt. Nach Deinstallation 
          der App werden deine Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen 
          Aufbewahrungspflichten bestehen.
        </p>
        <p>
          Analyse-Ergebnisse und historische Scores werden für maximal 12 Monate gespeichert.
        </p>

        <h2>7. Datenübermittlung</h2>
        <p>Deine Daten werden übermittelt an:</p>
        <ul>
          <li><strong>Shopify:</strong> Für OAuth-Authentifizierung und Billing</li>
          <li><strong>Google:</strong> Für PageSpeed Insights API (anonymisiert)</li>
          <li><strong>Vercel:</strong> Hosting-Provider (Server in der EU)</li>
          <li><strong>Neon:</strong> Datenbank-Provider (Server in der EU)</li>
        </ul>
        <p>
          Eine Übermittlung in Drittländer außerhalb der EU/EWR erfolgt nur, wenn 
          angemessene Garantien bestehen (z.B. EU-Standardvertragsklauseln).
        </p>

        <h2>8. Deine Rechte</h2>
        <p>Du hast folgende Rechte:</p>
        <ul>
          <li><strong>Auskunft:</strong> Du kannst Auskunft über deine gespeicherten Daten verlangen.</li>
          <li><strong>Berichtigung:</strong> Du kannst die Berichtigung unrichtiger Daten verlangen.</li>
          <li><strong>Löschung:</strong> Du kannst die Löschung deiner Daten verlangen.</li>
          <li><strong>Einschränkung:</strong> Du kannst die Einschränkung der Verarbeitung verlangen.</li>
          <li><strong>Datenübertragbarkeit:</strong> Du kannst deine Daten in einem gängigen Format erhalten.</li>
          <li><strong>Widerspruch:</strong> Du kannst der Verarbeitung widersprechen.</li>
        </ul>
        <p>
          Zur Ausübung deiner Rechte kontaktiere uns unter: cs@thememetrics.de
        </p>

        <h2>9. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Maßnahmen ein, um deine Daten zu schützen:
        </p>
        <ul>
          <li>Verschlüsselte Übertragung (TLS/SSL)</li>
          <li>Verschlüsselte Speicherung sensibler Daten</li>
          <li>Regelmäßige Sicherheitsupdates</li>
          <li>Zugriffsbeschränkungen</li>
        </ul>

        <h2>10. Cookies</h2>
        <p>
          ThemeMetrics verwendet nur technisch notwendige Cookies für die Authentifizierung 
          und Session-Verwaltung. Wir verwenden keine Tracking- oder Marketing-Cookies.
        </p>

        <h2>11. Änderungen</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. 
          Die aktuelle Version findest du immer in der App.
        </p>

        <h2>12. Beschwerderecht</h2>
        <p>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, 
          wenn du der Meinung bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.
        </p>

        <h2>13. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz kontaktiere uns unter:<br />
          E-Mail: cs@thememetrics.de
        </p>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <PrivacyContent />
    </Suspense>
  );
}
