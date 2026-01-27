'use client';

import { useCallback } from 'react';
import { useAppBridge } from '@/components/providers/AppBridgeProvider';
import { useSearchParams } from 'next/navigation';

/**
 * Hook that provides an authenticated fetch function.
 * Uses session tokens when running embedded in Shopify Admin,
 * falls back to regular fetch with shop header for non-embedded contexts.
 */
export function useAuthenticatedFetch() {
  const { authenticatedFetch, isEmbedded, getSessionToken } = useAppBridge();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Always use authenticatedFetch from AppBridge context
    // It will automatically include session token if available
    return authenticatedFetch(url, options);
  }, [authenticatedFetch]);

  return {
    authFetch,
    isEmbedded,
    shop,
  };
}

/**
 * Hook for fetching data with automatic authentication
 */
export function useFetchWithAuth() {
  const { authFetch, shop } = useAuthenticatedFetch();

  const fetchData = useCallback(async <T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      // Add shop parameter to URL if not already present
      const url = new URL(endpoint, window.location.origin);
      if (shop && !url.searchParams.has('shop')) {
        url.searchParams.set('shop', shop);
      }

      const response = await authFetch(url.toString(), options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          data: null, 
          error: errorData.error || `Request failed: ${response.status}` 
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      console.error('Fetch error:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Network error' 
      };
    }
  }, [authFetch, shop]);

  return { fetchData };
}
