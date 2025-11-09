import React from "react";

export default function EthicalPulsePanel({ nodes = [] }) {
  return (
    <section aria-label="Ethical Pulse" style={{ padding: 12 }}>
      <h3>Ethical Pulse Alerts</h3>
      <ul>
        {nodes.map((n, i) =>
          n.ethicalAlert ? (
            <li
              key={i}
              style={{
                color: n.ethicalAlert.severity === "high" ? "#f33" : "#fc3",
              }}
            >
              Node {n.id}: {n.ethicalAlert.severity} —{" "}
              {n.ethicalAlert.reason || "Deviation detected"}
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
