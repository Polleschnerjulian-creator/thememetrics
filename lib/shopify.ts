// Shopify API version - hardcoded to avoid importing @shopify/shopify-api on client
const SHOPIFY_API_VERSION = '2025-01';

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
      scopes: (process.env.SHOPIFY_SCOPES || 'read_themes').split(','),
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
  const scopes = process.env.SHOPIFY_SCOPES || 'read_themes';
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

// ---- GraphQL types for theme queries ----

export interface GqlTheme {
  id: string;         // GID e.g. "gid://shopify/Theme/123"
  name: string;
  role: 'MAIN' | 'UNPUBLISHED' | 'DEVELOPMENT' | string;
}

export interface GqlThemeFile {
  filename: string;
  size: number | null;
  body: { content: string } | null; // null for binary files / when not requested
}

// GraphQL client for Shopify Admin API
export function createShopifyGraphqlClient(shop: string, accessToken: string) {
  const endpoint = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  return {
    async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Shopify GraphQL HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();

      if (result.errors?.length) {
        throw new Error(`Shopify GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data as T;
    },
  };
}

// Extract numeric ID from a Shopify GID
export function gidToId(gid: string): string {
  return gid.split('/').pop() ?? gid;
}

// Fetch all themes for a shop
export async function fetchThemes(shop: string, accessToken: string): Promise<GqlTheme[]> {
  const client = createShopifyGraphqlClient(shop, accessToken);
  const data = await client.query<{
    themes: { nodes: GqlTheme[] };
  }>(`
    query {
      themes(first: 20) {
        nodes {
          id
          name
          role
        }
      }
    }
  `);
  return data.themes.nodes;
}

// Fetch filenames (no content) for a theme – handles pagination up to 500 files
export async function fetchThemeFileList(
  shop: string,
  accessToken: string,
  themeGid: string
): Promise<Array<{ filename: string; size: number | null }>> {
  const client = createShopifyGraphqlClient(shop, accessToken);
  const files: Array<{ filename: string; size: number | null }> = [];
  let cursor: string | null = null;

  type FileListResponse = {
    theme: {
      files: {
        nodes: Array<{ filename: string; size: number | null }>;
        pageInfo: { hasNextPage: boolean; endCursor: string };
      };
    } | null;
  };

  while (true) {
    const data: FileListResponse = await client.query<FileListResponse>(`
      query GetThemeFiles($themeId: ID!, $after: String) {
        theme(id: $themeId) {
          files(first: 250, after: $after) {
            nodes {
              filename
              size
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `, { themeId: themeGid, after: cursor });

    const themeData = data.theme;
    if (!themeData) break;

    files.push(...themeData.files.nodes);
    const pageInfo: { hasNextPage: boolean; endCursor: string } = themeData.files.pageInfo;
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    if (!cursor) break;
  }

  return files;
}

// Fetch content for specific theme files (up to 25 at a time)
export async function fetchThemeFileContents(
  shop: string,
  accessToken: string,
  themeGid: string,
  filenames: string[]
): Promise<GqlThemeFile[]> {
  if (filenames.length === 0) return [];

  const client = createShopifyGraphqlClient(shop, accessToken);
  const data = await client.query<{
    theme: {
      files: { nodes: Array<{ filename: string; size: number | null; body: { content: string } | null }> };
    } | null;
  }>(`
    query GetThemeFileContents($themeId: ID!, $filenames: [String!]!) {
      theme(id: $themeId) {
        files(filenames: $filenames, first: 25) {
          nodes {
            filename
            size
            body {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }
      }
    }
  `, { themeId: themeGid, filenames });

  return data.theme?.files.nodes ?? [];
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
