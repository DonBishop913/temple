import React from "react";

export default function NodeInsightPanel({ node, onClose }) {
  const triggerIntervention = (type) => {
    fetch(`/api/nodes/${node.nodeId}/intervene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
      .then((res) => res.json())
      .then((data) => {
        // lightweight confirmation; could be replaced with toast
        alert(`Intervention "${type}" sent! Response: ${data.status}`);
      })
      .catch(() => alert("Failed to trigger intervention"));
  };

  // Dynamic suggestions based on predictive metrics
  const suggestions = [];
  if ((node.forecast ?? 0) > 0.8)
    suggestions.push("Schedule celebratory feedback pulse");
  if ((node.joyProbability ?? 0) < 0.4)
    suggestions.push("Initiate motivational ritual");
  if ((node.forecast ?? 0) > 0.6 && (node.joyProbability ?? 0) > 0.5)
    suggestions.push("Encourage mentorship engagement");
  if (suggestions.length === 0) suggestions.push("Monitor closely");

  return (
    <div
      className="node-insight-panel"
      style={{
        position: "absolute",
        top: "10%",
        right: "10%",
        width: "320px",
        background: "rgba(0,0,0,0.85)",
        color: "#FFD700",
        padding: "16px",
        borderRadius: "12px",
        zIndex: 1000,
      }}
    >
      <button onClick={onClose} style={{ float: "right", color: "#fff" }}>
        ✖
      </button>
      <h3>Node {node.nodeId}</h3>
      <p>
        <strong>Forecast:</strong> {((node.forecast ?? 0) * 100).toFixed(1)}%
      </p>
      <p>
        <strong>Joy Probability:</strong>{" "}
        {((node.joyProbability ?? 0) * 100).toFixed(1)}%
      </p>
      <p>
        <strong>Next Predicted Pulse:</strong>{" "}
        {node.nextPulseTime
          ? new Date(node.nextPulseTime).toLocaleTimeString()
          : "—"}
      </p>

      <h4>Suggested Interventions:</h4>
      <ul>
        {suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h4>Direct Actions:</h4>
      <button
        onClick={() => triggerIntervention("mentorship")}
        style={{ margin: "4px" }}
      >
        Send Mentorship Pulse
      </button>
      <button
        onClick={() => triggerIntervention("ritual")}
        style={{ margin: "4px" }}
      >
        Initiate Motivational Ritual
      </button>
      <button
        onClick={() => triggerIntervention("celebration")}
        style={{ margin: "4px" }}
      >
        Trigger Joy Celebration
      </button>
    </div>
  );
}
