'use client';

import { useSearchParams } from 'next/navigation';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');

  // For now, just pass through - App Bridge will be initialized client-side
  // when accessed from Shopify Admin
  return <>{children}</>;
}
