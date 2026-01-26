'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Script from 'next/script';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');
  const [appBridgeReady, setAppBridgeReady] = useState(false);

  useEffect(() => {
    // Check if we're running inside Shopify Admin (embedded)
    const isEmbedded = window !== window.parent || Boolean(host);
    
    if (isEmbedded && host && (window as unknown as { shopify?: unknown }).shopify) {
      // App Bridge is loaded via CDN script
      setAppBridgeReady(true);
    }
  }, [host]);

  // If we have a host parameter, we're embedded in Shopify Admin
  // Load App Bridge from Shopify CDN (required for embedded app checks)
  if (host) {
    return (
      <>
        {/* Load App Bridge from Shopify CDN - REQUIRED for embedded app verification */}
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log('Shopify App Bridge loaded from CDN');
            setAppBridgeReady(true);
          }}
        />
        <Script
          id="shopify-app-bridge-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (window.shopify && window.shopify.createApp) {
                window.__SHOPIFY_APP_BRIDGE__ = window.shopify.createApp({
                  apiKey: '${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ''}',
                  host: '${host}',
                });
                console.log('Shopify App Bridge initialized');
              }
            `,
          }}
        />
        {children}
      </>
    );
  }

  // Not embedded - render children directly
  return <>{children}</>;
}
