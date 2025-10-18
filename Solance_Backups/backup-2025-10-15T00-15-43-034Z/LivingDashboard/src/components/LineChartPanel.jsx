import React from 'react';

export default function LineChartPanel({ data = [] }) {
  // Minimal SVG line chart
  const width = 480, height = 120, pad = 8;
  const values = data.map(x => x.value ?? x);
  const maxV = Math.max(1, ...values);
  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2);
    const y = height - pad - (v / maxV) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <section aria-label="Line Chart" style={{ padding: 12 }}>
      <h3>Joy Scores (historical)</h3>
      <svg width={width} height={height}>
        <polyline fill="none" stroke="#0cf" strokeWidth="2" points={pts} />
      </svg>
    </section>
  );
}
