import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { AppBridgeProvider } from '@/components/providers/AppBridgeProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ThemeMetrics - Shopify Theme Performance Analytics',
  description: 'Sieh in 5 Minuten welche Theme-Sections deine Conversion kosten – ohne Setup, ohne Code, ohne Rätselraten.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* App Bridge MUST be the first script, without async/defer */}
        {/* The API key is required for App Bridge to initialize properly */}
        <script 
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
        ></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Lädt...</div>}>
              <AppBridgeProvider>
                {children}
              </AppBridgeProvider>
            </Suspense>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
