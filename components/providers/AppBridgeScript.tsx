'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Only loads the Shopify App Bridge script when in embedded context
 * (i.e., when a 'shop' query parameter is present or in an iframe).
 * This prevents loading external scripts for public landing page visitors.
 */
export function AppBridgeScript({ apiKey }: { apiKey: string }) {
  const searchParams = useSearchParams();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const shop = searchParams.get('shop');
    const inIframe = typeof window !== 'undefined' && window !== window.parent;

    if ((shop || inIframe) && apiKey) {
      setShouldLoad(true);
    }
  }, [searchParams, apiKey]);

  useEffect(() => {
    if (!shouldLoad) return;

    // Check if script already loaded
    const existing = document.querySelector('script[src*="app-bridge.js"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
    script.setAttribute('data-api-key', apiKey);
    document.head.prepend(script);
  }, [shouldLoad, apiKey]);

  return null;
}
