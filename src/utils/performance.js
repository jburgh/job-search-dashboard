import { LoggerUtil } from './logger';

/**
 * Performance & Observability Module
 * Tracks metrics, provides caching, throttling, and monitoring
 */
export const PerformanceUtil = {
  // Metrics collection
  metrics: {
    operationTimes: {},
    cacheHits: 0,
    cacheMisses: 0,
    throttledCalls: 0,
    errorCount: 0,
    lastOperations: []
  },

  // Simple in-memory cache with TTL
  cache: new Map(),
  cacheTimeouts: new Map(),

  /**
   * Memoize expensive computations
   * @param {string} key - Cache key
   * @param {Function} fn - Computation function
   * @param {number} ttl - Time to live in ms (default 5000)
   * @returns {*} Cached or computed value
   */
  memoize(key, fn, ttl = 5000) {
    if (this.cache.has(key)) {
      this.metrics.cacheHits++;
      return this.cache.get(key);
    }

    this.metrics.cacheMisses++;
    const result = fn();
    this.cache.set(key, result);

    // Clear timeout if exists
    if (this.cacheTimeouts.has(key)) {
      clearTimeout(this.cacheTimeouts.get(key));
    }

    // Set new timeout for cache invalidation
    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
      this.cacheTimeouts.delete(key);
    }, ttl);

    this.cacheTimeouts.set(key, timeoutId);
    return result;
  },

  /**
   * Clear cache for specific keys
   */
  clearCache(...keys) {
    keys.forEach(key => {
      if (this.cacheTimeouts.has(key)) {
        clearTimeout(this.cacheTimeouts.get(key));
        this.cacheTimeouts.delete(key);
      }
      this.cache.delete(key);
    });
  },

  /**
   * Clear cache entries by prefix
   * @param  {...string} prefixes - Cache key prefixes
   */
  clearCacheByPrefix(...prefixes) {
    const keys = Array.from(this.cache.keys());
    keys.forEach(k => {
      if (prefixes.some(p => k.startsWith(p))) {
        if (this.cacheTimeouts.has(k)) {
          clearTimeout(this.cacheTimeouts.get(k));
          this.cacheTimeouts.delete(k);
        }
        this.cache.delete(k);
      }
    });
  },

  /**
   * Create debounced function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in ms
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    const self = this;

    return function debounced(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (self && self.metrics) {
          self.metrics.throttledCalls++;
        }
        fn.apply(this, args);
      }, delay);
    };
  },

  /**
   * Create throttled function
   * @param {Function} fn - Function to throttle
   * @param {number} interval - Minimum interval in ms
   * @returns {Function} Throttled function
   */
  throttle(fn, interval = 300) {
    let lastCallTime = 0;
    const self = this;

    return function throttled(...args) {
      const now = Date.now();

      if (now - lastCallTime >= interval) {
        lastCallTime = now;
        return fn.apply(this, args);
      }
      self.metrics.throttledCalls++;
    };
  },

  /**
   * Measure operation time
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to measure
   * @returns {*} Function result
   */
  measure(operation, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (!this.metrics.operationTimes[operation]) {
      this.metrics.operationTimes[operation] = [];
    }

    this.metrics.operationTimes[operation].push(duration);

    // Keep only last 100 measurements per operation
    if (this.metrics.operationTimes[operation].length > 100) {
      this.metrics.operationTimes[operation].shift();
    }

    return result;
  },

  /**
   * Get average operation time
   */
  getAvgTime(operation) {
    const times = this.metrics.operationTimes[operation];
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  },

  /**
   * Get performance report
   */
  getReport() {
    const report = {
      cacheStats: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0
          ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      operationStats: {},
      memoryUsage: {
        cacheSize: this.cache.size,
        logCount: LoggerUtil.logs.length
      }
    };

    for (const [op, times] of Object.entries(this.metrics.operationTimes)) {
      if (times.length > 0) {
        report.operationStats[op] = {
          count: times.length,
          avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) + 'ms',
          min: Math.min(...times).toFixed(2) + 'ms',
          max: Math.max(...times).toFixed(2) + 'ms'
        };
      }
    }

    return report;
  },

  /**
   * Clear old caches and logs to manage memory
   */
  cleanup() {
    // Clear all caches
    this.cache.clear();
    this.cacheTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cacheTimeouts.clear();

    // Reset metrics (keep for reporting, but clear operation details)
    this.metrics.operationTimes = {};
    this.metrics.throttledCalls = 0;

    // Clear old logs (keep only last 100)
    if (LoggerUtil.logs.length > 100) {
      LoggerUtil.logs = LoggerUtil.logs.slice(-100);
    }
  },

  /**
   * Get memory stats
   */
  getMemoryStats() {
    const stats = {
      cacheSize: this.cache.size,
      cacheTimeouts: this.cacheTimeouts.size,
      logCount: LoggerUtil.logs.length,
      metricsOperations: Object.keys(this.metrics.operationTimes).length
    };

    if (performance.memory) {
      stats.heapUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB';
      stats.heapLimit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB';
    }

    return stats;
  }
};
