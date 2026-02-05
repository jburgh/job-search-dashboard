import React from 'react';
import { StatusBadge, PriorityBadge } from '../common';
import { JOB_STATUSES } from '../../constants/jobStatuses';
import { PRIORITIES } from '../../constants/priorities';

const STATUSES = Object.values(JOB_STATUSES);
const PRIORITY_LIST = Object.values(PRIORITIES);

/**
 * Stats Component
 *
 * Displays status and priority breakdown tables for job applications.
 */
function Stats({ jobs }) {
  const statusCounts = STATUSES.reduce((acc, status) => {
    acc[status] = jobs.filter(j => j.status === status).length;
    return acc;
  }, {});

  const priorityCounts = PRIORITY_LIST.reduce((acc, priority) => {
    acc[priority] = jobs.filter(j => j.priority === priority).length;
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ marginBottom: "1rem", color: "#6b8aff" }}>Application statuses</h2>
      <div className="table-container" style={{ marginBottom: "2rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {STATUSES.map(status => (
              <tr key={status}>
                <td><StatusBadge status={status} /></td>
                <td>{statusCounts[status]}</td>
                <td>{jobs.length > 0 ? Math.round((statusCounts[status] / jobs.length) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginBottom: "1rem", color: "#6b8aff" }}>Priority Breakdown</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {PRIORITY_LIST.map(priority => (
              <tr key={priority}>
                <td><PriorityBadge priority={priority} /></td>
                <td>{priorityCounts[priority]}</td>
                <td>{jobs.length > 0 ? Math.round((priorityCounts[priority] / jobs.length) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stats;
