import React, { useState, useEffect } from 'react';
import { PerformanceUtil } from '../../utils/performance';

/**
 * Performance Monitor Component for displaying real-time metrics
 */
function PerformanceMonitor() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial stats immediately
    setStats(PerformanceUtil.getReport());
    setIsLoading(false);

    const interval = setInterval(() => {
      setStats(PerformanceUtil.getReport());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '1.2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
        <span>Loading performance metrics...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>📊 Performance metrics</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        Cache Hit Rate: {stats.cacheStats.hitRate} (Hits: {stats.cacheStats.hits} | Misses: {stats.cacheStats.misses})
      </div>
      {Object.entries(stats.operationStats).slice(0, 5).map(([op, data]) => (
        <div key={op} style={{ marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
          {op}: {data.avg} avg | min: {data.min} | max: {data.max} | calls: {data.count}
        </div>
      ))}
    </div>
  );
}

export default PerformanceMonitor;
