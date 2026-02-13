import { PerformanceUtil } from '../performance';

// Re-export all analytics functions
export * from './dateUtils';
export * from './coreMetrics';
export * from './timeBasedAnalytics';
export * from './companyAnalytics';

// Import for aggregated functions
import {
  getTotalApplications,
  getApplicationsByTimeWindow,
  getResponseRate,
  getWaitingStatus,
  getInterviewConversionRate,
  getOfferRate,
  getPipelineStatus,
  getClosureReasons,
  getRejectionRate,
  getClosedProgressionBreakdown
} from './coreMetrics';

import {
  getApplicationsPerWeek,
  getApplicationsPerMonth,
  getResponseRateByMonth,
  getHotApplicationPeriods,
  getHotResponsePeriods
} from './timeBasedAnalytics';

import {
  getApplicationsByCompany,
  getSuccessRateByPriority,
  getMostResponsiveCompanies,
  getProgressionBreakdownForResponded,
  getCategoryTrends
} from './companyAnalytics';

/**
 * Get comprehensive job search overview metrics
 */
export const getJobSearchOverview = (jobs) => {
  return {
    totalApplications: getTotalApplications(jobs),
    byTimeWindow: getApplicationsByTimeWindow(jobs),
    responseRate: getResponseRate(jobs),
    interviewConversionRate: getInterviewConversionRate(jobs),
    offerRate: getOfferRate(jobs),
    pipeline: getPipelineStatus(jobs),
    waiting: getWaitingStatus(jobs),
    closureReasons: getClosureReasons(jobs),
    rejectionRate: getRejectionRate(jobs),
    closedProgression: getClosedProgressionBreakdown(jobs)
  };
};

/**
 * Get time-based analytics metrics
 */
export const getTimeBasedAnalytics = (jobs) => {
  return {
    applicationsPerWeek: getApplicationsPerWeek(jobs),
    applicationsPerMonth: getApplicationsPerMonth(jobs),
    responseRateByMonth: getResponseRateByMonth(jobs),
    hotApplicationPeriods: getHotApplicationPeriods(jobs),
    hotResponsePeriods: getHotResponsePeriods(jobs)
  };
};

/**
 * Get company and priority-based analytics
 */
export const getCompanyPriorityAnalytics = (jobs) => {
  return {
    applicationsByCompany: getApplicationsByCompany(jobs),
    successRateByPriority: getSuccessRateByPriority(jobs),
    mostResponsiveCompanies: getMostResponsiveCompanies(jobs)
  };
};

/**
 * Get complete analytics dataset
 */
export const getCompleteAnalytics = (jobs) => {
  return {
    overview: getJobSearchOverview(jobs),
    timeBased: getTimeBasedAnalytics(jobs),
    companyPriority: getCompanyPriorityAnalytics(jobs),
    generatedAt: new Date().toISOString()
  };
};

/**
 * Cached analytics wrapper for better performance
 */
export const analytics = {
  getJobSearchOverview(jobs) {
    const cacheKey = `overview_${jobs.length}_${jobs.map(j => j.id).join('-').substring(0, 50)}`;
    return PerformanceUtil.memoize(cacheKey, () => {
      return PerformanceUtil.measure('analytics:overview', () => getJobSearchOverview(jobs));
    }, 30000);
  },

  getTimeBasedAnalytics(jobs) {
    const cacheKey = `timebased_${jobs.length}_${jobs.map(j => j.dateApplied).join('-').substring(0, 50)}`;
    return PerformanceUtil.memoize(cacheKey, () => {
      return PerformanceUtil.measure('analytics:timebased', () => getTimeBasedAnalytics(jobs));
    }, 30000);
  },

  getCompanyPriorityAnalytics(jobs) {
    const cacheKey = `company_${jobs.length}_${jobs.map(j => j.company).join('-').substring(0, 50)}`;
    return PerformanceUtil.memoize(cacheKey, () => {
      return PerformanceUtil.measure('analytics:company', () => getCompanyPriorityAnalytics(jobs));
    }, 30000);
  },

  getCompleteAnalytics(jobs) {
    const cacheKey = `complete_${jobs.length}_${jobs.map(j => j.id).join('-').substring(0, 50)}`;
    return PerformanceUtil.memoize(cacheKey, () => {
      return PerformanceUtil.measure('analytics:complete', () => getCompleteAnalytics(jobs));
    }, 30000);
  },

  getProgressionBreakdownForResponded,
  getMostResponsiveCompanies,
  getCategoryTrends
};
