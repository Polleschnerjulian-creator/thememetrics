'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  CreditCard, 
  User,
  Mail,
  Shield,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard?shop=${shop}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">Verwalte dein Konto und deine Präferenzen</p>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Account</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Shop Domain</p>
              <p className="text-sm text-muted-foreground">{shop || 'Nicht verbunden'}</p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
              Verbunden
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Plan</p>
              <p className="text-sm text-muted-foreground">Starter (€49/Monat)</p>
            </div>
            <Link 
              href={`/pricing?shop=${shop}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              Upgrade <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Nächste Abrechnung</p>
              <p className="text-sm text-muted-foreground">15. Februar 2026</p>
            </div>
            <Link 
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Rechnungen <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications - Coming Soon
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Benachrichtigungen</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">E-Mail Benachrichtigungen</p>
              <p className="text-sm text-muted-foreground">Erhalte Alerts bei kritischen Performance-Problemen</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-indigo-600' : 'bg-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-transform ${emailNotifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Wöchentlicher Report</p>
              <p className="text-sm text-muted-foreground">Zusammenfassung deiner Theme-Performance per E-Mail</p>
            </div>
            <button
              onClick={() => setWeeklyReport(!weeklyReport)}
              className={`relative w-12 h-6 rounded-full transition-colors ${weeklyReport ? 'bg-indigo-600' : 'bg-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-transform ${weeklyReport ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-foreground">Alert Schwellenwert</p>
                <p className="text-sm text-muted-foreground">Benachrichtigung wenn Score unter diesen Wert fällt</p>
              </div>
              <span className="text-lg font-bold text-foreground">{alertThreshold}</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>20 (Nur kritisch)</span>
              <span>80 (Sensibel)</span>
            </div>
          </div>
        </div>
      </div>
      */}

      {/* Support */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Support & Hilfe</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">E-Mail Support</p>
              <p className="text-sm text-muted-foreground">Wir antworten in der Regel innerhalb von 24 Stunden</p>
            </div>
            <a 
              href="mailto:cs@thememetrics.de"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              cs@thememetrics.de <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Help Center</p>
              <p className="text-sm text-muted-foreground">FAQs und Anleitungen</p>
            </div>
            <Link 
              href={`/dashboard/help?shop=${shop}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Öffnen
            </Link>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Rechtliches</p>
              <p className="text-sm text-muted-foreground">Impressum, Datenschutz & Nutzungsbedingungen</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://thememetrics.de/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Impressum <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://thememetrics.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Datenschutz <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://thememetrics.de/agb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                AGB <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://thememetrics.de/widerruf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Widerruf <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Daten & Datenschutz</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Daten exportieren</p>
              <p className="text-sm text-muted-foreground">Lade alle deine Analyse-Daten als CSV herunter</p>
            </div>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
              Exportieren
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">Account löschen</p>
              <p className="text-sm text-muted-foreground">Lösche deinen Account und alle zugehörigen Daten</p>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Löschen
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Gespeichert
            </>
          ) : (
            'Einstellungen speichern'
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
