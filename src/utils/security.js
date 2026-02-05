import { JOB_STATUSES } from '../constants/jobStatuses';
import { PRIORITY_TIERS } from '../constants/priorities';
import { PROGRESSION_STAGES } from '../constants/progressionStages';
import { CLOSE_REASONS } from '../constants/closeReasons';
import { LoggerUtil } from './logger';

/**
 * Security & Validation Module
 */
export const SecurityUtil = {
  // Security configuration
  CONFIG: {
    MAX_STRING_LENGTH: 10000,
    MAX_URL_LENGTH: 2048,
    MAX_JOBS_COUNT: 10000,
    MAX_COMPANIES_COUNT: 5000,
    MAX_IMPORT_SIZE_MB: 10,
    ALLOWED_URL_PROTOCOLS: ['http:', 'https:'],
    RATE_LIMIT_MS: 100 // Min time between operations
  },

  /**
   * Sanitize HTML to prevent XSS attacks
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @returns {string|null} Sanitized URL or null if invalid
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') return null;

    if (url.length > this.CONFIG.MAX_URL_LENGTH) {
      console.warn('URL exceeds maximum length');
      return null;
    }

    try {
      const urlObj = new URL(url);

      if (!this.CONFIG.ALLOWED_URL_PROTOCOLS.includes(urlObj.protocol)) {
        console.warn('Invalid URL protocol:', urlObj.protocol);
        return null;
      }

      return urlObj.href;
    } catch (e) {
      console.warn('Invalid URL format:', url);
      return null;
    }
  },

  /**
   * Validate string length
   */
  validateStringLength(str, maxLength = this.CONFIG.MAX_STRING_LENGTH) {
    if (typeof str !== 'string') return false;
    return str.length <= maxLength;
  },

  /**
   * Sanitize text input
   */
  sanitizeInput(input, maxLength = this.CONFIG.MAX_STRING_LENGTH) {
    if (typeof input !== 'string') return '';
    let sanitized = input.slice(0, maxLength);
    sanitized = sanitized.replace(/\0/g, '');
    sanitized = sanitized.trim();
    return sanitized;
  },

  /**
   * Validate job object structure and data
   */
  validateJobData(job) {
    if (!job || typeof job !== 'object') {
      throw new Error('Invalid job data: must be an object');
    }

    const requiredFields = ['company', 'role'];
    for (const field of requiredFields) {
      if (!job[field] || typeof job[field] !== 'string') {
        throw new Error(`Invalid job data: ${field} is required`);
      }
    }

    const validated = {
      id: job.id || Date.now(),
      company: this.sanitizeInput(job.company, 200),
      role: this.sanitizeInput(job.role, 200),
      status: this.validateEnum(job.status, Object.values(JOB_STATUSES), JOB_STATUSES.APPLIED),
      priority: this.validateEnum(job.priority, Object.values(PRIORITY_TIERS), PRIORITY_TIERS.TIER_2),
      dateApplied: this.validateDate(job.dateApplied),
      url: job.url ? this.validateURL(job.url) : '',
      salary: this.sanitizeInput(job.salary || '', 100),
      location: this.sanitizeInput(job.location || '', 200),
      contact: this.sanitizeInput(job.contact || '', 200),
      notes: this.sanitizeInput(job.notes || '', 5000),
      followUp: job.followUp ? this.validateDate(job.followUp, false) : '',
      progression: this.validateEnum(job.progression, Object.values(PROGRESSION_STAGES), PROGRESSION_STAGES.APPLICATION),
      closeReason: job.closeReason ? this.validateEnum(job.closeReason, Object.values(CLOSE_REASONS), '') : '',
      resumeUrl: job.resumeUrl ? this.validateURL(job.resumeUrl) : '',
      coverLetterUrl: job.coverLetterUrl ? this.validateURL(job.coverLetterUrl) : ''
    };

    const dataSize = JSON.stringify(validated).length;
    if (dataSize > 50000) {
      throw new Error('Job data exceeds maximum size');
    }

    return validated;
  },

  /**
   * Validate company object
   */
  validateCompanyData(company) {
    if (!company || typeof company !== 'object') {
      throw new Error('Invalid company data');
    }

    if (!company.name || typeof company.name !== 'string') {
      throw new Error('Company name is required');
    }

    return {
      name: this.sanitizeInput(company.name, 200),
      url: company.url ? this.validateURL(company.url) : '',
      category: this.sanitizeInput(company.category || 'None', 100),
      fitLevel: company.fitLevel !== undefined ? this.validateFitLevel(company.fitLevel) : null
    };
  },

  /**
   * Validate enum value
   */
  validateEnum(value, allowedValues, defaultValue) {
    return allowedValues.includes(value) ? value : defaultValue;
  },

  /**
   * Validate date string
   */
  validateDate(dateStr, required = true) {
    if (!dateStr) {
      return required ? new Date().toISOString().split('T')[0] : '';
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return required ? new Date().toISOString().split('T')[0] : '';
    }

    const minDate = new Date('2000-01-01');
    const maxDate = new Date('2100-01-01');

    if (date < minDate || date > maxDate) {
      console.warn('Date out of valid range:', dateStr);
      return required ? new Date().toISOString().split('T')[0] : '';
    }

    return date.toISOString().split('T')[0];
  },

  /**
   * Validate fit level value
   */
  validateFitLevel(value) {
    if (value === null || value === undefined) return null;
    const numValue = parseInt(value);
    return [1, 2, 3].includes(numValue) ? numValue : null;
  },

  /**
   * Validate import data structure and size
   */
  validateImportData(jsonString) {
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
    if (sizeInMB > this.CONFIG.MAX_IMPORT_SIZE_MB) {
      throw new Error(`Import file too large: ${sizeInMB.toFixed(2)}MB (max: ${this.CONFIG.MAX_IMPORT_SIZE_MB}MB)`);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid backup format: must be an object');
    }

    const data = parsed.data || parsed;

    if (!data.jobs || !Array.isArray(data.jobs)) {
      throw new Error('Invalid backup format: jobs array required');
    }

    if (data.jobs.length > this.CONFIG.MAX_JOBS_COUNT) {
      throw new Error(`Too many jobs: ${data.jobs.length} (max: ${this.CONFIG.MAX_JOBS_COUNT})`);
    }

    if (data.customCompanies) {
      const companyCount = Object.keys(data.customCompanies).length;
      if (companyCount > this.CONFIG.MAX_COMPANIES_COUNT) {
        throw new Error(`Too many companies: ${companyCount} (max: ${this.CONFIG.MAX_COMPANIES_COUNT})`);
      }
    }

    return data;
  },

  /**
   * Secure error handler
   */
  handleError(error, context, showToUser = true) {
    console.error(`[${context}]`, error);
    if (showToUser) {
      const safeMessage = this.getSafeErrorMessage(error, context);
      alert(safeMessage);
    }
  },

  /**
   * Get user-safe error message
   */
  getSafeErrorMessage(error, context) {
    const baseMessage = `An error occurred while ${context}.`;
    if (error.message && error.message.startsWith('Invalid')) {
      return `${baseMessage}\n${error.message}`;
    }
    return `${baseMessage}\nPlease try again or contact support if the issue persists.`;
  },

  // Rate limiting state
  _lastOperationTime: 0,
  _recentErrors: 0,

  /**
   * Adaptive rate limit based on system state
   */
  getAdaptiveRateLimit() {
    let limit = this.CONFIG.RATE_LIMIT_MS;
    if (this._recentErrors > 3) {
      limit *= 1.5;
    }
    return limit;
  },

  checkRateLimit() {
    const adaptive = this.getAdaptiveRateLimit();
    const now = Date.now();
    if (now - this._lastOperationTime < adaptive) {
      throw new Error('Operation rate limit exceeded. Please wait.');
    }
    this._lastOperationTime = now;
  },

  /**
   * Generate data integrity hash
   */
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  },

  /**
   * Verify data integrity
   */
  verifyChecksum(data, checksum) {
    return this.generateChecksum(data) === checksum;
  }
};
