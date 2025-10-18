import React from 'react';

export default function LatencyChart({ latencies = [], width = 600, height = 200 }) {
  const padding = 30;
  const nodes = Array.from(new Set(latencies.map((l) => l.nodeId || 'global')));
  const maxLatency = Math.max(50, ...latencies.map((l) => l.latencyMs || 0));
  const xScale = (i) => padding + (i * (width - 2 * padding)) / Math.max(1, nodes.length - 1);
  const yScale = (ms) => height - padding - (ms * (height - 2 * padding)) / maxLatency;
  const color = (i) => `hsl(${(i * 60) % 360}, 70%, 50%)`;

  const points = nodes.map((nodeId, i) => {
    const latest = [...latencies].reverse().find((l) => (l.nodeId || 'global') === nodeId);
    const x = xScale(i);
    const y = yScale(latest ? latest.latencyMs : 0);
    return { x, y, nodeId, color: color(i), latencyMs: latest?.latencyMs || 0 };
  });

  return (
    <svg width={width} height={height} role="img" aria-label="Alert Propagation Latency Chart">
      <rect x={0} y={0} width={width} height={height} fill="#111" />
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#888" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#888" />
      {/* Points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r={5} fill={p.color} />
          <text x={p.x + 6} y={p.y - 6} fill="#eee" fontSize={10}>{`${p.nodeId} ${Math.round(p.latencyMs)}ms`}</text>
        </g>
      ))}
    </svg>
  );
}