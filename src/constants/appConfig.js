/**
 * Application configuration constants
 */
export const APP_CONFIG = {
  // Application version and metadata
  VERSION: '1.0',
  APP_NAME: 'Job Search Dashboard',
  GITHUB_COMMITS_URL: 'https://github.com/jburgh/job-search-dashboard/commits/main/',

  // Storage keys
  STORAGE_KEYS: {
    JOBS: 'jobTrackerJobs',
    CUSTOM_COMPANIES: 'jobTrackerCustomCompanies',
    BLOCKED_COMPANIES: 'blockedCompanies',
    LAST_BACKUP: 'jobTrackerLastBackup',
    THEME: 'theme'
  },

  // Date and time constants
  BACKUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  MS_PER_DAY: 1000 * 60 * 60 * 24,

  // Pagination
  ITEMS_PER_PAGE: 20,

  // Analytics thresholds
  HOT_PERIOD_MULTIPLIER: 1.25,
  MIN_APPLICATIONS_FOR_COMPANY_STATS: 2
};
