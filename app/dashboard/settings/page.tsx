'use client';

import { useAppBridge } from '@/components/providers/AppBridgeProvider';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
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
  Check,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface EmailPreferences {
  weeklyReports: boolean;
  scoreAlerts: boolean;
  productUpdates: boolean;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { authenticatedFetch } = useAppBridge();
  const shop = searchParams.get('shop') || '';
  const { language } = useLanguage();
  
  // Email preferences state
  const [preferences, setPreferences] = useState<EmailPreferences>({
    weeklyReports: true,
    scoreAlerts: true,
    productUpdates: true,
  });
  const [email, setEmail] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load email preferences on mount
  useEffect(() => {
    if (!shop) return;
    
    const loadPreferences = async () => {
      try {
        const response = await authenticatedFetch(`/api/emails/preferences?shop=${shop}`);
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
          setHasSubscription(data.hasSubscription);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [shop]);

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/emails/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          email: email || undefined,
          preferences,
        }),
      });
      
      if (response.ok) {
        setSaved(true);
        setHasSubscription(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  const isGerman = language === 'de';

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href={`/dashboard?shop=${shop}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isGerman ? 'Zurück zum Dashboard' : 'Back to Dashboard'}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {isGerman ? 'Einstellungen' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isGerman ? 'Verwalte dein Konto und deine Präferenzen' : 'Manage your account and preferences'}
        </p>
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
              <p className="text-sm text-muted-foreground">{shop || (isGerman ? 'Nicht verbunden' : 'Not connected')}</p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
              {isGerman ? 'Verbunden' : 'Connected'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Plan</p>
              <p className="text-sm text-muted-foreground">Starter (€29/{isGerman ? 'Monat' : 'month'})</p>
            </div>
            <Link 
              href={`/dashboard/pricing?shop=${shop}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              Upgrade <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">
                {isGerman ? 'Nächste Abrechnung' : 'Next Billing'}
              </p>
              <p className="text-sm text-muted-foreground">15. Februar 2026</p>
            </div>
            <Link 
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {isGerman ? 'Rechnungen' : 'Invoices'} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">
            {isGerman ? 'E-Mail Benachrichtigungen' : 'Email Notifications'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Email Input (if no subscription yet) */}
              {!hasSubscription && (
                <div className="py-3 border-b border-border">
                  <label className="block font-medium text-foreground mb-2">
                    {isGerman ? 'E-Mail Adresse' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isGerman ? 'deine@email.de' : 'your@email.com'}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isGerman 
                      ? 'Gib deine E-Mail ein, um Benachrichtigungen zu erhalten'
                      : 'Enter your email to receive notifications'}
                  </p>
                </div>
              )}

              {/* Weekly Reports Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">
                    {isGerman ? 'Wöchentlicher Report' : 'Weekly Report'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? 'Zusammenfassung deiner Theme-Performance per E-Mail'
                      : 'Summary of your theme performance via email'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReports')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.weeklyReports ? 'bg-indigo-600' : 'bg-border'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${preferences.weeklyReports ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {/* Score Alerts Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">
                    {isGerman ? 'Score-Änderungen' : 'Score Alerts'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? 'Benachrichtigung bei signifikanten Score-Änderungen'
                      : 'Get notified about significant score changes'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('scoreAlerts')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.scoreAlerts ? 'bg-indigo-600' : 'bg-border'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${preferences.scoreAlerts ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {/* Product Updates Toggle */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">
                    {isGerman ? 'Produkt-Updates' : 'Product Updates'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? 'Neue Features und Verbesserungen'
                      : 'New features and improvements'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('productUpdates')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.productUpdates ? 'bg-indigo-600' : 'bg-border'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${preferences.productUpdates ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Support */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">
            {isGerman ? 'Support & Hilfe' : 'Support & Help'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">E-Mail Support</p>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Wir antworten in der Regel innerhalb von 24 Stunden'
                  : 'We usually respond within 24 hours'}
              </p>
            </div>
            <a 
              href="mailto:support@thememetrics.de"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              support@thememetrics.de <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Help Center</p>
              <p className="text-sm text-muted-foreground">
                {isGerman ? 'FAQs und Anleitungen' : 'FAQs and guides'}
              </p>
            </div>
            <Link 
              href={`/dashboard/help?shop=${shop}`}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              {isGerman ? 'Öffnen' : 'Open'}
            </Link>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">
                {isGerman ? 'Rechtliches' : 'Legal'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Impressum, Datenschutz & Nutzungsbedingungen'
                  : 'Imprint, Privacy & Terms'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://thememetrics.de/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {isGerman ? 'Impressum' : 'Imprint'} <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://thememetrics.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {isGerman ? 'Datenschutz' : 'Privacy'} <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://thememetrics.de/agb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {isGerman ? 'AGB' : 'Terms'} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center gap-3">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">
            {isGerman ? 'Daten & Datenschutz' : 'Data & Privacy'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">
                {isGerman ? 'Daten exportieren' : 'Export Data'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Lade alle deine Analyse-Daten als CSV herunter'
                  : 'Download all your analysis data as CSV'}
              </p>
            </div>
            <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
              {isGerman ? 'Exportieren' : 'Export'}
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">
                {isGerman ? 'Account löschen' : 'Delete Account'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isGerman 
                  ? 'Lösche deinen Account und alle zugehörigen Daten'
                  : 'Delete your account and all associated data'}
              </p>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> {isGerman ? 'Löschen' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isGerman ? 'Speichern...' : 'Saving...'}
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              {isGerman ? 'Gespeichert' : 'Saved'}
            </>
          ) : (
            isGerman ? 'Einstellungen speichern' : 'Save Settings'
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
