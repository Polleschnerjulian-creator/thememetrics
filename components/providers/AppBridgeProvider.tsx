'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
  const shop = searchParams.get('shop');
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [appBridgeReady, setAppBridgeReady] = useState(false);

  useEffect(() => {
    // Check if we're in an iframe (embedded in Shopify Admin)
    const inIframe = typeof window !== 'undefined' && window !== window.parent;
    setIsEmbedded(inIframe);
    
    // Check if App Bridge is ready
    const checkReady = () => {
      const shopify = (window as any).shopify;
      if (shopify && typeof shopify.idToken === 'function') {
        console.log('App Bridge ready - window.shopify.idToken available');
        setAppBridgeReady(true);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkReady()) return;
    
    // Poll for App Bridge
    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval);
      }
    }, 100);
    
    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!(window as any).shopify?.idToken) {
        console.log('App Bridge not available after 5s');
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Get session token from App Bridge
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    const shopifyGlobal = (window as any).shopify;
    
    if (shopifyGlobal && typeof shopifyGlobal.idToken === 'function') {
      try {
        const token = await shopifyGlobal.idToken();
        console.log('Session token retrieved successfully');
        return token;
      } catch (error) {
        console.error('Failed to get session token:', error);
        return null;
      }
    }
    
    console.log('window.shopify.idToken not available');
    return null;
  }, []);

  // Authenticated fetch that includes session token
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getSessionToken();
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('Adding Authorization header to request');
    } else {
      console.log('No session token available for request');
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

  return (
    <AppBridgeContext.Provider value={contextValue}>
      {children}
    </AppBridgeContext.Provider>
  );
}
