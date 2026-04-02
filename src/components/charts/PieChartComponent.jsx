import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Pie chart component
 */
const PieChartComponent = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labelColors = {
      Rejected: '#8b5cf6',
      Ghosted: '#f59e0b',
      Withdrew: '#10b981',
      Scam: '#ff5a3d',
      'Declined Offer': '#3b82f6',
      'Accepted Offer': '#ff2da6',
      Unknown: '#94a3b8'
    };
    const fallbackColors = ['#8b5cf6', '#f59e0b', '#10b981', '#ff5a3d', '#3b82f6', '#ff2da6'];

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => `${d.label} (${d.value})`),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map((d, index) => labelColors[d.label] || fallbackColors[index % fallbackColors.length]),
          borderWidth: 0,
          borderColor: 'transparent',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '52%',
        layout: {
          padding: 14
        },
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#9ca3af', padding: 15 }
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

export default PieChartComponent;
