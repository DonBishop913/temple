import React, { useEffect, useState } from 'react';

export default function LuminalGlowLayer({ pulses = [], predictedEngagement = [] }) {
  const [glowConfig, setGlowConfig] = useState({ intensity: 0, color: 'rgba(255,215,0,0.5)' });

  useEffect(() => {
    if (!pulses || !predictedEngagement) return;

    // Aggregate live sentiment and predictive engagement
    const sentimentSum = (pulses || []).reduce((acc, p) => acc + (p.intensity ?? 0), 0);
    const avgSentiment = (pulses && pulses.length) ? sentimentSum / pulses.length : 0;

    const avgPrediction = (predictedEngagement && predictedEngagement.length)
      ? predictedEngagement.reduce((a,b) => a + b, 0) / predictedEngagement.length
      : 0;

    // Compute glow intensity: base + predictive + sentiment
    const intensity = Math.min(1, 0.2 + avgPrediction * 0.5 + avgSentiment * 0.5);

    // Glow color: green if sentiment positive, amber if neutral, red if negative
    const sentimentColor = avgSentiment > 0.2
      ? `rgba(0,255,0,${intensity})`
      : avgSentiment < -0.2
      ? `rgba(255,0,0,${intensity})`
      : `rgba(255,215,0,${intensity})`;

    setGlowConfig({ intensity, color: sentimentColor });
  }, [pulses, predictedEngagement]);

  return (
    <div
      className="luminal-glow-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        boxShadow: `0 0 ${20 + glowConfig.intensity * 50}px ${glowConfig.color}`,
        transition: 'box-shadow 0.5s ease, background-color 0.5s ease',
      }}
    />
  );
}
