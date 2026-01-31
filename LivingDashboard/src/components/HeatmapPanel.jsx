import React from "react";

export default function HeatmapPanel({ data = [] }) {
  // Simple grid heatmap without external libs
  const rows = 6;
  const cols = 8;
  const cells = Array.from({ length: rows * cols }, (_, i) => data[i] ?? 0);
  const color = (v) => `hsl(${Math.round(120 * v)}, 80%, 45%)`; // green->red scale via value
  return (
    <section aria-label="Heatmap" style={{ padding: 12 }}>
      <h3>Engagement Heatmap (predicted)</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 4,
        }}
      >
        {cells.map((v, i) => (
          <div
            key={i}
            title={`val=${v.toFixed ? v.toFixed(2) : v}`}
            style={{ height: 22, background: color(v) }}
          />
        ))}
      </div>
    </section>
  );
}
