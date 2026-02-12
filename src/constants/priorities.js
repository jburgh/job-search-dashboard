/**
 * Priority tiers for job applications
 * Backend values maintain Tier 1/2/3 for data compatibility
 */
export const PRIORITY_TIERS = {
  TIER_1: 'Tier 1',  // Highest priority
  TIER_2: 'Tier 2',  // Medium priority
  TIER_3: 'Tier 3'   // Lower priority
};

// Display labels for priorities
export const PRIORITY_LABELS = {
  'Tier 1': 'Hot',
  'Tier 2': 'Warm',
  'Tier 3': 'Cool'
};

// Reverse mapping for converting labels back to tier values
export const LABEL_TO_TIER = {
  'Hot': 'Tier 1',
  'Warm': 'Tier 2',
  'Cool': 'Tier 3'
};

// Convenience array of priorities for dropdowns/filters (display labels)
export const PRIORITIES = Object.values(PRIORITY_LABELS);

// Get display label for a tier value
export const getPriorityLabel = (tierValue) => {
  return PRIORITY_LABELS[tierValue] || tierValue;
};

// Get tier value from display label
export const getPriorityTier = (label) => {
  return LABEL_TO_TIER[label] || label;
};
