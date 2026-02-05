import React, { useEffect, useRef } from 'react';

/**
 * Funnel chart component (custom DOM-based implementation)
 */
const FunnelChartComponent = ({ data }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Sort data in funnel order
    const funnelOrder = ['Application', 'Recruiter Screen', 'Partial Loop', 'Full Loop', 'Offer'];
    const sortedData = funnelOrder
      .map(stage => data.find(d => d.label === stage))
      .filter(item => item && item.value > 0);

    if (sortedData.length === 0) return;

    // Calculate total for percentage calculations
    const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0) || 1;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Colors matching dashboard theme
    const colors = ['#6b8aff', '#8b5cf6', '#f59e0b', '#10b981', '#34d399'];

    // Create funnel container
    const funnel = document.createElement('div');
    funnel.style.cssText = 'display: flex; flex-direction: column; gap: 20px; width: 100%; padding: 20px 0;';

    sortedData.forEach((item, index) => {
      // Calculate width percentage for bar (relative to total)
      const barWidthPercent = (item.value / totalValue) * 100;
      // Calculate percentage (relative to total)
      const percent = ((item.value / totalValue) * 100).toFixed(1);

      // Create row container
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 16px;';

      // Create circle with percentage
      const circle = document.createElement('div');
      const circleSize = Math.max(60, 80 - index * 8); // Circles get slightly smaller
      circle.style.cssText = `
        width: ${circleSize}px;
        height: ${circleSize}px;
        border-radius: 50%;
        background-color: ${colors[index % colors.length]};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: 700;
        font-size: 18px;
        color: white;
      `;
      circle.textContent = `${percent}%`;

      // Create bar section
      const barSection = document.createElement('div');
      barSection.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 6px;';

      // Create bar
      const bar = document.createElement('div');
      bar.style.cssText = `
        height: 32px;
        background-color: ${colors[index % colors.length]};
        border-radius: 4px;
        width: ${Math.max(barWidthPercent, 15)}%;
        min-width: 60px;
        transition: all 0.2s;
        cursor: pointer;
      `;

      bar.addEventListener('mouseenter', () => {
        bar.style.opacity = '0.8';
        bar.style.transform = 'scaleX(1.05)';
        bar.style.transformOrigin = 'left';
      });
      bar.addEventListener('mouseleave', () => {
        bar.style.opacity = '1';
        bar.style.transform = 'scaleX(1)';
      });

      // Create label and count container
      const labelCount = document.createElement('div');
      labelCount.style.cssText = 'display: flex; gap: 8px; font-size: 12px; color: var(--text-tertiary);';

      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.cssText = 'font-weight: 600; color: var(--text-secondary);';

      const count = document.createElement('span');
      count.textContent = item.value.toLocaleString();

      labelCount.appendChild(label);
      labelCount.appendChild(count);

      barSection.appendChild(bar);
      barSection.appendChild(labelCount);

      row.appendChild(circle);
      row.appendChild(barSection);

      funnel.appendChild(row);
    });

    containerRef.current.appendChild(funnel);
  }, [data]);

  return <div ref={containerRef} style={{ width: '100%', minHeight: '300px' }}></div>;
};

export default FunnelChartComponent;
