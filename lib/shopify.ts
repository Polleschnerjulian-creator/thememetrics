// Shopify API version - hardcoded to avoid importing @shopify/shopify-api on client
const SHOPIFY_API_VERSION = '2024-10';

// Only import and initialize on server side
let shopify: any = null;

// Server-side only initialization
function getShopifyInstance() {
  if (typeof window !== 'undefined') {
    throw new Error('Shopify API can only be used on the server');
  }
  
  if (!shopify) {
    const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
    require('@shopify/shopify-api/adapters/node');
    
    shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
      scopes: (process.env.SHOPIFY_SCOPES || 'read_themes,read_products').split(','),
      hostName: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/https?:\/\//, ''),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false,
    });
  }
  
  return shopify;
}

export { getShopifyInstance as shopify };

// Generate OAuth authorization URL
export function generateAuthUrl(shop: string, redirectUri: string, state: string): string {
  const scopes = process.env.SHOPIFY_SCOPES || 'read_themes,read_products';
  const apiKey = process.env.SHOPIFY_API_KEY;
  
  const params = new URLSearchParams({
    client_id: apiKey || '',
    scope: scopes,
    redirect_uri: redirectUri,
    state: state,
  });
  
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ accessToken: string; scope: string }> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    scope: data.scope,
  };
}

// Create a REST client for a specific shop
export function createShopifyClient(shop: string, accessToken: string) {
  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}${path}`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Shopify API error: ${error}`);
      }

      return response.json();
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}${path}`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Shopify API error: ${error}`);
      }

      return response.json();
    },
  };
}

// Verify Shopify webhook HMAC
export function verifyWebhook(body: string, hmac: string): boolean {
  if (typeof window !== 'undefined') return false;
  const crypto = require('crypto');
  const secret = process.env.SHOPIFY_API_SECRET || '';
  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(generatedHmac)
  );
}

// Validate shop domain format
export function isValidShopDomain(shop: string): boolean {
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

// Generate random state for OAuth
export function generateState(): string {
  if (typeof window !== 'undefined') return '';
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}
