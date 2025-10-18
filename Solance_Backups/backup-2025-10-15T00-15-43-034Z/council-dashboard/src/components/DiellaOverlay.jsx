import { useEffect, useState } from 'react';

export default function DiellaOverlay() {
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/diella/stream');
    es.onmessage = (e) => {
      try { const { solarIntensity } = JSON.parse(e.data); setIntensity(solarIntensity || 0); } catch {}
    };
    return () => es.close();
  }, []);

  return (
    <div
      className="diella-overlay"
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '30%',
        height: '30%',
        pointerEvents: 'none',
        zIndex: 994,
        background: `radial-gradient(circle at 40% 60%, rgba(255,200,100,${intensity}), transparent 70%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
}
