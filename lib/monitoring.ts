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

// ============================================
// BUSINESS METRICS
// ============================================

interface BusinessMetric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

const businessMetrics: BusinessMetric[] = [];

/**
 * Track a business metric
 */
export function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  businessMetrics.push({
    name,
    value,
    timestamp: new Date().toISOString(),
    tags,
  });

  // Keep only last 1000 metrics
  while (businessMetrics.length > 1000) {
    businessMetrics.shift();
  }
}

/**
 * Get business metrics
 */
export function getBusinessMetrics(): BusinessMetric[] {
  return [...businessMetrics];
}

// Predefined metric names for consistency
export const METRICS = {
  // User Activity
  ANALYSIS_STARTED: 'analysis.started',
  ANALYSIS_COMPLETED: 'analysis.completed',
  ANALYSIS_FAILED: 'analysis.failed',

  // Billing
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription.downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',

  // Performance
  API_LATENCY: 'api.latency',
  DB_QUERY_TIME: 'db.query_time',
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',

  // Rate Limiting
  RATE_LIMIT_HIT: 'rate_limit.hit',
  USAGE_LIMIT_HIT: 'usage_limit.hit',
} as const;

// ============================================
// ALERT THRESHOLDS
// ============================================

interface AlertThreshold {
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  value: number;
  severity: 'warning' | 'critical';
  message: string;
}

const alertThresholds: AlertThreshold[] = [
  {
    metric: METRICS.API_LATENCY,
    condition: 'gt',
    value: 5000, // 5 seconds
    severity: 'warning',
    message: 'API latency exceeds 5 seconds',
  },
  {
    metric: METRICS.API_LATENCY,
    condition: 'gt',
    value: 10000, // 10 seconds
    severity: 'critical',
    message: 'API latency exceeds 10 seconds',
  },
  {
    metric: METRICS.ANALYSIS_FAILED,
    condition: 'gt',
    value: 5, // 5 failures in a row
    severity: 'critical',
    message: 'Multiple analysis failures detected',
  },
];

/**
 * Check if a metric value triggers an alert
 * Returns the most severe matching threshold
 */
export function checkAlertThresholds(
  metric: string,
  value: number
): AlertThreshold | null {
  let mostSevere: AlertThreshold | null = null;

  for (const threshold of alertThresholds) {
    if (threshold.metric !== metric) continue;

    let triggered = false;
    switch (threshold.condition) {
      case 'gt':
        triggered = value > threshold.value;
        break;
      case 'lt':
        triggered = value < threshold.value;
        break;
      case 'eq':
        triggered = value === threshold.value;
        break;
    }

    if (triggered) {
      // Keep the most severe threshold
      if (!mostSevere || threshold.severity === 'critical') {
        mostSevere = threshold;
      }
    }
  }

  if (mostSevere) {
    // Capture as warning or error
    if (mostSevere.severity === 'critical') {
      captureError(new Error(mostSevere.message), {
        tags: { metric, severity: 'critical' },
        extra: { value, threshold: mostSevere.value },
      });
    } else {
      captureWarning(mostSevere.message, {
        tags: { metric, severity: 'warning' },
        extra: { value, threshold: mostSevere.value },
      });
    }
  }

  return mostSevere;
}

// ============================================
// HEALTH CHECK
// ============================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: boolean;
    cache: boolean;
    shopify: boolean;
  };
  metrics: {
    errorRate: number;
    avgLatency: number;
    uptime: number;
  };
  timestamp: string;
}

// Track startup time for uptime calculation
const startupTime = Date.now();

/**
 * Get system health status
 */
export function getHealthStatus(): HealthStatus {
  // Calculate error rate from recent errors
  const recentErrors = errorStore.filter(e => {
    const timestamp = new Date(e.timestamp).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return timestamp > fiveMinutesAgo;
  });

  const errorRate = recentErrors.length;

  // Calculate average latency from recent metrics
  const recentMetrics = performanceMetrics.filter(m => {
    const timestamp = new Date(m.timestamp).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return timestamp > fiveMinutesAgo;
  });

  const avgLatency = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    : 0;

  // Calculate uptime in hours
  const uptime = (Date.now() - startupTime) / (1000 * 60 * 60);

  // Determine overall status
  let status: HealthStatus['status'] = 'healthy';
  if (errorRate > 10 || avgLatency > 5000) {
    status = 'unhealthy';
  } else if (errorRate > 3 || avgLatency > 2000) {
    status = 'degraded';
  }

  return {
    status,
    components: {
      database: true, // Would check actual connection
      cache: true,    // Would check Redis
      shopify: true,  // Would check API availability
    },
    metrics: {
      errorRate,
      avgLatency: Math.round(avgLatency),
      uptime: Math.round(uptime * 100) / 100,
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// METRIC AGGREGATION
// ============================================

interface AggregatedMetrics {
  period: string;
  totalAnalyses: number;
  successRate: number;
  avgScore: number;
  topErrors: { message: string; count: number }[];
}

/**
 * Get aggregated metrics for a time period
 */
export function getAggregatedMetrics(periodMinutes: number = 60): AggregatedMetrics {
  const cutoff = Date.now() - periodMinutes * 60 * 1000;

  // Filter recent business metrics
  const recentMetrics = businessMetrics.filter(m => {
    return new Date(m.timestamp).getTime() > cutoff;
  });

  // Count analyses
  const totalAnalyses = recentMetrics.filter(
    m => m.name === METRICS.ANALYSIS_COMPLETED || m.name === METRICS.ANALYSIS_FAILED
  ).length;

  const successfulAnalyses = recentMetrics.filter(
    m => m.name === METRICS.ANALYSIS_COMPLETED
  ).length;

  const successRate = totalAnalyses > 0
    ? Math.round((successfulAnalyses / totalAnalyses) * 100)
    : 100;

  // Calculate average score from completed analyses
  const scoreMetrics = recentMetrics.filter(
    m => m.name === METRICS.ANALYSIS_COMPLETED && m.value > 0
  );
  const avgScore = scoreMetrics.length > 0
    ? Math.round(scoreMetrics.reduce((sum, m) => sum + m.value, 0) / scoreMetrics.length)
    : 0;

  // Group recent errors by message
  const recentErrors = errorStore.filter(e => {
    return new Date(e.timestamp).getTime() > cutoff;
  });

  const errorCounts: Record<string, number> = {};
  recentErrors.forEach(e => {
    const key = e.message.substring(0, 100);
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  });

  const topErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    period: `last ${periodMinutes} minutes`,
    totalAnalyses,
    successRate,
    avgScore,
    topErrors,
  };
}
