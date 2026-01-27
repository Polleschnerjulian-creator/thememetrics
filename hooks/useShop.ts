'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppBridge } from '@/components/providers/AppBridgeProvider';

function getShopFromUrl(): string {
  if (typeof window === 'undefined') return '';
  
  const params = new URLSearchParams(window.location.search);
  const shopParam = params.get('shop');
  if (shopParam) return shopParam;
  
  const hostname = window.location.hostname;
  if (hostname === 'admin.shopify.com') {
    const pathParts = window.location.pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
      return `${pathParts[storeIndex + 1]}.myshopify.com`;
    }
  }
  
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
  
  return '';
}

export function useShop(fallback: string = '') {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const shopFromParams = searchParams.get('shop');
    const detectedShop = shopFromParams || getShopFromUrl() || fallback;
    setShop(detectedShop);
    setIsLoading(false);
  }, [searchParams, fallback]);

  return { shop, isLoading };
}

export function useAnalysisData(shop: string) {
  const { authenticatedFetch } = useAppBridge();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!shop) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`/api/themes/data?shop=${shop}`);
      if (response.ok) {
        const result = await response.json();
        if (result.hasData) {
          setData(result);
        }
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shop, authenticatedFetch]);

  useEffect(() => {
    if (shop) fetchData();
  }, [shop, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useHistoryData(shop: string) {
  const { authenticatedFetch } = useAppBridge();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!shop) return;
      
      try {
        const response = await authenticatedFetch(`/api/themes/history?shop=${shop}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (shop) fetchHistory();
  }, [shop, authenticatedFetch]);

  return { data, loading };
}
