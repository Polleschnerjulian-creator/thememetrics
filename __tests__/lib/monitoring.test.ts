/**
 * Monitoring Tests
 */

import {
  captureError,
  captureWarning,
  captureMessage,
  getRecentErrors,
  clearErrors,
  startMeasurement,
  getPerformanceMetrics,
  trackMetric,
  getBusinessMetrics,
  checkAlertThresholds,
  getHealthStatus,
  getAggregatedMetrics,
  METRICS,
} from '@/lib/monitoring';

describe('Monitoring', () => {
  beforeEach(() => {
    clearErrors();
  });

  describe('Error Capture', () => {
    it('should capture Error objects', () => {
      const error = new Error('Test error');
      captureError(error);

      const errors = getRecentErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe('Test error');
    });

    it('should capture string errors', () => {
      captureError('String error');

      const errors = getRecentErrors();
      expect(errors[0].message).toBe('String error');
    });

    it('should include context', () => {
      captureError(new Error('Test'), {
        tags: { shop: 'test.myshopify.com' },
      });

      const errors = getRecentErrors();
      expect(errors[0].context.tags?.shop).toBe('test.myshopify.com');
    });

    it('should set error level', () => {
      captureError(new Error('Error'));
      captureWarning('Warning');
      captureMessage('Info');

      const errors = getRecentErrors();
      expect(errors.map(e => e.level)).toContain('error');
      expect(errors.map(e => e.level)).toContain('warning');
      expect(errors.map(e => e.level)).toContain('info');
    });

    it('should include timestamp', () => {
      captureError(new Error('Test'));

      const errors = getRecentErrors();
      expect(errors[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Performance Measurement', () => {
    it('should measure operation duration', async () => {
      const end = startMeasurement('test-operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      end();

      const metrics = getPerformanceMetrics();
      const testMetric = metrics.find(m => m.name === 'test-operation');
      expect(testMetric).toBeDefined();
      expect(testMetric!.duration).toBeGreaterThan(0);
    });

    it('should include metric name', () => {
      const end = startMeasurement('custom-name');
      end();

      const metrics = getPerformanceMetrics();
      expect(metrics.some(m => m.name === 'custom-name')).toBe(true);
    });
  });

  describe('Business Metrics', () => {
    it('should track metric with value', () => {
      trackMetric(METRICS.ANALYSIS_COMPLETED, 85);

      const metrics = getBusinessMetrics();
      const latest = metrics[metrics.length - 1];
      expect(latest.name).toBe(METRICS.ANALYSIS_COMPLETED);
      expect(latest.value).toBe(85);
    });

    it('should track metric with tags', () => {
      trackMetric(METRICS.SUBSCRIPTION_CREATED, 1, { plan: 'starter' });

      const metrics = getBusinessMetrics();
      const latest = metrics[metrics.length - 1];
      expect(latest.tags?.plan).toBe('starter');
    });

    it('should include timestamp', () => {
      trackMetric(METRICS.CACHE_HIT, 1);

      const metrics = getBusinessMetrics();
      expect(metrics[metrics.length - 1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Metric Constants', () => {
    it('should have analysis metrics', () => {
      expect(METRICS.ANALYSIS_STARTED).toBe('analysis.started');
      expect(METRICS.ANALYSIS_COMPLETED).toBe('analysis.completed');
      expect(METRICS.ANALYSIS_FAILED).toBe('analysis.failed');
    });

    it('should have subscription metrics', () => {
      expect(METRICS.SUBSCRIPTION_CREATED).toBe('subscription.created');
      expect(METRICS.SUBSCRIPTION_UPGRADED).toBe('subscription.upgraded');
      expect(METRICS.SUBSCRIPTION_DOWNGRADED).toBe('subscription.downgraded');
    });

    it('should have performance metrics', () => {
      expect(METRICS.API_LATENCY).toBe('api.latency');
      expect(METRICS.CACHE_HIT).toBe('cache.hit');
      expect(METRICS.CACHE_MISS).toBe('cache.miss');
    });
  });

  describe('Alert Thresholds', () => {
    it('should not trigger alert for normal values', () => {
      const alert = checkAlertThresholds(METRICS.API_LATENCY, 1000);
      expect(alert).toBeNull();
    });

    it('should trigger warning for slow latency', () => {
      const alert = checkAlertThresholds(METRICS.API_LATENCY, 6000);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('warning');
    });

    it('should trigger critical for very slow latency', () => {
      const alert = checkAlertThresholds(METRICS.API_LATENCY, 15000);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('critical');
    });
  });

  describe('Health Status', () => {
    it('should return status object', () => {
      const health = getHealthStatus();
      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should include components', () => {
      const health = getHealthStatus();
      expect(health.components).toHaveProperty('database');
      expect(health.components).toHaveProperty('cache');
      expect(health.components).toHaveProperty('shopify');
    });

    it('should include metrics', () => {
      const health = getHealthStatus();
      expect(health.metrics).toHaveProperty('errorRate');
      expect(health.metrics).toHaveProperty('avgLatency');
      expect(health.metrics).toHaveProperty('uptime');
    });

    it('should include timestamp', () => {
      const health = getHealthStatus();
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should track uptime', () => {
      const health = getHealthStatus();
      expect(health.metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Aggregated Metrics', () => {
    it('should return period info', () => {
      const aggregated = getAggregatedMetrics(60);
      expect(aggregated.period).toContain('60 minutes');
    });

    it('should calculate success rate', () => {
      const aggregated = getAggregatedMetrics(60);
      expect(aggregated.successRate).toBeGreaterThanOrEqual(0);
      expect(aggregated.successRate).toBeLessThanOrEqual(100);
    });

    it('should include top errors', () => {
      const aggregated = getAggregatedMetrics(60);
      expect(Array.isArray(aggregated.topErrors)).toBe(true);
    });

    it('should limit error count in top errors', () => {
      // Add multiple errors
      for (let i = 0; i < 10; i++) {
        captureError(new Error(`Test error ${i % 3}`));
      }

      const aggregated = getAggregatedMetrics(60);
      expect(aggregated.topErrors.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Store Management', () => {
    it('should store errors in order', () => {
      captureError(new Error('First'));
      captureError(new Error('Second'));

      const errors = getRecentErrors();
      expect(errors[0].message).toBe('Second');
      expect(errors[1].message).toBe('First');
    });

    it('should clear errors', () => {
      captureError(new Error('Test'));
      clearErrors();

      const errors = getRecentErrors();
      expect(errors).toHaveLength(0);
    });
  });
});
