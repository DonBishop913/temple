import React from "react";

export default function FilterPanel({ metrics = [], onFilterChange }) {
  return (
    <section aria-label="Filters" style={{ padding: 12 }}>
      <h3>Filters</h3>
      <label>
        Metric:
        <select
          onChange={(e) =>
            onFilterChange && onFilterChange({ metric: e.target.value })
          }
        >
          {metrics.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: 12 }}>
        Window:
        <select
          onChange={(e) =>
            onFilterChange && onFilterChange({ window: e.target.value })
          }
        >
          {["1h", "24h", "7d"].map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
