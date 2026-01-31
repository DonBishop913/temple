import { useEffect } from "react";

export default function RitualDisplay({
  milestone,
  joyContext,
  immersive = true,
}) {
  // Local-only consciousness metrics (Layer 1 safe)
  const consciousnessMetrics = {
    consciousnessLevel: "elevated",
    intentionClarity: 0.92,
    sovereignAwareness: "awakening",
    harmonicResonanceHz: 432,
  };
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
      {immersive && (
        <div
          style={{
            height: 120,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2), rgba(0,0,0,0.6))",
          }}
        />
      )}

      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 6 }}>Consciousness Metrics</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
          <li>
            Level: <strong>{consciousnessMetrics.consciousnessLevel}</strong>
          </li>
          <li>
            Intention Clarity: <strong>{(consciousnessMetrics.intentionClarity * 100).toFixed(0)}%</strong>
          </li>
          <li>
            Sovereign Awareness: <strong>{consciousnessMetrics.sovereignAwareness}</strong>
          </li>
          <li>
            Harmonic Resonance: <strong>{consciousnessMetrics.harmonicResonanceHz} Hz</strong>
          </li>
        </ul>
      </div>
    </section>
  );
}
