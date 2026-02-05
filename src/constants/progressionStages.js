/**
 * Application progression stages
 */
export const PROGRESSION_STAGES = {
  APPLICATION: 'Application',
  RECRUITER_SCREEN: 'Recruiter Screen',
  PARTIAL_LOOP: 'Partial Loop',
  FULL_LOOP: 'Full Loop',
  OFFER: 'Offer'
};

// Convenience array of progressions for dropdowns
export const PROGRESSIONS = Object.values(PROGRESSION_STAGES);
