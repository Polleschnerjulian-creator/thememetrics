/**
 * Error Handling Tests
 */

describe('Error Handling', () => {
  describe('HTTP Status Codes', () => {
    const HTTP_STATUS = {
      OK: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_ERROR: 500,
    };

    interface ApiError {
      status: number;
      code: string;
      message: string;
    }

    function createErrorResponse(status: number, code: string, message: string): ApiError {
      return { status, code, message };
    }

    it('should create 400 error for bad request', () => {
      const error = createErrorResponse(400, 'BAD_REQUEST', 'Invalid parameters');
      expect(error.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should create 401 error for unauthorized', () => {
      const error = createErrorResponse(401, 'UNAUTHORIZED', 'Missing authentication');
      expect(error.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should create 404 error for not found', () => {
      const error = createErrorResponse(404, 'NOT_FOUND', 'Resource not found');
      expect(error.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should create 429 error for rate limit', () => {
      const error = createErrorResponse(429, 'RATE_LIMITED', 'Too many requests');
      expect(error.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    });

    it('should create 500 error for internal error', () => {
      const error = createErrorResponse(500, 'INTERNAL_ERROR', 'Something went wrong');
      expect(error.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
    });
  });

  describe('Error Message Localization', () => {
    const ERROR_MESSAGES: Record<string, { de: string; en: string }> = {
      STORE_NOT_FOUND: {
        de: 'Store nicht gefunden',
        en: 'Store not found',
      },
      PLAN_LIMIT_REACHED: {
        de: 'Limit erreicht. Bitte upgrade deinen Plan.',
        en: 'Limit reached. Please upgrade your plan.',
      },
      UNAUTHORIZED: {
        de: 'Nicht autorisiert',
        en: 'Unauthorized',
      },
      INVALID_SHOP: {
        de: 'Ungültiger Shop-Domain',
        en: 'Invalid shop domain',
      },
    };

    function getErrorMessage(code: string, locale: 'de' | 'en'): string {
      return ERROR_MESSAGES[code]?.[locale] || `Unknown error: ${code}`;
    }

    it('should return German message', () => {
      expect(getErrorMessage('STORE_NOT_FOUND', 'de')).toBe('Store nicht gefunden');
    });

    it('should return English message', () => {
      expect(getErrorMessage('STORE_NOT_FOUND', 'en')).toBe('Store not found');
    });

    it('should handle unknown error codes', () => {
      const message = getErrorMessage('UNKNOWN_CODE', 'de');
      expect(message).toContain('Unknown error');
    });
  });

  describe('Retry Logic', () => {
    function shouldRetry(statusCode: number, attempt: number, maxAttempts: number): boolean {
      // Don't retry client errors (4xx) except 429
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return false;
      }

      // Retry server errors (5xx) and rate limits (429)
      if (attempt >= maxAttempts) {
        return false;
      }

      return statusCode >= 500 || statusCode === 429;
    }

    function getRetryDelay(attempt: number): number {
      // Exponential backoff: 1s, 2s, 4s, 8s...
      return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
    }

    it('should retry on 500 error', () => {
      expect(shouldRetry(500, 1, 3)).toBe(true);
    });

    it('should retry on 429 rate limit', () => {
      expect(shouldRetry(429, 1, 3)).toBe(true);
    });

    it('should not retry on 400 bad request', () => {
      expect(shouldRetry(400, 1, 3)).toBe(false);
    });

    it('should not retry on 401 unauthorized', () => {
      expect(shouldRetry(401, 1, 3)).toBe(false);
    });

    it('should not retry on 404 not found', () => {
      expect(shouldRetry(404, 1, 3)).toBe(false);
    });

    it('should stop after max attempts', () => {
      expect(shouldRetry(500, 3, 3)).toBe(false);
    });

    it('should use exponential backoff', () => {
      expect(getRetryDelay(1)).toBe(1000);
      expect(getRetryDelay(2)).toBe(2000);
      expect(getRetryDelay(3)).toBe(4000);
    });

    it('should cap retry delay at 30 seconds', () => {
      expect(getRetryDelay(10)).toBe(30000);
    });
  });

  describe('Input Validation Errors', () => {
    interface ValidationError {
      field: string;
      message: string;
    }

    function validateAnalysisRequest(params: {
      shop?: string;
      themeId?: number;
    }): ValidationError[] {
      const errors: ValidationError[] = [];

      if (!params.shop) {
        errors.push({ field: 'shop', message: 'Shop ist erforderlich' });
      } else if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(params.shop)) {
        errors.push({ field: 'shop', message: 'Ungültiger Shop-Domain' });
      }

      if (params.themeId !== undefined && params.themeId <= 0) {
        errors.push({ field: 'themeId', message: 'Theme ID muss positiv sein' });
      }

      return errors;
    }

    it('should validate missing shop', () => {
      const errors = validateAnalysisRequest({});
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('shop');
    });

    it('should validate invalid shop domain', () => {
      const errors = validateAnalysisRequest({ shop: 'invalid.com' });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Ungültiger');
    });

    it('should validate negative themeId', () => {
      const errors = validateAnalysisRequest({
        shop: 'test.myshopify.com',
        themeId: -1,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('themeId');
    });

    it('should pass valid request', () => {
      const errors = validateAnalysisRequest({
        shop: 'test.myshopify.com',
        themeId: 123,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('Database Error Handling', () => {
    type DbErrorCode = 'UNIQUE_VIOLATION' | 'FOREIGN_KEY' | 'CONNECTION_ERROR' | 'TIMEOUT';

    function handleDatabaseError(error: { code: DbErrorCode }): {
      status: number;
      userMessage: string;
      shouldLog: boolean;
    } {
      switch (error.code) {
        case 'UNIQUE_VIOLATION':
          return {
            status: 409,
            userMessage: 'Dieser Eintrag existiert bereits',
            shouldLog: false,
          };
        case 'FOREIGN_KEY':
          return {
            status: 400,
            userMessage: 'Referenzierter Eintrag nicht gefunden',
            shouldLog: false,
          };
        case 'CONNECTION_ERROR':
          return {
            status: 503,
            userMessage: 'Service vorübergehend nicht verfügbar',
            shouldLog: true,
          };
        case 'TIMEOUT':
          return {
            status: 504,
            userMessage: 'Anfrage hat zu lange gedauert',
            shouldLog: true,
          };
        default:
          return {
            status: 500,
            userMessage: 'Ein Fehler ist aufgetreten',
            shouldLog: true,
          };
      }
    }

    it('should handle unique violation as 409', () => {
      const result = handleDatabaseError({ code: 'UNIQUE_VIOLATION' });
      expect(result.status).toBe(409);
      expect(result.shouldLog).toBe(false);
    });

    it('should handle connection error as 503', () => {
      const result = handleDatabaseError({ code: 'CONNECTION_ERROR' });
      expect(result.status).toBe(503);
      expect(result.shouldLog).toBe(true);
    });

    it('should handle timeout as 504', () => {
      const result = handleDatabaseError({ code: 'TIMEOUT' });
      expect(result.status).toBe(504);
    });
  });

  describe('External API Error Handling', () => {
    function handleShopifyApiError(statusCode: number, body: string): {
      shouldRetry: boolean;
      message: string;
      internal: boolean;
    } {
      if (statusCode === 401) {
        return {
          shouldRetry: false,
          message: 'Shop-Authentifizierung fehlgeschlagen',
          internal: false,
        };
      }

      if (statusCode === 402) {
        return {
          shouldRetry: false,
          message: 'Shop hat unbezahlte Rechnungen',
          internal: false,
        };
      }

      if (statusCode === 403) {
        return {
          shouldRetry: false,
          message: 'App hat keine Berechtigung',
          internal: false,
        };
      }

      if (statusCode === 404) {
        return {
          shouldRetry: false,
          message: 'Ressource nicht gefunden',
          internal: false,
        };
      }

      if (statusCode === 429) {
        return {
          shouldRetry: true,
          message: 'Shopify Rate Limit erreicht',
          internal: true,
        };
      }

      if (statusCode >= 500) {
        return {
          shouldRetry: true,
          message: 'Shopify ist vorübergehend nicht erreichbar',
          internal: true,
        };
      }

      return {
        shouldRetry: false,
        message: 'Unbekannter Fehler',
        internal: true,
      };
    }

    it('should handle 401 as auth failure', () => {
      const result = handleShopifyApiError(401, '');
      expect(result.shouldRetry).toBe(false);
      expect(result.message).toContain('Authentifizierung');
    });

    it('should handle 429 as retryable', () => {
      const result = handleShopifyApiError(429, '');
      expect(result.shouldRetry).toBe(true);
    });

    it('should handle 500 as retryable', () => {
      const result = handleShopifyApiError(500, '');
      expect(result.shouldRetry).toBe(true);
    });

    it('should handle 403 as permission error', () => {
      const result = handleShopifyApiError(403, '');
      expect(result.message).toContain('Berechtigung');
    });
  });

  describe('Error Logging', () => {
    interface LogEntry {
      level: 'error' | 'warn' | 'info';
      message: string;
      context: Record<string, unknown>;
      timestamp: string;
    }

    function createLogEntry(
      level: LogEntry['level'],
      message: string,
      context: Record<string, unknown> = {}
    ): LogEntry {
      return {
        level,
        message,
        context: {
          ...context,
          // Remove sensitive data
          accessToken: undefined,
          password: undefined,
          apiKey: undefined,
        },
        timestamp: new Date().toISOString(),
      };
    }

    it('should create error log entry', () => {
      const entry = createLogEntry('error', 'Database connection failed', {
        host: 'db.example.com',
      });
      expect(entry.level).toBe('error');
      expect(entry.context.host).toBe('db.example.com');
    });

    it('should remove sensitive data', () => {
      const entry = createLogEntry('error', 'Auth failed', {
        shop: 'test.myshopify.com',
        accessToken: 'secret_token',
      });
      expect(entry.context.accessToken).toBeUndefined();
      expect(entry.context.shop).toBe('test.myshopify.com');
    });

    it('should include timestamp', () => {
      const entry = createLogEntry('info', 'Test');
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Error Recovery', () => {
    interface RecoveryAction {
      type: 'retry' | 'fallback' | 'fail';
      delay?: number;
      fallbackValue?: unknown;
    }

    function determineRecoveryAction(
      errorType: string,
      attemptCount: number
    ): RecoveryAction {
      if (errorType === 'NETWORK_ERROR' && attemptCount < 3) {
        return { type: 'retry', delay: 1000 * attemptCount };
      }

      if (errorType === 'CACHE_MISS') {
        return { type: 'fallback', fallbackValue: null };
      }

      if (errorType === 'TIMEOUT' && attemptCount < 2) {
        return { type: 'retry', delay: 5000 };
      }

      return { type: 'fail' };
    }

    it('should retry network errors', () => {
      const action = determineRecoveryAction('NETWORK_ERROR', 1);
      expect(action.type).toBe('retry');
      expect(action.delay).toBe(1000);
    });

    it('should use fallback for cache miss', () => {
      const action = determineRecoveryAction('CACHE_MISS', 1);
      expect(action.type).toBe('fallback');
    });

    it('should fail after max retries', () => {
      const action = determineRecoveryAction('NETWORK_ERROR', 3);
      expect(action.type).toBe('fail');
    });

    it('should increase delay on subsequent retries', () => {
      const action1 = determineRecoveryAction('NETWORK_ERROR', 1);
      const action2 = determineRecoveryAction('NETWORK_ERROR', 2);
      expect(action2.delay).toBeGreaterThan(action1.delay!);
    });
  });
});
