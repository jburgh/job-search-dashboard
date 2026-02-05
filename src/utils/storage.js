import { APP_CONFIG } from '../constants/appConfig';
import { SecurityUtil } from './security';

/**
 * Storage utilities for localStorage operations with security
 */
export const StorageUtil = {
  /**
   * Get item from localStorage with error handling and validation
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);

      if (key === APP_CONFIG.STORAGE_KEYS.JOBS) {
        if (!Array.isArray(parsed)) {
          console.warn('Invalid jobs data structure, using default');
          return defaultValue;
        }
        if (parsed.length > SecurityUtil.CONFIG.MAX_JOBS_COUNT) {
          console.warn('Jobs count exceeds limit, truncating');
          return parsed.slice(0, SecurityUtil.CONFIG.MAX_JOBS_COUNT);
        }
      }

      return parsed;
    } catch (error) {
      SecurityUtil.handleError(error, 'loading data', false);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with error handling and size check
   */
  set(key, value) {
    try {
      const jsonString = JSON.stringify(value);

      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      if (sizeInMB > 5) {
        console.warn(`Data size (${sizeInMB.toFixed(2)}MB) approaching localStorage limits`);
        alert(`Warning: Your data is getting large (${sizeInMB.toFixed(2)}MB). Consider exporting a backup.`);
      }

      localStorage.setItem(key, jsonString);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        SecurityUtil.handleError(
          new Error('Storage quota exceeded. Please export and clear old data.'),
          'saving data'
        );
      } else {
        SecurityUtil.handleError(error, 'saving data', false);
      }
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      SecurityUtil.handleError(error, 'removing data', false);
    }
  },

  /**
   * Get storage usage statistics
   */
  getUsageStats() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return {
        used: total,
        usedMB: (total / (1024 * 1024)).toFixed(2),
        estimated: '5-10MB typical limit'
      };
    } catch (error) {
      return { error: 'Unable to calculate usage' };
    }
  }
};
