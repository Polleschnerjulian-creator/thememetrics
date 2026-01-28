/**
 * Jest Test Setup
 *
 * This file runs before each test suite and sets up the testing environment.
 */

// Mock environment variables for testing
process.env.SHOPIFY_API_KEY = 'test-api-key';
process.env.SHOPIFY_API_SECRET = 'test-api-secret';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.PAGESPEED_API_KEY = 'test-pagespeed-key';

// Extend Jest matchers
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
export const mockShopDomain = 'test-shop.myshopify.com';
export const mockAccessToken = 'shpat_test_token_12345';
export const mockStoreId = 1;

// Helper to create mock request objects
export function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  url?: string;
}): Request {
  const { method = 'GET', headers = {}, body, url = 'http://localhost:3000' } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper to create mock NextRequest-like objects
export function createMockNextRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
  body?: any;
}) {
  const { method = 'GET', headers = {}, searchParams = {}, body } = options;

  const url = new URL('http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    method,
    headers: new Headers(headers),
    nextUrl: url,
    url: url.toString(),
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
