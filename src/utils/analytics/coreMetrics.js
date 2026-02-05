import { APP_CONFIG } from '../../constants/appConfig';
import { JOB_STATUSES } from '../../constants/jobStatuses';
import { PROGRESSION_STAGES } from '../../constants/progressionStages';
import { CLOSE_REASONS } from '../../constants/closeReasons';
import { parseDate, filterByDateRange } from './dateUtils';

/**
 * Get total number of applications with a date
 */
export const getTotalApplications = (jobs) => {
  return jobs.filter(job => job.dateApplied).length;
};

/**
 * Calculate applications by various time windows
 */
export const getApplicationsByTimeWindow = (jobs) => {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    today: filterByDateRange(jobs, startOfToday, null).length,
    thisWeek: filterByDateRange(jobs, startOfWeek, null).length,
    thisMonth: filterByDateRange(jobs, startOfMonth, null).length,
    lastMonth: filterByDateRange(jobs, startOfLastMonth, endOfLastMonth).length,
    total: getTotalApplications(jobs)
  };
};

/**
 * Calculate response rate (callback rate)
 * Counts applications that progressed beyond the initial "Application" stage
 */
export const getResponseRate = (jobs) => {
  const applicationsWithDate = jobs.filter(job => job.dateApplied);
  const total = applicationsWithDate.length;

  if (total === 0) return { count: 0, percentage: 0, total, waiting: 0 };

  const responded = applicationsWithDate.filter(job => {
    const prog = job.progression || PROGRESSION_STAGES.APPLICATION;
    return prog !== PROGRESSION_STAGES.APPLICATION;
  });

  const waiting = applicationsWithDate.filter(job => {
    return job.status === JOB_STATUSES.APPLIED &&
      (job.progression || PROGRESSION_STAGES.APPLICATION) === PROGRESSION_STAGES.APPLICATION;
  });

  return {
    count: responded.length,
    percentage: Math.round((responded.length / total) * 100),
    total,
    waiting: waiting.length
  };
};

/**
 * Analyze waiting applications by duration buckets
 */
export const getWaitingStatus = (jobs) => {
  const waiting = jobs.filter(job =>
    job.status === JOB_STATUSES.APPLIED &&
    (job.progression || PROGRESSION_STAGES.APPLICATION) === PROGRESSION_STAGES.APPLICATION
  );

  const now = new Date();
  const waitingByDuration = {
    "0-7 days": 0,
    "8-14 days": 0,
    "15-30 days": 0,
    "31-60 days": 0,
    "60+ days": 0
  };

  waiting.forEach(job => {
    if (!job.dateApplied) return;
    const appliedDate = new Date(job.dateApplied);
    const daysWaiting = Math.floor((now - appliedDate) / APP_CONFIG.MS_PER_DAY);

    if (daysWaiting <= 7) waitingByDuration["0-7 days"]++;
    else if (daysWaiting <= 14) waitingByDuration["8-14 days"]++;
    else if (daysWaiting <= 30) waitingByDuration["15-30 days"]++;
    else if (daysWaiting <= 60) waitingByDuration["31-60 days"]++;
    else waitingByDuration["60+ days"]++;
  });

  return { total: waiting.length, byDuration: waitingByDuration, jobs: waiting };
};

/**
 * Calculate interview conversion rate
 * Counts applications that reached Partial Loop, Full Loop, or Offer stage
 */
export const getInterviewConversionRate = (jobs) => {
  const applicationsWithDate = jobs.filter(job => job.dateApplied);
  const total = applicationsWithDate.length;

  if (total === 0) return { count: 0, percentage: 0, total };

  const interviewStages = [
    PROGRESSION_STAGES.PARTIAL_LOOP,
    PROGRESSION_STAGES.FULL_LOOP,
    PROGRESSION_STAGES.OFFER
  ];

  const interviewed = applicationsWithDate.filter(job =>
    interviewStages.includes(job.progression)
  );

  return {
    count: interviewed.length,
    percentage: Math.round((interviewed.length / total) * 100),
    total
  };
};

/**
 * Calculate offer rate
 */
export const getOfferRate = (jobs) => {
  const applicationsWithDate = jobs.filter(job => job.dateApplied);
  const total = applicationsWithDate.length;

  if (total === 0) return { count: 0, percentage: 0, total };

  const offers = applicationsWithDate.filter(job =>
    job.progression === PROGRESSION_STAGES.OFFER
  );

  return {
    count: offers.length,
    percentage: Math.round((offers.length / total) * 100),
    total
  };
};

/**
 * Get pipeline status for active applications
 */
export const getPipelineStatus = (jobs) => {
  const activePipeline = jobs.filter(job =>
    job.status === JOB_STATUSES.APPLIED || job.status === JOB_STATUSES.IN_PROGRESS
  );

  const byStage = {
    [PROGRESSION_STAGES.APPLICATION]: 0,
    [PROGRESSION_STAGES.RECRUITER_SCREEN]: 0,
    [PROGRESSION_STAGES.PARTIAL_LOOP]: 0,
    [PROGRESSION_STAGES.FULL_LOOP]: 0,
    [PROGRESSION_STAGES.OFFER]: 0
  };

  const byStatus = {
    [JOB_STATUSES.APPLIED]: 0,
    [JOB_STATUSES.IN_PROGRESS]: 0
  };

  activePipeline.forEach(job => {
    const stage = job.progression || PROGRESSION_STAGES.APPLICATION;
    if (byStage.hasOwnProperty(stage)) byStage[stage]++;
    if (job.status === JOB_STATUSES.APPLIED) byStatus[JOB_STATUSES.APPLIED]++;
    else if (job.status === JOB_STATUSES.IN_PROGRESS) byStatus[JOB_STATUSES.IN_PROGRESS]++;
  });

  return { total: activePipeline.length, byStage, byStatus, jobs: activePipeline };
};

/**
 * Analyze closure reasons
 */
export const getClosureReasons = (jobs) => {
  const closed = jobs.filter(job => job.status === JOB_STATUSES.CLOSED);

  const counts = {
    [CLOSE_REASONS.REJECTED]: 0,
    [CLOSE_REASONS.GHOSTED]: 0,
    [CLOSE_REASONS.DECLINED_OFFER]: 0,
    [CLOSE_REASONS.WITHDREW]: 0,
    "Unknown": 0
  };

  closed.forEach(job => {
    const reason = job.closeReason || "Unknown";
    if (counts.hasOwnProperty(reason)) counts[reason]++;
    else counts["Unknown"]++;
  });

  return { total: closed.length, counts };
};

/**
 * Calculate rejection rate
 */
export const getRejectionRate = (jobs) => {
  const closed = jobs.filter(job => job.status === JOB_STATUSES.CLOSED);
  const total = closed.length;

  if (total === 0) return { count: 0, percentage: 0, total };

  const rejected = closed.filter(job => job.closeReason === CLOSE_REASONS.REJECTED);

  return {
    count: rejected.length,
    percentage: Math.round((rejected.length / total) * 100),
    total
  };
};

/**
 * Break down closed applications by progression stage
 */
export const getClosedProgressionBreakdown = (jobs) => {
  const closed = jobs.filter(job => job.status === JOB_STATUSES.CLOSED);

  const byProgression = {
    [PROGRESSION_STAGES.APPLICATION]: 0,
    [PROGRESSION_STAGES.RECRUITER_SCREEN]: 0,
    [PROGRESSION_STAGES.PARTIAL_LOOP]: 0,
    [PROGRESSION_STAGES.FULL_LOOP]: 0,
    [PROGRESSION_STAGES.OFFER]: 0
  };

  closed.forEach(job => {
    const prog = job.progression || PROGRESSION_STAGES.APPLICATION;
    if (byProgression.hasOwnProperty(prog)) byProgression[prog]++;
  });

  return { total: closed.length, byProgression };
};
