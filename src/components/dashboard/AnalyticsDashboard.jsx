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

  // Calculate date range boundaries
  const dateRange = useMemo(() => {
    if (timeRange === 'all') return { startDateStr: null, endDateStr: null, startMonth: null, endMonth: null };

    const now = new Date();
    let startDateStr = null;
    let endDateStr = null;

    // Helper to format date as YYYY-MM-DD string
    const formatDate = (date) => date.toISOString().split('T')[0];

    switch (timeRange) {
      case 'past30':
        startDateStr = formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
      case 'past60':
        startDateStr = formatDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
        break;
      case 'past90':
        startDateStr = formatDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
        break;
      case 'past12months':
        startDateStr = formatDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
        break;
      case 'thisYear':
        startDateStr = `${now.getFullYear()}-01-01`;
        break;
      case 'lastYear':
        startDateStr = `${now.getFullYear() - 1}-01-01`;
        endDateStr = `${now.getFullYear() - 1}-12-31`;
        break;
      default:
        return { startDateStr: null, endDateStr: null, startMonth: null, endMonth: null };
    }

    // Extract YYYY-MM for month filtering
    const startMonth = startDateStr ? startDateStr.substring(0, 7) : null;
    const endMonth = endDateStr ? endDateStr.substring(0, 7) : null;

    return { startDateStr, endDateStr, startMonth, endMonth };
  }, [timeRange]);

  // Filter jobs by date range
  const filteredJobs = useMemo(() => {
    if (timeRange === 'all') return jobs;

    const { startDateStr, endDateStr } = dateRange;

    return jobs.filter(job => {
      if (!job.dateApplied) return false;
      const jobDateStr = job.dateApplied; // Already in YYYY-MM-DD format
      if (startDateStr && jobDateStr < startDateStr) return false;
      if (endDateStr && jobDateStr > endDateStr) return false;
      return true;
    });
  }, [jobs, timeRange, dateRange]);

  // Calculate metrics using filtered jobs
  const { overview, timeData, companyData, insights } = useMemo(() => {
    const overview = analytics.getJobSearchOverview(filteredJobs);
    const timeData = analytics.getTimeBasedAnalytics(filteredJobs);
    const companyData = analytics.getCompanyPriorityAnalytics(filteredJobs);
    const insights = generateInsights(overview, timeData, companyData);

    return { overview, timeData, companyData, insights };
  }, [filteredJobs]);

  // Calculate constant metrics from unfiltered jobs (for pipeline, this week, this month)
  const constantOverview = useMemo(() => {
    return analytics.getJobSearchOverview(jobs);
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

  const progressionChartData = analytics.getProgressionBreakdownForResponded(filteredJobs);

  // Combine monthly applications and response activity into a single dataset
  const appsByMonth = {};
  (timeData.applicationsPerMonth.byMonth || []).forEach(item => {
    appsByMonth[item.month] = { label: item.label, applications: item.count };
  });

  const respByMonth = {};
  (timeData.responseRateByMonth || []).forEach(item => {
    respByMonth[item.month] = { label: item.label, followUps: item.followUps || 0, responded: item.responded || 0 };
  });

  // Filter month keys to only include months within the selected date range
  const monthKeys = Array.from(new Set([...Object.keys(appsByMonth), ...Object.keys(respByMonth)]))
    .filter(monthKey => {
      if (dateRange.startMonth && monthKey < dateRange.startMonth) return false;
      if (dateRange.endMonth && monthKey > dateRange.endMonth) return false;
      return true;
    })
    .sort();

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
      {/* Dashboard Time Range Filter */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Time range:</span>
          <TimeRangeButton range="past30" label="Past 30 days" />
          <TimeRangeButton range="past60" label="Past 60 days" />
          <TimeRangeButton range="past90" label="Past 90 days" />
          <TimeRangeButton range="past12months" label="Past 12 months" />
          <TimeRangeButton range="thisYear" label="This Year" />
          <TimeRangeButton range="lastYear" label="Last Year" />
          <TimeRangeButton range="all" label="All time" />
        </div>
        {timeRange !== 'all' && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Showing {filteredJobs.length} of {jobs.length} applications
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <KeyMetricsGrid metrics={overview} constantMetrics={constantOverview} />

      {/* Charts Grid */}
      <div className="charts-section">
        {/* Large charts - full width */}
        <div className="chart-large">
          <ChartCard title="Applications & response activity">
            {combinedChartData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No data available for this time range
              </div>
            ) : (
              <TripleLineChartComponent
                data={combinedChartData}
                label1="Applications"
                label2="Responses and rejections"
                label3="Actual callbacks"
                color1="#6b8aff"
                color2="#f59e0b"
                color3="#10b981"
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
            <ChartCard title="Callbacks by progression">
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
                      const count = filteredJobs.filter(j => j.status === status).length;
                      return (
                        <tr key={status}>
                          <td><StatusBadge status={status} /></td>
                          <td><strong>{count}</strong></td>
                          <td>{filteredJobs.length > 0 ? Math.round((count / filteredJobs.length) * 100) : 0}%</td>
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
