import { APP_CONFIG } from '../../constants/appConfig';
import { PROGRESSION_STAGES } from '../../constants/progressionStages';
import { parseDate, getWeekYear, getMonthYear } from './dateUtils';

/**
 * Calculate applications per week with average
 */
export const getApplicationsPerWeek = (jobs) => {
  const jobsWithDates = jobs.filter(job => job.dateApplied);
  const weekMap = {};

  jobsWithDates.forEach(job => {
    const date = parseDate(job.dateApplied);
    if (!date) return;
    const weekKey = getWeekYear(date);
    weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
  });

  const weeks = Object.entries(weekMap)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const totalWeeks = weeks.length;
  const totalApps = weeks.reduce((sum, w) => sum + w.count, 0);
  const average = totalWeeks > 0 ? Math.round(totalApps / totalWeeks) : 0;

  return { byWeek: weeks, average, total: totalApps };
};

/**
 * Calculate applications per month with formatted labels
 */
export const getApplicationsPerMonth = (jobs) => {
  const jobsWithDates = jobs.filter(job => job.dateApplied);
  const monthMap = {};

  jobsWithDates.forEach(job => {
    const date = parseDate(job.dateApplied);
    if (!date) return;
    const monthKey = getMonthYear(date);
    monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
  });

  const months = Object.entries(monthMap)
    .map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      return { month, label, count };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalMonths = months.length;
  const totalApps = months.reduce((sum, m) => sum + m.count, 0);
  const average = totalMonths > 0 ? Math.round(totalApps / totalMonths) : 0;

  return { byMonth: months, average, total: totalApps };
};

/**
 * Track response rates by month
 */
export const getResponseRateByMonth = (jobs) => {
  const monthMap = {};

  jobs.forEach(job => {
    if (!job.followUp) return;
    const date = parseDate(job.followUp);
    if (!date) return;

    const monthKey = getMonthYear(date);
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { followUps: 0, responded: 0 };
    }

    monthMap[monthKey].followUps++;
    if (job.progression && job.progression !== PROGRESSION_STAGES.APPLICATION) {
      monthMap[monthKey].responded++;
    }
  });

  const months = Object.entries(monthMap)
    .map(([month, data]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const responsePercentage = data.followUps > 0
        ? Math.round((data.responded / data.followUps) * 100)
        : 0;

      return {
        month,
        label,
        followUps: data.followUps,
        responded: data.responded,
        responsePercentage
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return months;
};

/**
 * Identify months with unusually high application activity
 */
export const getHotApplicationPeriods = (jobs) => {
  const monthlyData = getApplicationsPerMonth(jobs);
  const hotThreshold = monthlyData.average * APP_CONFIG.HOT_PERIOD_MULTIPLIER;

  const hotPeriods = monthlyData.byMonth
    .filter(item => item.count >= hotThreshold)
    .map(item => ({
      period: item.label,
      applications: item.count,
      vsAverage: Math.round(((item.count - monthlyData.average) / monthlyData.average) * 100)
    }));

  return {
    hotPeriods,
    threshold: Math.round(hotThreshold),
    average: monthlyData.average
  };
};

/**
 * Identify periods with unusually high response rates
 */
export const getHotResponsePeriods = (jobs) => {
  const monthlyResponses = getResponseRateByMonth(jobs);

  const totalApps = monthlyResponses.reduce((sum, item) => sum + item.followUps, 0);
  const totalResponses = monthlyResponses.reduce((sum, item) => sum + item.responded, 0);
  const overallAverage = totalApps > 0 ? (totalResponses / totalApps) * 100 : 0;

  const hotThreshold = overallAverage * APP_CONFIG.HOT_PERIOD_MULTIPLIER;

  const hotPeriods = monthlyResponses
    .filter(item => item.responsePercentage >= hotThreshold && item.followUps >= 3)
    .map(item => ({
      period: item.label,
      responseRate: item.responsePercentage,
      applications: item.followUps,
      responses: item.responded
    }));

  return {
    hotPeriods,
    threshold: Math.round(hotThreshold),
    average: Math.round(overallAverage)
  };
};
