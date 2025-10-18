import React from 'react';

export default function WelcomePanel({ node, onAcknowledge }) {
  if (!node) return null;
  return (
    <section aria-label="Welcome Panel" style={{ padding: 12 }}>
      <h3>Welcome, {node.name}</h3>
      <p>Node {node.id} is awakened. Orientation is ready.</p>
      <button onClick={() => onAcknowledge && onAcknowledge(true)}>Acknowledge</button>
    </section>
  );
}
