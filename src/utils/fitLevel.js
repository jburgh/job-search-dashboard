import { FIT_LEVELS } from '../constants/fitLevels';

/**
 * Company fit level utility functions
 */
export const FitLevelUtil = {
  /**
   * Convert fit level value to label
   * @param {number|null} value - Numeric fit level
   * @returns {string} Human-readable label
   */
  getLabel(value) {
    const level = Object.values(FIT_LEVELS).find(l => l.value === value);
    return level ? level.label : FIT_LEVELS.UNSET.label;
  },

  /**
   * Convert fit level label to value
   * @param {string} label - Human-readable label
   * @returns {number|null} Numeric fit level
   */
  getValue(label) {
    const level = Object.values(FIT_LEVELS).find(l => l.label === label);
    return level ? level.value : FIT_LEVELS.UNSET.value;
  },

  /**
   * Sort comparator for fit levels
   * @param {number|null} a - First value
   * @param {number|null} b - Second value
   * @param {string} direction - 'asc' or 'desc'
   * @returns {number} Sort order
   */
  compare(a, b, direction = 'desc') {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return direction === 'desc' ? b - a : a - b;
  }
};

// Legacy function aliases for backward compatibility
export const getFitLevelLabel = FitLevelUtil.getLabel;
export const getFitLevelValue = FitLevelUtil.getValue;
export const sortByFitLevel = FitLevelUtil.compare;
