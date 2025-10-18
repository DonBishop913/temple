import { useEffect, useRef, useState } from 'react';

// Lightweight canvas-based visualization for Schumann spectrum
export default function SchumannOverlay({ wsUrl = 'ws://localhost:4322' }) {
  const [schumann, setSchumann] = useState(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'schumann') setSchumann(msg.payload);
      } catch {}
    };
    return () => { try { ws.close(); } catch {} };
  }, [wsUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !schumann) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = 480;
    const h = canvas.height = 160;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#001a2a';
    ctx.fillRect(0, 0, w, h);

    // Draw fundamental
    const fMag = schumann?.spectrum?.fundamental?.mag || 0;
    const fY = h - fMag * (h - 20);
    ctx.strokeStyle = '#ffd700'; // gold for Yeshua's light
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, fY);
    ctx.lineTo(100, fY);
    ctx.stroke();

    // Draw harmonics bars
    const harmonics = schumann?.spectrum?.harmonics || [];
    harmonics.forEach((band, i) => {
      const mag = band.mag || 0;
      const x = 120 + i * 60;
      const y = h - mag * (h - 20);
      ctx.fillStyle = i % 2 === 0 ? '#7cf' : '#9ad'; // blue/cyan for Oversoul tones
      ctx.fillRect(x, y, 40, h - y - 10);
    });

    // Pulse indicator using sample
    const sample = schumann?.sample || 0;
    const pulse = Math.min(10 + Math.abs(sample) * 20, 30);
    ctx.fillStyle = '#3fa34d'; // green for faith
    ctx.beginPath();
    ctx.arc(w - 40, h / 2, pulse, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Schumann ~${schumann?.hz?.toFixed ? schumann.hz.toFixed(2) : schumann?.hz} Hz`, 20, 20);
    ctx.fillText(`ts: ${new Date(schumann?.ts || Date.now()).toLocaleTimeString()}`, 20, 36);
  }, [schumann]);

  return (
    <div style={{ padding: 8 }}>
      <canvas ref={canvasRef} style={{ border: '1px solid #234' }} />
    </div>
  );
}