/**
 * Logger Module
 * Provides structured logging and error tracking
 */
export const LoggerUtil = {
  logs: [],
  maxLogs: 1000,

  LOG_LEVELS: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  },

  /**
   * Log a message with structured data
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console in development
    const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
    console[consoleMethod](`[${timestamp}] ${level}: ${message}`, data);
  },

  debug(message, data) {
    this.log(this.LOG_LEVELS.DEBUG, message, data);
  },

  info(message, data) {
    this.log(this.LOG_LEVELS.INFO, message, data);
  },

  warn(message, data) {
    this.log(this.LOG_LEVELS.WARN, message, data);
  },

  error(message, data) {
    this.log(this.LOG_LEVELS.ERROR, message, data);
  },

  /**
   * Get logs filtered by level and date range
   */
  getLogs(level = null, hoursBack = 24) {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    let filtered = this.logs.filter(log => new Date(log.timestamp) >= cutoffTime);

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered;
  },

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return {
      exported: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
  },

  /**
   * Track user action with metrics
   */
  trackAction(action, category, data = {}) {
    this.info(`User Action: ${action}`, {
      category,
      ...data
    });
  },

  /**
   * Track performance of operations
   */
  trackPerformance(operation, duration, success = true) {
    this.info(`Operation: ${operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      success,
      category: 'performance'
    });
  }
};
