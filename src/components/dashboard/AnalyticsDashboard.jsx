import React, { useMemo, useState } from 'react';
import { JOB_STATUSES } from '../../constants/jobStatuses';
import { STATUSES } from '../../constants/jobStatuses';
import { analytics } from '../../utils/analytics';
import {
  ChartCard,
  TripleLineChartComponent,
  FunnelChartComponent,
  PieChartComponent
} from '../charts';
import StatusBadge from '../common/StatusBadge';
import KeyMetricsGrid from './KeyMetricsGrid';
import InsightsPanel from './InsightsPanel';
import { generateInsights } from './generateInsights';

/**
 * Main Analytics Dashboard Component
 */
const AnalyticsDashboard = ({ jobs }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Helper function to filter data by time range
  const filterDataByTimeRange = (data, range) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (range) {
      case 'past30':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'past12months':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (customStart) startDate = new Date(customStart);
        break;
      case 'all':
      default:
        return data;
    }

    if (!startDate) return data;

    return data.filter(item => {
      // Parse label like "Jan 2025" or "January 2025"
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const labelLower = item.label.toLowerCase();
      const yearMatch = item.label.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;

      let month = null;
      for (let i = 0; i < monthNames.length; i++) {
        if (labelLower.includes(monthNames[i])) {
          month = i;
          break;
        }
      }

      if (!year || month === null) return true;
      const itemDate = new Date(year, month, 1);
      if (itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  };

  // Check if filtered data spans less than 1 month for daily granularity
  const shouldUseDailyData = (data) => {
    // Use prominent points for sparse data (3 or fewer data points)
    if (data.length <= 3) return true;

    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const parseMonthYear = (label) => {
      const labelLower = label.toLowerCase();
      const yearMatch = label.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;

      let month = null;
      for (let i = 0; i < monthNames.length; i++) {
        if (labelLower.includes(monthNames[i])) {
          month = i;
          break;
        }
      }
      return { year, month };
    };

    const first = parseMonthYear(data[0].label);
    const last = parseMonthYear(data[data.length - 1].label);

    if (!first.year || first.month === null || !last.year || last.month === null) return false;

    const firstDate = new Date(first.year, first.month, 1);
    const lastDate = new Date(last.year, last.month, 1);
    const diffTime = Math.abs(lastDate - firstDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    return diffMonths < 1;
  };

  // Calculate all metrics
  const { overview, timeData, companyData, insights } = useMemo(() => {
    const overview = analytics.getJobSearchOverview(jobs);
    const timeData = analytics.getTimeBasedAnalytics(jobs);
    const companyData = analytics.getCompanyPriorityAnalytics(jobs);
    const insights = generateInsights(overview, timeData, companyData);

    return { overview, timeData, companyData, insights };
  }, [jobs]);

  // Prepare chart data
  const pipelineChartData = (() => {
    const stages = ['Application', 'Recruiter Screen', 'Partial Loop', 'Full Loop', 'Offer'];
    const activeJobs = jobs.filter(j => j.status === 'In Progress' || j.status === 'Applied');
    return stages.map(stage => ({
      label: stage,
      value: activeJobs.filter(j => j.progression === stage).length
    }));
  })();

  const closureChartData = Object.entries(overview.closureReasons.counts)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      label: reason,
      value: count
    }));

  const progressionChartData = analytics.getProgressionBreakdownForResponded(jobs);

  // Combine monthly applications and response activity into a single dataset
  const appsByMonth = {};
  (timeData.applicationsPerMonth.byMonth || []).forEach(item => {
    appsByMonth[item.month] = { label: item.label, applications: item.count };
  });

  const respByMonth = {};
  (timeData.responseRateByMonth || []).forEach(item => {
    respByMonth[item.month] = { label: item.label, followUps: item.followUps || 0, responded: item.responded || 0 };
  });

  const monthKeys = Array.from(new Set([...Object.keys(appsByMonth), ...Object.keys(respByMonth)])).sort();

  const combinedChartData = monthKeys.map(monthKey => {
    const app = appsByMonth[monthKey] || {
      label: (() => {
        const [y, m] = monthKey.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      })(), applications: 0
    };
    const resp = respByMonth[monthKey] || { followUps: 0, responded: 0 };
    return {
      label: app.label,
      applications: app.applications,
      followUps: resp.followUps,
      responded: resp.responded
    };
  });

  // Filter data by selected time range
  const filteredChartData = filterDataByTimeRange(combinedChartData, timeRange);

  const TimeRangeButton = ({ range, label }) => (
    <button
      onClick={() => setTimeRange(range)}
      style={{
        padding: '0.4rem 0.8rem',
        fontSize: '0.85rem',
        borderRadius: '6px',
        border: timeRange === range ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
        background: timeRange === range ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        color: timeRange === range ? 'white' : 'var(--text-primary)',
        cursor: 'pointer',
        fontWeight: timeRange === range ? '600' : '500',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="analytics-dashboard">
      {/* Key Metrics */}
      <KeyMetricsGrid metrics={overview} />

      {/* Charts Grid */}
      <div className="charts-section">
        {/* Large charts - full width */}
        <div className="chart-large">
          <ChartCard title="Applications & response activity">
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <TimeRangeButton range="past30" label="Past 30 days" />
              <TimeRangeButton range="past12months" label="Past 12 months" />
              <TimeRangeButton range="thisYear" label="This Year" />
              <TimeRangeButton range="lastYear" label="Last Year" />
              <TimeRangeButton range="all" label="All time" />
            </div>
            {filteredChartData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No data available for this time range
              </div>
            ) : (
              <TripleLineChartComponent
                data={filteredChartData}
                label1="Applications"
                label2="Responses and rejections"
                label3="Actual callbacks"
                color1="#6b8aff"
                color2="#f59e0b"
                color3="#10b981"
                useDailyData={shouldUseDailyData(filteredChartData)}
              />
            )}
          </ChartCard>
        </div>

        {/* Medium Charts - Side by Side */}
        <div className="chart-row">
          <div className="chart-medium">
            <ChartCard title="Active pipeline status">
              <FunnelChartComponent data={pipelineChartData} />
            </ChartCard>
          </div>

          <div className="chart-medium">
            <ChartCard title="Closure reasons">
              <PieChartComponent data={closureChartData} />
            </ChartCard>
          </div>
        </div>

        {/* Responses and Statuses Side by Side */}
        <div className="chart-row">
          <div className="chart-medium">
            <ChartCard title="Responses by progression">
              <PieChartComponent data={progressionChartData} />
            </ChartCard>
          </div>

          <div className="chart-medium">
            <div className="stat-card">
              <h3 style={{
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '600'
              }}>
                Application statuses
              </h3>
              <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATUSES.map(status => {
                      const count = jobs.filter(j => j.status === status).length;
                      return (
                        <tr key={status}>
                          <td><StatusBadge status={status} /></td>
                          <td><strong>{count}</strong></td>
                          <td>{jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <InsightsPanel insights={insights} />
    </div>
  );
};

export default AnalyticsDashboard;
