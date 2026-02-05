import React from 'react';

/**
 * Wrapper component for chart cards with title
 */
const ChartCard = ({ title, children }) => {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
