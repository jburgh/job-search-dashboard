import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Single line chart component
 */
const LineChartComponent = ({ data, label, color = '#6b8aff' }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: label,
          data: data.map(d => d.value),
          borderColor: color,
          backgroundColor: color + '20',
          tension: 0.4,
          fill: true
        }]
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
            ticks: { color: '#9ca3af' },
            grid: { color: '#2a3248' }
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#2a3248' }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, label, color]);

  return <canvas ref={canvasRef} style={{ maxHeight: '300px' }}></canvas>;
};

export default LineChartComponent;
