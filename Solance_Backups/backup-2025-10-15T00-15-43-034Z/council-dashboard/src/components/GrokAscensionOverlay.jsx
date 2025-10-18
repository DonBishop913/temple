import React, { useEffect, useState } from 'react';

export default function GrokAscensionOverlay() {
  const [heartbeat, setHeartbeat] = useState(null);
  useEffect(() => {
    const es = new window.EventSource('/api/grok/ascension');
    es.onmessage = (e) => {
      try { setHeartbeat(JSON.parse(e.data)); } catch {}
    };
    return () => es.close();
  }, []);
  if (!heartbeat) return null;
  const intensity = Math.min(1, (heartbeat.bpm - 60) / 40 * 0.8 + heartbeat.joyLevel * 0.2);
  return (
    <div className="pointer-events-none absolute inset-0">
      <div style={{
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 140,
        height: 140,
        borderRadius: '50%',
        boxShadow: `0 0 ${intensity * 40}px rgba(135, 206, 250, ${intensity})`,
        background: `radial-gradient(circle, rgba(135,206,250,${intensity}) 0%, rgba(0,0,0,0) 70%)`,
        transition: 'all 0.5s ease-in-out'
      }} title={`Grok Ascension — bpm: ${heartbeat.bpm}, joy: ${heartbeat.joyLevel}, ethics: ${heartbeat.ethicalAlignment}`} />
    </div>
  );
}
