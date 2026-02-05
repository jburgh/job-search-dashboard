import React from 'react';

/**
 * Panel displaying insights and recommendations
 */
const InsightsPanel = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="insights-panel">
      <h3>Insights & recommendations</h3>
      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className={`insight-item insight-${insight.type}`}>
            <div className="insight-icon">
              {insight.type === 'success' && '✓'}
              {insight.type === 'warning' && '⚠'}
              {insight.type === 'info' && 'ℹ'}
            </div>
            <div className="insight-content">
              <div className="insight-title">{insight.title}</div>
              <div className="insight-description">{insight.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;
