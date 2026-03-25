'use client';

import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

/**
 * Loads the Shopify App Bridge script when in embedded context.
 * Uses next/script with beforeInteractive strategy for earliest possible loading.
 */
export function AppBridgeScript({ apiKey }: { apiKey: string }) {
  const searchParams = useSearchParams();

  // Only load in embedded context (shop param present or in iframe)
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  // If no shop param, don't load App Bridge (public pages)
  if (!shop && !host) return null;
  if (!apiKey) return null;

  return (
    <Script
      src={`https://cdn.shopify.com/shopifycloud/app-bridge.js?apiKey=${apiKey}`}
      strategy="beforeInteractive"
    />
  );
}
