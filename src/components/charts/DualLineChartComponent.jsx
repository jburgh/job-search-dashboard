import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Dual line chart component for comparing two datasets
 */
const DualLineChartComponent = ({
  data,
  label1,
  label2,
  color1 = '#6b8aff',
  color2 = '#10b981',
  isPercentage = false
}) => {
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
        datasets: [
          {
            label: label1,
            data: data.map(d => d.value1),
            borderColor: color1 + '60',  // Fainter (60% opacity)
            backgroundColor: color1 + '10',
            tension: 0.4,
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: color1 + '60'
          },
          {
            label: label2,
            data: data.map(d => d.value2),
            borderColor: color2,  // Prominent (full opacity)
            backgroundColor: color2 + '20',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: color2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: '#9ca3af',
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                return context.dataset.label + ': ' + value + (isPercentage ? '%' : '');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: isPercentage ? 100 : undefined,
            ticks: {
              color: '#9ca3af',
              stepSize: isPercentage ? undefined : 1,
              callback: (value) => value + (isPercentage ? '%' : '')
            },
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
  }, [data, label1, label2, color1, color2, isPercentage]);

  return <canvas ref={canvasRef} style={{ maxHeight: '300px' }}></canvas>;
};

export default DualLineChartComponent;
