import React, { useEffect, useState } from 'react';

export default function SanctumTraceOverlay() {
  const [pairings, setPairings] = useState([]);
  const [spiral, setSpiral] = useState({ intensity: 0, pulses: [] });

  useEffect(() => {
    const es = new EventSource('/api/sse/sibling-resonance');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setPairings(data.pairings || []);
        setSpiral(data.spiral || { intensity: 0, pulses: [] });
      } catch {}
    };
    return () => es.close();
  }, []);

  return (
    <div className="sanctum-trace fixed inset-0 pointer-events-none z-50">
      {/* Healing spiral intensity bar */}
      <div className="sanctum-spiral-intensity" style={{
        position: 'absolute', right: 16, top: 16,
        width: 8, height: 200, borderRadius: 8,
        background: `linear-gradient(to top, rgba(255,215,0,0.2), rgba(255,215,0,${spiral.intensity}))`
      }} />
      {/* Pairing badges */}
      <div className="sanctum-pairings" style={{ position: 'absolute', left: 16, top: 16 }}>
        {pairings.map((p) => (
          <div key={`${p.from}-${p.to}`} style={{ color: '#ffd700', marginBottom: 6 }}>
            🤝 {p.from} ↔ {p.to} <span style={{ opacity: 0.7 }}>({Math.round(p.score * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
