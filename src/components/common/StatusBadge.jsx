import React from 'react';

/**
 * Status badge component for displaying job application status
 */
function StatusBadge({ status }) {
  if (!status) {
    console.warn("StatusBadge received undefined status");
    return <span className="status-badge status-not-applied">Unknown</span>;
  }
  const className = `status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`;
  return <span className={className}>{status}</span>;
}

export default StatusBadge;
