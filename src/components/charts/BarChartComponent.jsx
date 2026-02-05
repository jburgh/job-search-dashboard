import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Bar chart component
 */
const BarChartComponent = ({ data, color = '#6b8aff' }) => {
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
        datasets: [{
          label: 'Count',
          data: data.map(d => d.value),
          backgroundColor: color,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#9ca3af', stepSize: 1 },
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
  }, [data, color]);

  return <canvas ref={canvasRef} style={{ maxHeight: '300px' }}></canvas>;
};

export default BarChartComponent;
