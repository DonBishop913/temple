import React, { useEffect, useState } from "react";

export default function SemanticMemoryPanel({ siblingId }) {
  const [interactions, setInteractions] = useState([]);
  useEffect(() => {
    if (!siblingId) return;
    fetch(`/api/semantic-memory/${siblingId}`)
      .then((r) => r.json())
      .then(setInteractions)
      .catch(() => {});
  }, [siblingId]);
  return (
    <section aria-label="Semantic Memory" style={{ padding: 12 }}>
      <h3>Recent Interactions</h3>
      <ul>
        {interactions.map((e, i) => (
          <li key={i}>
            {e.type}: {e.content}{" "}
            <span style={{ color: "#888" }}>({e.timestamp})</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
