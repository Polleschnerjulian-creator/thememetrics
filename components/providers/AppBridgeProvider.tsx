'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Base URL for API requests — must be absolute for embedded apps
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.thememetrics.de';

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
    // Silently fail
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
    // Silently fail
  }

  return null;
}

// Convert relative URL to absolute
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Remove leading slash if present
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const tokenCacheRef = useRef<{ token: string; expiry: number } | null>(null);
  const appBridgeFoundRef = useRef(false);

  useEffect(() => {
    // Check if we're in an iframe (embedded in Shopify Admin)
    const inIframe = typeof window !== 'undefined' && window !== window.parent;
    setIsEmbedded(inIframe);

    // Get shop domain
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopDomain();
    if (detectedShop) {
      setShop(detectedShop);
    }

    // Check if App Bridge is ready
    const checkReady = () => {
      const shopify = (window as any).shopify;
      if (shopify) {
        if (typeof shopify.idToken === 'function' || typeof shopify.getIdToken === 'function') {
          appBridgeFoundRef.current = true;
          setIsReady(true);
          return true;
        }
      }
      return false;
    };

    // Check immediately
    if (checkReady()) return;

    // Listen for App Bridge ready event
    const onAppBridgeReady = () => {
      if (checkReady()) {
        window.removeEventListener('load', onAppBridgeReady);
      }
    };
    window.addEventListener('load', onAppBridgeReady);

    // Poll for App Bridge — up to 15 seconds
    let attempts = 0;
    const maxAttempts = 150;

    const interval = setInterval(() => {
      attempts++;
      if (checkReady()) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        // App Bridge never loaded. Set ready anyway so app doesn't hang.
        // In non-embedded mode this is expected. In embedded mode, auth will fail.
        if (!inIframe) {
          setIsReady(true);
        } else {
          // Last resort: set ready and let the 401 trigger a re-auth
          console.error('[AppBridge] Not found after 15s in embedded mode. Auth will fail.');
          setIsReady(true);
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', onAppBridgeReady);
    };
  }, [searchParams]);

  // Get session token from App Bridge with caching
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    // Check cache first (tokens are valid for a short time)
    const now = Date.now();
    if (tokenCacheRef.current && tokenCacheRef.current.expiry > now) {
      return tokenCacheRef.current.token;
    }

    const shopifyGlobal = (window as any).shopify;

    if (!shopifyGlobal) {
      return null;
    }

    // Try new App Bridge idToken() method
    if (typeof shopifyGlobal.idToken === 'function') {
      try {
        const token = await shopifyGlobal.idToken();
        if (token) {
          // Cache token for 50 seconds (tokens typically valid for 60s)
          tokenCacheRef.current = { token, expiry: now + 50000 };
          return token;
        }
      } catch (error) {
        // Token retrieval failed, try fallback
      }
    }

    // Try legacy getIdToken() method
    if (typeof shopifyGlobal.getIdToken === 'function') {
      try {
        const token = await shopifyGlobal.getIdToken();
        if (token) {
          tokenCacheRef.current = { token, expiry: now + 50000 };
          return token;
        }
      } catch (error) {
        // Token retrieval failed
      }
    }

    return null;
  }, []);

  // Authenticated fetch that includes session token and uses absolute URLs
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Convert to absolute URL for embedded apps
    const absoluteUrl = toAbsoluteUrl(url);

    const token = await getSessionToken();

    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add shop header from state or try to detect again
    const currentShop = shop || getShopDomain();
    if (currentShop) {
      headers.set('X-Shop-Domain', currentShop);
    }

    // Important: Set content-type for JSON requests
    if (options.body && typeof options.body === 'string') {
      try {
        JSON.parse(options.body);
        headers.set('Content-Type', 'application/json');
      } catch (e) {
        // Not JSON, skip
      }
    }

    return fetch(absoluteUrl, {
      ...options,
      headers,
      credentials: 'include', // Include cookies as fallback
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
