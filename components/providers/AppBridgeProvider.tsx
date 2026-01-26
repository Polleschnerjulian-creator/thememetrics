'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Script from 'next/script';

interface AppBridgeContextType {
  isEmbedded: boolean;
  getSessionToken: () => Promise<string | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AppBridgeContext = createContext<AppBridgeContextType>({
  isEmbedded: false,
  getSessionToken: async () => null,
  authenticatedFetch: async (url, options) => fetch(url, options),
});

export const useAppBridge = () => useContext(AppBridgeContext);

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');
  const [appBridgeReady, setAppBridgeReady] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check if we're running inside Shopify Admin (embedded)
    const embedded = typeof window !== 'undefined' && (window !== window.parent || Boolean(host));
    setIsEmbedded(embedded);
  }, [host]);

  // Get session token from App Bridge
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    const shopifyGlobal = (window as unknown as { shopify?: { idToken: () => Promise<string> } }).shopify;
    
    if (shopifyGlobal && typeof shopifyGlobal.idToken === 'function') {
      try {
        const token = await shopifyGlobal.idToken();
        return token;
      } catch (error) {
        console.error('Failed to get session token:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Authenticated fetch that includes session token
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getSessionToken();
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (shop) {
      headers.set('X-Shop-Domain', shop);
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  }, [getSessionToken, shop]);

  const contextValue: AppBridgeContextType = {
    isEmbedded,
    getSessionToken,
    authenticatedFetch,
  };

  // If we have a host parameter, we're embedded in Shopify Admin
  // Load App Bridge from Shopify CDN (required for embedded app checks)
  if (host) {
    return (
      <AppBridgeContext.Provider value={contextValue}>
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
      </AppBridgeContext.Provider>
    );
  }

  // Not embedded - render children directly
  return (
    <AppBridgeContext.Provider value={contextValue}>
      {children}
    </AppBridgeContext.Provider>
  );
}
