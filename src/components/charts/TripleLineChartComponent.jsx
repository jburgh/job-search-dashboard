import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Triple line chart component for comparing three datasets
 */
const TripleLineChartComponent = ({
  data,
  label1,
  label2,
  label3,
  color1 = '#6b8aff',
  color2 = '#f59e0b',
  color3 = '#10b981',
  isPercentage = false,
  useDailyData = false
}) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    const labels = data.map(d => d.label);
    const dataset1 = data.map(d => d.value1 ?? d.applications ?? 0);
    const dataset2 = data.map(d => d.value2 ?? d.followUps ?? 0);
    const dataset3 = data.map(d => d.value3 ?? d.responded ?? 0);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const pointRadius = useDailyData ? 5 : 2;
    const pointHoverRadius = useDailyData ? 7 : 3;

    // Calculate max value to determine appropriate step size
    const maxValue = Math.max(...dataset1, ...dataset2, ...dataset3);
    let stepSize;
    if (maxValue <= 10) {
      stepSize = 1;
    } else if (maxValue <= 20) {
      stepSize = 2;
    } else if (maxValue <= 50) {
      stepSize = 5;
    } else if (maxValue <= 100) {
      stepSize = 10;
    } else {
      stepSize = 20;
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: label1,
            data: dataset1,
            borderColor: color1,
            backgroundColor: color1 + '33',
            fill: false,
            tension: 0.2,
            pointRadius: pointRadius,
            pointHoverRadius: pointHoverRadius
          },
          {
            label: label2,
            data: dataset2,
            borderColor: color2,
            backgroundColor: color2 + '33',
            fill: false,
            tension: 0.2,
            pointRadius: pointRadius,
            pointHoverRadius: pointHoverRadius
          },
          {
            label: label3,
            data: dataset3,
            borderColor: color3,
            backgroundColor: color3 + '33',
            fill: false,
            tension: 0.2,
            pointRadius: pointRadius,
            pointHoverRadius: pointHoverRadius
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        stacked: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: stepSize,
              callback: function (value) {
                return isPercentage ? value + '%' : value;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, label1, label2, label3, color1, color2, color3, isPercentage, useDailyData]);

  return <canvas ref={canvasRef} style={{ maxHeight: '200px' }}></canvas>;
};

export default TripleLineChartComponent;
