/**
 * Generate insights based on metrics, time data, and company data
 */
export const generateInsights = (metrics, timeData, companyData) => {
  const insights = [];

  // Stale applications
  if (metrics.waiting.byDuration["60+ days"] > 0) {
    insights.push({
      type: 'warning',
      title: 'Stale Applications',
      description: `${metrics.waiting.byDuration["60+ days"]} applications have been waiting 60+ days. Consider following up or marking as closed.`
    });
  }

  // Most responsive companies
  const topCompanies = companyData.mostResponsiveCompanies.slice(0, 3);
  if (topCompanies.length > 0 && topCompanies[0].responseRate > 50) {
    insights.push({
      type: 'success',
      title: 'Responsive Companies',
      description: `${topCompanies[0].name} has a ${topCompanies[0].responseRate}% response rate from your ${topCompanies[0].total} applications. Consider applying to more roles there.`
    });
  }

  return insights;
};

export default generateInsights;
