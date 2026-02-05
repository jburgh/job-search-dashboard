/**
 * Job application statuses
 */
export const JOB_STATUSES = {
  APPLIED: 'Applied',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed'
};

// Convenience array of statuses for filters/UI
export const STATUSES = Object.values(JOB_STATUSES);
