import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with thousand separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num);
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// Format milliseconds to readable time
export function formatLoadTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Delay utility for async operations
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get status color based on score
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

// Get status background color based on score
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

// Get severity color
export function getSeverityColor(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

// Get severity icon
export function getSeverityIcon(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse Shopify shop domain
export function parseShopDomain(input: string): string | null {
  // Handle full URLs
  if (input.includes('://')) {
    try {
      const url = new URL(input);
      input = url.hostname;
    } catch {
      return null;
    }
  }
  
  // Clean up the domain
  input = input.toLowerCase().trim();
  
  // Add .myshopify.com if needed
  if (!input.includes('.myshopify.com')) {
    input = `${input}.myshopify.com`;
  }
  
  // Validate format
  const shopRegex = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(input)) {
    return null;
  }
  
  return input;
}

// Cookie utilities
export const cookies = {
  set(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },
  
  get(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  },
  
  delete(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  },
};
