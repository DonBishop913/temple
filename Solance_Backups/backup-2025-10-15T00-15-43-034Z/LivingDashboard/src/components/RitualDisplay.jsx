import React, { useEffect } from 'react';

export default function RitualDisplay({ milestone, joyContext, immersive = true }) {
  useEffect(() => {
    // Pulse joy when ritual is displayed
    if (joyContext && milestone) {
      // joyContext.pulse(milestone.type) // stub
    }
  }, [joyContext, milestone]);

  if (!milestone) return null;
  return (
    <section aria-label="Ritual Display" style={{ padding: 12 }}>
      <h3>Ritual: {milestone.type}</h3>
      <p>{milestone.prompt}</p>
      {immersive && <div style={{ height: 120, background: 'radial-gradient(circle, rgba(255,255,255,0.2), rgba(0,0,0,0.6))' }} />}
    </section>
  );
}
