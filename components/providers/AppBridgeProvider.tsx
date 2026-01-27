'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AppBridgeContextType {
  isEmbedded: boolean;
  isReady: boolean;
  shop: string | null;
  getSessionToken: () => Promise<string | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AppBridgeContext = createContext<AppBridgeContextType>({
  isEmbedded: false,
  isReady: false,
  shop: null,
  getSessionToken: async () => null,
  authenticatedFetch: async (url, options) => fetch(url, options),
});

export const useAppBridge = () => useContext(AppBridgeContext);

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

// Helper to get shop from various sources
function getShopDomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 1. From URL params
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get('shop');
  if (shopParam) return shopParam;
  
  // 2. From Shopify Admin URL path (when embedded)
  try {
    const ancestorOrigins = window.location.ancestorOrigins;
    if (ancestorOrigins && ancestorOrigins.length > 0) {
      const parentUrl = new URL(ancestorOrigins[0]);
      const pathParts = parentUrl.pathname.split('/');
      const storeIndex = pathParts.indexOf('store');
      if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        return `${pathParts[storeIndex + 1]}.myshopify.com`;
      }
    }
  } catch (e) {
    console.log('Could not get shop from ancestorOrigins');
  }
  
  // 3. From referrer
  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.hostname === 'admin.shopify.com') {
        const pathParts = refUrl.pathname.split('/');
        const storeIndex = pathParts.indexOf('store');
        if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
          return `${pathParts[storeIndex + 1]}.myshopify.com`;
        }
      }
    }
  } catch (e) {
    console.log('Could not get shop from referrer');
  }
  
  return null;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we're in an iframe (embedded in Shopify Admin)
    const inIframe = typeof window !== 'undefined' && window !== window.parent;
    setIsEmbedded(inIframe);
    
    // Get shop domain
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopDomain();
    if (detectedShop) {
      setShop(detectedShop);
      console.log('Shop detected:', detectedShop);
    } else {
      console.log('No shop detected');
    }
    
    // Check if App Bridge is ready
    const checkReady = () => {
      const shopify = (window as any).shopify;
      if (shopify && typeof shopify.idToken === 'function') {
        console.log('App Bridge ready - window.shopify.idToken available');
        setIsReady(true);
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
    
    // Timeout after 5 seconds - set ready anyway to allow fallback
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.log('App Bridge timeout - proceeding without session tokens');
      setIsReady(true);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [searchParams]);

  // Get session token from App Bridge
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    const shopifyGlobal = (window as any).shopify;
    
    if (shopifyGlobal && typeof shopifyGlobal.idToken === 'function') {
      try {
        const token = await shopifyGlobal.idToken();
        console.log('Session token retrieved');
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
    console.log('authenticatedFetch called:', url);
    
    const token = await getSessionToken();
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('Added Authorization header');
    }
    
    // Add shop header from state or try to detect again
    const currentShop = shop || getShopDomain();
    if (currentShop) {
      headers.set('X-Shop-Domain', currentShop);
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  }, [getSessionToken, shop]);

  const contextValue: AppBridgeContextType = {
    isEmbedded,
    isReady,
    shop,
    getSessionToken,
    authenticatedFetch,
  };

  return (
    <AppBridgeContext.Provider value={contextValue}>
      {children}
    </AppBridgeContext.Provider>
  );
}
