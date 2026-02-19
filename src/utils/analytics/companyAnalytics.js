import { APP_CONFIG } from '../../constants/appConfig';
import { JOB_STATUSES } from '../../constants/jobStatuses';
import { PROGRESSION_STAGES } from '../../constants/progressionStages';
import { PRIORITY_TIERS } from '../../constants/priorities';
import { CLOSE_REASONS } from '../../constants/closeReasons';

/**
 * Aggregate application statistics by company
 */
export const getApplicationsByCompany = (jobs) => {
  const jobsWithDates = jobs.filter(job => job.dateApplied);
  const companyData = {};

  jobsWithDates.forEach(job => {
    const company = job.company || "Unknown";

    if (!companyData[company]) {
      companyData[company] = {
        total: 0,
        applied: 0,
        inProgress: 0,
        closed: 0,
        responded: 0,
        rejected: 0,
        offers: 0
      };
    }

    companyData[company].total++;

    if (job.status === JOB_STATUSES.APPLIED) {
      companyData[company].applied++;
    } else if (job.status === JOB_STATUSES.IN_PROGRESS) {
      companyData[company].inProgress++;
    } else if (job.status === JOB_STATUSES.CLOSED) {
      companyData[company].closed++;
    }

    const prog = job.progression || PROGRESSION_STAGES.APPLICATION;
    if (job.status === JOB_STATUSES.IN_PROGRESS || prog !== PROGRESSION_STAGES.APPLICATION) {
      companyData[company].responded++;
    }

    if (job.closeReason === CLOSE_REASONS.REJECTED) {
      companyData[company].rejected++;
    }

    if (prog === PROGRESSION_STAGES.OFFER) {
      companyData[company].offers++;
    }
  });

  const companies = Object.entries(companyData)
    .map(([name, data]) => ({
      name,
      ...data,
      responseRate: data.total > 0
        ? Math.round((data.responded / data.total) * 100)
        : 0
    }))
    .sort((a, b) => b.total - a.total);

  return companies;
};

/**
 * Analyze success rates by priority tier
 */
export const getSuccessRateByPriority = (jobs) => {
  const jobsWithDates = jobs.filter(job => job.dateApplied);

  const priorityData = {};
  Object.values(PRIORITY_TIERS).forEach(tier => {
    priorityData[tier] = { total: 0, responded: 0, interviewed: 0, offers: 0 };
  });

  const interviewStages = [
    PROGRESSION_STAGES.RECRUITER_SCREEN,
    PROGRESSION_STAGES.PARTIAL_LOOP,
    PROGRESSION_STAGES.FULL_LOOP,
    PROGRESSION_STAGES.OFFER
  ];

  jobsWithDates.forEach(job => {
    const tier = job.priority || PRIORITY_TIERS.TIER_3;

    if (priorityData[tier]) {
      priorityData[tier].total++;

      if (job.status === JOB_STATUSES.IN_PROGRESS ||
        (job.progression && job.progression !== PROGRESSION_STAGES.APPLICATION)) {
        priorityData[tier].responded++;
      }

      if (job.progression && interviewStages.includes(job.progression)) {
        priorityData[tier].interviewed++;
      }

      if (job.progression === PROGRESSION_STAGES.OFFER) {
        priorityData[tier].offers++;
      }
    }
  });

  const result = Object.entries(priorityData).map(([tier, data]) => {
    const responseRate = data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0;
    const interviewRate = data.total > 0 ? Math.round((data.interviewed / data.total) * 100) : 0;
    const offerRate = data.total > 0 ? Math.round((data.offers / data.total) * 100) : 0;

    return {
      tier,
      total: data.total,
      responded: data.responded,
      interviewed: data.interviewed,
      offers: data.offers,
      responseRate,
      interviewRate,
      offerRate
    };
  });

  return result;
};

/**
 * Get top companies by response rate
 */
export const getMostResponsiveCompanies = (jobs, minApplications = APP_CONFIG.MIN_APPLICATIONS_FOR_COMPANY_STATS) => {
  const companies = getApplicationsByCompany(jobs);

  return companies
    .filter(company => company.total >= minApplications)
    .sort((a, b) => b.responseRate - a.responseRate)
    .slice(0, 10);
};

/**
 * Break down progression stages for applications that received responses
 */
export const getProgressionBreakdownForResponded = (jobs) => {
  const responded = jobs.filter(job =>
    job.progression && job.progression !== PROGRESSION_STAGES.APPLICATION
  );

  const byProgression = {
    [PROGRESSION_STAGES.RECRUITER_SCREEN]: 0,
    [PROGRESSION_STAGES.PARTIAL_LOOP]: 0,
    [PROGRESSION_STAGES.FULL_LOOP]: 0,
    [PROGRESSION_STAGES.OFFER]: 0
  };

  responded.forEach(job => {
    const prog = job.progression || PROGRESSION_STAGES.APPLICATION;
    if (byProgression.hasOwnProperty(prog)) {
      byProgression[prog]++;
    }
  });

  return Object.entries(byProgression)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([stage, count]) => ({
      label: stage,
      value: count
    }));
};

const getMedian = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const buildCompanyCategoryMap = (companies) => {
  const map = new Map();
  if (!companies || typeof companies !== 'object') return map;

  Object.entries(companies).forEach(([category, list]) => {
    if (!Array.isArray(list)) return;
    list.forEach(company => {
      const name = typeof company?.name === 'string' ? company.name.trim().toLowerCase() : '';
      if (name && !map.has(name)) {
        map.set(name, category || 'None');
      }
    });
  });

  return map;
};

/**
 * Aggregate application statistics by company category
 */
export const getCategoryTrends = (
  jobs,
  companies,
  minApplications = APP_CONFIG.MIN_APPLICATIONS_FOR_COMPANY_STATS
) => {
  const categoryMap = buildCompanyCategoryMap(companies);
  const categoryData = {};

  const interviewStages = [
    PROGRESSION_STAGES.PARTIAL_LOOP,
    PROGRESSION_STAGES.FULL_LOOP,
    PROGRESSION_STAGES.OFFER
  ];

  jobs.forEach(job => {
    const companyKey = typeof job.company === 'string' ? job.company.trim().toLowerCase() : '';
    const category = categoryMap.get(companyKey);

    // Only count jobs whose companies are explicitly in the companies list
    if (!category) {
      return;
    }

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        total: 0,
        responded: 0,
        interviewed: 0,
        offers: 0,
        closed: 0,
        closeDays: []
      };
    }

    const entry = categoryData[category];
    entry.total++;

    const progression = job.progression || PROGRESSION_STAGES.APPLICATION;
    if (progression !== PROGRESSION_STAGES.APPLICATION) {
      entry.responded++;
    }

    if (progression && interviewStages.includes(progression)) {
      entry.interviewed++;
    }

    if (progression === PROGRESSION_STAGES.OFFER) {
      entry.offers++;
    }

    if (job.status === JOB_STATUSES.CLOSED) {
      entry.closed++;
      if (job.dateApplied && job.followUp) {
        const start = new Date(job.dateApplied);
        const end = new Date(job.followUp);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const days = Math.floor((end - start) / APP_CONFIG.MS_PER_DAY);
          if (days >= 0) entry.closeDays.push(days);
        }
      }
    }
  });

  return Object.values(categoryData)
    .filter(entry => entry.total >= minApplications)
    .map(entry => ({
      ...entry,
      responseRate: entry.total > 0 ? Math.round((entry.responded / entry.total) * 100) : 0,
      interviewRate: entry.total > 0 ? Math.round((entry.interviewed / entry.total) * 100) : 0,
      medianDaysToClose: getMedian(entry.closeDays)
    }));
};
