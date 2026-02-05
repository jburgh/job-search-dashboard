import React from 'react';

/**
 * Grid of key metrics cards for the dashboard
 */
const KeyMetricsGrid = ({ metrics }) => {
  return (
    <div className="metrics-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>Total applications</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          marginBottom: '0.25rem'
        }}>{metrics.totalApplications}</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          {metrics.byTimeWindow.thisMonth} this month
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>Callback rate</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--success)',
          marginBottom: '0.25rem'
        }}>{metrics.responseRate.percentage}%</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          {metrics.responseRate.count} engagements
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>Interview rate</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--accent-primary)',
          marginBottom: '0.25rem'
        }}>{metrics.interviewConversionRate.percentage}%</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          {metrics.interviewConversionRate.count} reached interviews
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>Active pipeline</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          marginBottom: '0.25rem'
        }}>{metrics.pipeline.total}</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          {metrics.pipeline.byStatus.Applied} idle · {metrics.pipeline.byStatus["In Progress"]} in progress
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>Offers</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--warning)',
          marginBottom: '0.25rem'
        }}>{metrics.offerRate.count}</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          {metrics.offerRate.percentage}% of applications
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label" style={{
          fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
          marginBottom: '0.5rem'
        }}>This week</div>
        <div className="stat-value" style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          marginBottom: '0.25rem'
        }}>{metrics.byTimeWindow.thisWeek}</div>
        <div className="stat-detail" style={{
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)'
        }}>
          applications submitted
        </div>
      </div>
    </div>
  );
};

export default KeyMetricsGrid;
