import React from 'react';

/**
 * Priority badge component for displaying job priority tier
 */
function PriorityBadge({ priority }) {
  if (!priority) {
    console.warn("PriorityBadge received undefined priority");
    return <span className="priority-badge priority-tier2">No priority</span>;
  }
  const className = `priority-badge priority-${priority.toLowerCase().replace(/\s+/g, "")}`;
  return <span className={className}>{priority}</span>;
}

export default PriorityBadge;
