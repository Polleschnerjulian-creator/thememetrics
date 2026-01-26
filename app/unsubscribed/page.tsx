'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Erfolgreich abgemeldet
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Du wirst keine weiteren E-Mails mehr von uns erhalten. 
                Falls du es dir anders überlegst, kannst du dich jederzeit in den Einstellungen wieder anmelden.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Tipp:</strong> In den Dashboard-Einstellungen kannst du auch nur bestimmte E-Mail-Typen abbestellen 
                  (z.B. nur Marketing, aber weiterhin wichtige Alerts).
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Etwas ist schiefgelaufen
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Die Abmeldung konnte nicht abgeschlossen werden. 
                Bitte versuche es später erneut oder kontaktiere unseren Support.
              </p>
            </>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zur Startseite
            </Link>
            
            <a
              href="mailto:support@thememetrics.de"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Support kontaktieren
            </a>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          © 2026 ThemeMetrics. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribedContent />
    </Suspense>
  );
}
