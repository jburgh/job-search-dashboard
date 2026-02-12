import React from 'react';
import { getPriorityLabel } from '../../constants/priorities';

/**
 * Priority badge component for displaying job priority tier
 */
function PriorityBadge({ priority }) {
  if (!priority) {
    console.warn("PriorityBadge received undefined priority");
    return <span className="priority-badge priority-tier2">Warm</span>;
  }
  
  // Get display label and map to CSS class
  const displayLabel = getPriorityLabel(priority);
  const tierMap = {
    'Tier 1': 'tier1',
    'Tier 2': 'tier2',
    'Tier 3': 'tier3'
  };
  const cssClass = tierMap[priority] || 'tier2';
  
  return <span className={`priority-badge priority-${cssClass}`}>{displayLabel}</span>;
}

export default PriorityBadge;
