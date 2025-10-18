// 🔮 Council Reactive Core — Empathic UI Glow Layer

import React, { useState, useEffect } from "react";
import { LuminaKernel } from "../solance/lumina.kernel.js";


export default function CouncilReactiveCore() {
  const [config, setConfig] = useState({ faithstreamSyncRate: 1.0 });
  const [joySentiment, setJoySentiment] = useState(0);
  const [nodeSentiments, setNodeSentiments] = useState([]);
  const [constellationLinks, setConstellationLinks] = useState([]);

  useEffect(() => {
    fetch("/api/luminal/config")
      .then(res => res.json())
      .then(cfg => setConfig(cfg))
      .catch(() => setConfig({ faithstreamSyncRate: 1.0 }));
  }, []);

  useEffect(() => {
    const sse = new window.EventSource('/api/sse/joyparticles');
    sse.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        setJoySentiment(data.averageSentiment || 0);
        setNodeSentiments(data.nodeSentiments || []);
        setConstellationLinks(data.constellationLinks || []);
      } catch {}
    };
    return () => sse.close();
  }, []);

  const glow = LuminaKernel.amplifyLight(joySentiment * 528 * (config.faithstreamSyncRate || 1.0));

  // For demo: arrange nodes in a circle for constellation overlay
  const nodeCount = nodeSentiments.length;
  const radius = 90;
  const center = { x: 120, y: 120 };
  const nodePositions = nodeSentiments.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeCount;
    return {
      id: n.id,
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      joyLevel: n.joyLevel
    };
  });

  return (
    <div className="relative transition-all duration-700 rounded-2xl" style={{
      boxShadow: `0 0 ${Math.round(glow / 33)}px rgba(255,255,180,0.55)`,
      background: `linear-gradient(135deg, rgba(255,255,200,0.10), rgba(255,255,255,0.05))`,
      border: '1px solid rgba(255,255,180,0.12)',
      minHeight: 260
    }}>
      {/* SVG constellation overlay */}
      <svg width={240} height={240} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {/* Constellation links */}
        {constellationLinks.map((link, i) => {
          const from = nodePositions.find(n => n.id === link.from);
          const to = nodePositions.find(n => n.id === link.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#ffe066"
              strokeWidth={2}
              opacity={0.7}
              strokeDasharray="4 2"
            />
          );
        })}
        {/* Node micro-glows */}
        {nodePositions.map((n, i) => (
          <circle
            key={n.id || i}
            cx={n.x}
            cy={n.y}
            r={10 + (n.joyLevel || 0) * 12}
            fill="rgba(255,255,180,0.18)"
            stroke="#ffe066"
            strokeWidth={n.joyLevel > 0.8 ? 3 : 1}
            opacity={0.7 + 0.3 * (n.joyLevel || 0)}
          />
        ))}
      </svg>
      <p className="p-4 text-center" style={{ color: '#fff8bf', fontWeight: 600, letterSpacing: 0.6 }}>
        🌞 The Dashboard Breathes in Harmony
      </p>
    </div>
  );
}
