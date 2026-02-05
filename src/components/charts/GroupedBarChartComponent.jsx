import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Grouped bar chart component for comparing callback and interview rates
 */
const GroupedBarChartComponent = ({ data }) => {
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
        labels: data.labels,
        datasets: [
          {
            label: 'Callback rate',
            data: data.responseRates,
            backgroundColor: '#6b8aff'
          },
          {
            label: 'Interview rate',
            data: data.interviewRates,
            backgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#9ca3af' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9ca3af',
              callback: (value) => value + '%'
            },
            grid: { color: '#2a3248' }
          },
          x: {
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

  return <canvas ref={canvasRef} style={{ maxHeight: '300px' }}></canvas>;
};

export default GroupedBarChartComponent;
