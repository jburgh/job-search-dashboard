/**
 * Date utility functions for analytics
 */

/**
 * Parse a date string into a Date object
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Calculate ISO week number for a given date
 */
export const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Format date as YYYY-MM for grouping by month
 */
export const getMonthYear = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Format date as YYYY-Www for grouping by week
 */
export const getWeekYear = (date) => {
  const week = getWeekNumber(date);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

/**
 * Filter jobs by date range
 */
export const filterByDateRange = (jobs, startDate, endDate) => {
  return jobs.filter(job => {
    const appliedDate = parseDate(job.dateApplied);
    if (!appliedDate) return false;
    if (startDate && appliedDate < startDate) return false;
    if (endDate && appliedDate > endDate) return false;
    return true;
  });
};
