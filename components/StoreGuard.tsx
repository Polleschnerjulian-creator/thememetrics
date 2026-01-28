'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface StoreGuardProps {
  children: React.ReactNode;
}

export function StoreGuard({ children }: StoreGuardProps) {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');
  const [status, setStatus] = useState<'loading' | 'ok' | 'needs_oauth' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

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
          console.log('[StoreGuard] Store not found, redirecting to OAuth...');
          setStatus('needs_oauth');

          // Build OAuth URL
          const params = new URLSearchParams();
          params.set('shop', shop);
          if (host) params.set('host', host);

          // Redirect to install route to trigger OAuth
          window.location.href = `/api/auth/install?${params.toString()}`;
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

  if (status === 'loading' || status === 'needs_oauth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {status === 'needs_oauth' ? 'Verbinde mit Shopify...' : 'Lade...'}
        </p>
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
            onClick={() => {
              if (shop) {
                const params = new URLSearchParams();
                params.set('shop', shop);
                if (host) params.set('host', host);
                window.location.href = `/api/auth/install?${params.toString()}`;
              }
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Erneut verbinden
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
