import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Horizontal stacked bar chart showing applications broken down by interviews, other callbacks, and no response.
 */
const StackedBarChartComponent = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Offers',
            data: data.map(d => d.offers),
            backgroundColor: '#ef4444',
            borderRadius: 6
          },
          {
            label: 'Interviews',
            data: data.map(d => Math.max(0, d.interviews - d.offers)),
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Callbacks',
            data: data.map(d => Math.max(0, d.callbacks - d.interviews)),
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'No Response',
            data: data.map(d => Math.max(0, d.applications - d.callbacks)),
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#9ca3af' }
          },
          tooltip: {
            enabled: false,
            external: (context) => {
              let el = document.getElementById('stacked-bar-tooltip');
              if (!el) {
                el = document.createElement('div');
                el.id = 'stacked-bar-tooltip';
                el.style.cssText = 'position:fixed;pointer-events:none;background:#1e293b;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:13px;line-height:1.5;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;transition:opacity 0.15s;';
                document.body.appendChild(el);
              }
              const { tooltip } = context;
              if (tooltip.opacity === 0) {
                el.style.opacity = '0';
                return;
              }
              const item = tooltip.dataPoints?.[0];
              if (!item) return;
              const entry = data[item.dataIndex];
              const ds = item.dataset;
              const color = ds.backgroundColor;
              let html = `<div style="margin-bottom:2px;font-weight:600">${entry.label}</div>`;
              const swatch = `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:6px"></span>`;
              if (ds.label === 'Callbacks') {
                html += `<div>${swatch}Callbacks: ${entry.callbacks}</div>`;
                const details = [];
                if (entry.interviews > 0) details.push(`${entry.interviews} interview${entry.interviews !== 1 ? 's' : ''}`);
                if (entry.offers > 0) details.push(`${entry.offers} offer${entry.offers !== 1 ? 's' : ''}`);
                if (details.length > 0) {
                  html += `<div style="font-style:italic;color:#9ca3af;padding-left:16px">includes ${details.join(', ')}</div>`;
                }
              } else if (ds.label === 'Interviews') {
                html += `<div>${swatch}Interviews: ${entry.interviews}</div>`;
                if (entry.offers > 0) {
                  html += `<div style="font-style:italic;color:#9ca3af;padding-left:16px">includes ${entry.offers} offer${entry.offers !== 1 ? 's' : ''}</div>`;
                }
              } else {
                html += `<div>${swatch}${ds.label}: ${item.raw}</div>`;
              }
              el.innerHTML = html;
              el.style.opacity = '1';
              const pos = context.chart.canvas.getBoundingClientRect();
              el.style.left = pos.left + tooltip.caretX + 10 + 'px';
              el.style.top = pos.top + tooltip.caretY + 'px';
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: '#9ca3af', stepSize: 1 },
            grid: { color: '#2a3248' }
          },
          y: {
            stacked: true,
            ticks: { color: '#9ca3af' },
            grid: { display: false }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={canvasRef} style={{ maxHeight: '500px' }}></canvas>;
};

export default StackedBarChartComponent;
