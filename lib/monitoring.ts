/**
 * Sentry Error Monitoring für ThemeMetrics
 * 
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Add SENTRY_DSN to environment variables
 * 3. Run: npx @sentry/wizard@latest -i nextjs
 */

// This is a lightweight error tracking implementation
// For production, use the full Sentry SDK

interface ErrorContext {
  user?: {
    id?: string;
    shop?: string;
    plan?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  context?: string; // Shorthand for extra.context
}

interface CapturedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
}

// In-memory error store (for development/preview)
// In production, these would be sent to Sentry
const errorStore: CapturedError[] = [];
const MAX_STORED_ERRORS = 100;

/**
 * Initialize error monitoring
 */
export function initErrorMonitoring() {
  // Sentry DSN check - no console output in production
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn && process.env.NODE_ENV === 'development') {
    // Only log in development
  }
}

/**
 * Capture an error
 * @param error - The error to capture
 * @param contextOrMessage - Either an ErrorContext object or a simple string message
 */
export function captureError(
  error: unknown,
  contextOrMessage: ErrorContext | string = {}
): void {
  // Handle unknown error type from catch blocks
  const errorObj = error instanceof Error
    ? error
    : typeof error === 'string'
      ? new Error(error)
      : new Error(String(error));

  // Handle string message as context
  const context: ErrorContext = typeof contextOrMessage === 'string'
    ? { extra: { message: contextOrMessage } }
    : contextOrMessage;
  
  const captured: CapturedError = {
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    timestamp: new Date().toISOString(),
    level: 'error',
  };

  // Store locally (would send to Sentry in production)
  storeError(captured);
  
  // If Sentry is configured, send there
  sendToSentry(captured);
}

/**
 * Capture a warning
 */
export function captureWarning(
  message: string,
  context: ErrorContext = {}
): void {
  const captured: CapturedError = {
    message,
    context,
    timestamp: new Date().toISOString(),
    level: 'warning',
  };

  storeError(captured);
}

/**
 * Capture an info message
 */
export function captureMessage(
  message: string,
  context: ErrorContext = {}
): void {
  const captured: CapturedError = {
    message,
    context,
    timestamp: new Date().toISOString(),
    level: 'info',
  };

  storeError(captured);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(_user: ErrorContext['user']): void {
  // In production, this would set Sentry user context
  // Currently a no-op until Sentry is configured
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  _message: string,
  _category: string = 'default',
  _data?: Record<string, any>
): void {
  // In production, this would add Sentry breadcrumb
  // Currently a no-op until Sentry is configured
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * API route error handler
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext = {}
): Response {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  captureError(errorObj, context);
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
    : errorObj.message;
  
  return new Response(
    JSON.stringify({
      error: 'internal_error',
      message,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ============================================
// INTERNAL HELPERS
// ============================================

function storeError(error: CapturedError): void {
  errorStore.push(error);
  
  // Keep only last N errors
  while (errorStore.length > MAX_STORED_ERRORS) {
    errorStore.shift();
  }
}

function sendToSentry(error: CapturedError): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  
  // In production, use the actual Sentry SDK
  // This is a placeholder for the concept
  
  // Example with Sentry SDK:
  // Sentry.captureException(new Error(error.message), {
  //   user: error.context.user,
  //   tags: error.context.tags,
  //   extra: error.context.extra,
  // });
}

/**
 * Get recent errors (for debugging/admin)
 */
export function getRecentErrors(): CapturedError[] {
  return [...errorStore].reverse();
}

/**
 * Clear error store
 */
export function clearErrors(): void {
  errorStore.length = 0;
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  tags?: Record<string, string>;
}

const performanceMetrics: PerformanceMetric[] = [];

/**
 * Start a performance measurement
 */
export function startMeasurement(name: string): () => void {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    
    performanceMetrics.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 100 metrics
    while (performanceMetrics.length > 100) {
      performanceMetrics.shift();
    }
    
    // Log slow operations
    if (duration > 5000) {
      captureWarning(`Slow operation: ${name} took ${duration.toFixed(0)}ms`);
    }
  };
}

/**
 * Measure async function performance
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const end = startMeasurement(name);
  try {
    return await fn();
  } finally {
    end();
  }
}

/**
 * Get recent performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...performanceMetrics];
}
