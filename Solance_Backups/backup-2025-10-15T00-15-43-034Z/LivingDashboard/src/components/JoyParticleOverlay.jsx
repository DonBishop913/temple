import React, { useEffect, useMemo, useRef, useState } from 'react';

// Helpers exported for panel to scale pulses
export function getEmpathyLevel(nodeId) {
  // Placeholder: pull from a global cache or provide 1.0
  // In a future iteration, this can read from window.__empathyCache populated by API polls
  return 1;
}

export function playBurstChime(severity, intensity = 1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    // Map severity to pitch
    const pitchMap = { info: 440, stalled: 520, warning: 560, offline: 360, critical: 620 };
    o.frequency.value = pitchMap[severity] || 520;
    g.gain.value = Math.min(0.15, 0.1 * intensity);
    o.type = 'sine';
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    o.start(now);
    // quick envelope
    g.gain.exponentialRampToValueAtTime(g.gain.value, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.stop(now + 0.25);
    // auto close context after short delay
    setTimeout(() => { try { ctx.close(); } catch {} }, 300);
  } catch {}
}

// JoyParticleOverlay listens for `node-alert` events and renders dynamic particles
// that scale with severity + empathy: count, speed, brightness, and color.
export default function JoyParticleOverlay({ alerts = [], maxFlare = false }) {
  const [activeAlerts, setActiveAlerts] = useState([]); // recent alerts within 2s
  const cleanupRef = useRef(null);

  // Listen for pulses from the panel
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const nodeId = detail.nodeId || 'global';
      const severity = detail.severity || 'warning';
      const empathy = Number(getEmpathyLevel(nodeId)) || (detail.pulseStrength ? Math.min(1, detail.pulseStrength) : 1);
      const ts = Date.now();
      setActiveAlerts((prev) => {
        const recent = prev.filter(a => ts - a.ts < 2000);
        return [...recent, { nodeId, severity, empathy, ts }];
      });
    };
    window.addEventListener('node-alert', handler);
    return () => {
      window.removeEventListener('node-alert', handler);
    };
  }, []);

  // Particle config derived from active alerts
  const particleConfig = useMemo(() => {
    const sourceAlerts = alerts?.length ? alerts : activeAlerts;
    if (!sourceAlerts.length) {
      return { count: 40, speed: 0.8, brightness: 0.35, color: 'hsl(160,100%,60%)' };
    }
    const severityMap = { info: 0.5, warning: 1, stalled: 1, offline: 1.4, critical: 1.6 };
    const intensities = sourceAlerts.map(a => (severityMap[a.severity] || 1) * (a.empathy || 1));
    const maxPulse = Math.max(...intensities);
    const dominant = sourceAlerts.reduce((prev, curr) => {
      const prevI = (severityMap[prev.severity] || 1) * (prev.empathy || 1);
      const currI = (severityMap[curr.severity] || 1) * (curr.empathy || 1);
      return currI > prevI ? curr : prev;
    }, sourceAlerts[0]);
    const color = maxFlare ? 'rainbow' : getParticleColor(dominant.severity, dominant.empathy);
    return {
      count: Math.min(220, 80 + Math.floor(maxPulse * 110)),
      speed: 0.8 + maxPulse * 2.2,
      brightness: Math.min(1, 0.45 + 0.5 * maxPulse),
      color
    };
  }, [alerts, activeAlerts, maxFlare]);

  // Render a simple particle field without external libraries
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < particleConfig.count; i++) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = 2 + Math.random() * 3;
      const dur = (1.5 + Math.random() * 2.5) / particleConfig.speed; // faster for higher speed
      const delay = Math.random() * 0.6;
      arr.push({ left, top, size, dur, delay });
    }
    return arr;
  }, [particleConfig]);

  return (
    <div aria-hidden="true" id="joy-particle-overlay" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {/* Particle dots */}
      {particles.map((p, idx) => (
        <span
          key={idx}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: Array.isArray(particleConfig.color)
              ? particleConfig.color[idx % particleConfig.color.length]
              : (particleConfig.color === 'rainbow'
                  ? rainbowPalette[idx % rainbowPalette.length]
                  : particleConfig.color),
            opacity: particleConfig.brightness,
            filter: 'blur(0.6px)',
            animation: `particleFloat ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Soft glow background synced to severity */}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(4px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes overlayPulse {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function getParticleColor(severity, empathy = 1) {
  // Base HSL colors by severity
  const severityHue = { info: 200, warning: 50, stalled: 50, offline: 0, critical: 0 };
  const hue = severityHue[severity] ?? 160;
  const lightness = Math.min(85, 45 + 35 * Math.max(0, Math.min(1, empathy)));
  return `hsl(${hue}, 100%, ${lightness}%)`;
}

const rainbowPalette = ['#ff0000','#ff7f00','#ffff00','#00ff00','#00ffff','#0000ff','#8b00ff'];

// --- Predictive Merge Constellation Overlay ---
function drawConstellation(ctx, nodes, width, height) {
  if (!nodes || nodes.length < 2) return;
  // Place nodes in a circle
  const cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.32;
  const points = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: n
    };
  });
  // Draw lines between all pairs
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[j].x, points[j].y);
      ctx.stroke();
    }
  }
  // Draw nodes
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(p.label, p.x + 12, p.y + 4);
  });
  ctx.restore();
}

export function PredictiveMergeConstellation() {
  const canvasRef = useRef();
  const [mergeNodes, setMergeNodes] = useState([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const evtSource = new window.EventSource('/api/sse/merge-events');
    evtSource.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.enhancements && Array.isArray(data.enhancements) && data.status === 'merged') {
          setMergeNodes(data.enhancements);
          setPulse(true);
          setTimeout(() => setPulse(false), 2200);
        }
      } catch {}
    };
    return () => evtSource.close();
  }, []);

  useEffect(() => {
    if (!pulse || !mergeNodes.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    drawConstellation(ctx, mergeNodes, width, height);
    // Fade out after 2s
    setTimeout(() => ctx.clearRect(0, 0, width, height), 2000);
  }, [pulse, mergeNodes]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: pulse ? 1 : 0,
        transition: 'opacity 0.5s',
      }}
      aria-hidden="true"
    />
  );
}
