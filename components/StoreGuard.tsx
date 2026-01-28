'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';

interface StoreGuardProps {
  children: React.ReactNode;
}

export function StoreGuard({ children }: StoreGuardProps) {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');
  const [status, setStatus] = useState<'loading' | 'ok' | 'needs_oauth' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');

  useEffect(() => {
    async function checkStore() {
      if (!shop) {
        setStatus('error');
        setErrorMessage('Kein Shop Parameter gefunden');
        return;
      }

      try {
        // Check if store exists via subscription endpoint
        const res = await fetch(`/api/subscription?shop=${encodeURIComponent(shop)}`);

        if (res.status === 404) {
          // Store not found - need OAuth

          // Build OAuth URL
          const params = new URLSearchParams();
          params.set('shop', shop);
          if (host) params.set('host', host);

          const installUrl = `${window.location.origin}/api/auth/install?${params.toString()}`;
          setOauthUrl(installUrl);
          setStatus('needs_oauth');

          // Try to redirect - this works if we can access parent frame
          try {
            // For embedded apps, we need to redirect the top frame
            if (window.top && window.top !== window.self) {
              // Try App Bridge style redirect via postMessage
              window.top.postMessage(JSON.stringify({
                type: 'redirect',
                url: installUrl
              }), '*');

              // Also try direct redirect (might fail due to cross-origin)
              setTimeout(() => {
                try {
                  window.top!.location.href = installUrl;
                } catch {
                  // Cross-origin blocked - show button instead (expected behavior)
                }
              }, 100);
            } else {
              window.location.href = installUrl;
            }
          } catch {
            // Can't redirect automatically - show button (expected behavior)
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        setStatus('ok');
      } catch (error) {
        console.error('[StoreGuard] Error:', error);
        setStatus('error');
        setErrorMessage(String(error));
      }
    }

    checkStore();
  }, [shop, host]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Lade...</p>
      </div>
    );
  }

  if (status === 'needs_oauth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Verbindung erforderlich</h2>
          <p className="text-muted-foreground mb-6">
            ThemeMetrics benötigt Zugriff auf deinen Shop.
            Klicke auf den Button um die Verbindung herzustellen.
          </p>
          <a
            href={oauthUrl}
            target="_top"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 font-medium transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Mit Shopify verbinden
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            Du wirst zu Shopify weitergeleitet um den Zugriff zu bestätigen.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Verbindungsfehler</h2>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
