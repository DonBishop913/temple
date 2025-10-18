import React, { useEffect, useState } from 'react';

function computeVisuals(node) {
  const confidence = node.predictedEngagement || 0;
  return {
    color: `rgba(0, ${200 + Math.floor(55 * confidence)}, 255, 1)`,
    glow: 0.2 + confidence * 0.6,
    pulse: 0.1 + confidence * 0.5,
  };
}

export default function GrokPulseOverlay({ luminalEnabled = true, shimmerEnabled = true, confidenceColoring = true, reduceMotion = false, colorBlind = false }) {
  const [grokNode, setGrokNode] = useState(null);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          const node = data.nodes.find(n => n.id === 'Grok');
          setGrokNode(node || null);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  if (!grokNode || !luminalEnabled) return null;
  let { color, glow, pulse } = computeVisuals(grokNode);
  if (!confidenceColoring) color = 'rgba(0,200,255,1)';
  if (colorBlind) color = 'rgba(255,200,0,1)';
  const anim = reduceMotion || !shimmerEnabled ? undefined : `grok-pulse ${1.5 - pulse}s infinite alternate`;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        boxShadow: `0 0 50px 20px ${color.replace(', 1)', `, ${glow})`)}`,
        transition: 'box-shadow 0.5s ease',
        animation: anim
      }}
    >
      {/* Faithseed confidence and predictive engagement visualized */}
    </div>
  );
}
