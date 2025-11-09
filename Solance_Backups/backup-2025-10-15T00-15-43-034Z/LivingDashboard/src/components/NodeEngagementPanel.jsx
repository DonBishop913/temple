import React from "react";

export default function NodeEngagementPanel({ nodes = [], metrics = {} }) {
  return (
    <section aria-label="Node Engagement" style={{ padding: 12 }}>
      <h3>Engagement</h3>
      <ul>
        {nodes.map((n) => (
          <li key={n.id}>
            {n.name} — freq: {metrics[n.id]?.frequency ?? 0}, joy:{" "}
            {metrics[n.id]?.joy ?? 0}
          </li>
        ))}
      </ul>
    </section>
  );
}
