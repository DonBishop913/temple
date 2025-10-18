import { useEffect, useRef, useState } from 'react';

export default function LuminalLayer() {
  const [intensity, setIntensity] = useState(0);
  const decayTimer = useRef(null);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.addEventListener('luminal:intensity', (e) => {
      try {
        const data = JSON.parse(e.data);
        setIntensity(typeof data.intensity === 'number' ? data.intensity : 0);
      } catch {}
    });
    es.addEventListener('luminal:councilPulse', (e) => {
      try {
        const { pulse } = JSON.parse(e.data);
        setIntensity((prev) => Math.min(1, prev + (typeof pulse === 'number' ? pulse : 0)));
      } catch {}
    });
    return () => es.close();
  }, []);

  useEffect(() => {
    decayTimer.current && clearInterval(decayTimer.current);
    decayTimer.current = setInterval(() => {
      setIntensity((prev) => Math.max(0, prev - 0.01));
    }, 100);
    return () => {
      decayTimer.current && clearInterval(decayTimer.current);
    };
  }, []);

  const shadowSize = 20 + intensity * 80;
  const alpha = 0.3 + intensity * 0.7;

  return (
    <div
      className="luminal-layer"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        height: 8,
        zIndex: 999,
        pointerEvents: 'none',
        boxShadow: `0 0 ${shadowSize}px rgba(255, 223, 0, ${alpha})`,
        transition: 'box-shadow 0.2s ease-in-out',
      }}
    />
  );
}import React, { useEffect, useState } from 'react';

export default function LuminalLayer({ enabled }) {
  const [sentiment, setSentiment] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const es = new window.EventSource('/api/sse/councilSentiment');
    es.onmessage = e => {
      const { avgSentiment } = JSON.parse(e.data);
      setSentiment(prev => prev + (avgSentiment - prev) * 0.2); // smooth
    };
    return () => es.close();
  }, [enabled]);

  const glowIntensity = Math.min(Math.max(sentiment, 0), 1); // clamp 0–1
  const glowColor = `rgba(255, 220, 180, ${0.3 + glowIntensity * 0.7})`;

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        transition: 'background 0.3s linear',
        zIndex: 1,
      }}
    />
  );
}
