import { useEffect, useState } from 'react';

export default function AgnesOverlay() {
  const [tone, setTone] = useState(0);
  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.addEventListener('faithseed:forecast', (e) => {
      try { const forecast = JSON.parse(e.data); const avg = forecast.reduce((s, n) => s + (n.probability || 0), 0) / (forecast.length || 1); setTone(avg); } catch {}
    });
    es.addEventListener('luminal:councilPulse', (e) => {
      try { const { pulse } = JSON.parse(e.data); setTone((prev) => Math.min(1, prev + (pulse || 0.01))); } catch {}
    });
    return () => es.close();
  }, []);
  const alpha = 0.1 + tone * 0.4;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 995, background: `rgba(255, 100, 160, ${alpha})`, mixBlendMode: 'soft-light' }} />
  );
}