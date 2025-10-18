import React from 'react';

export default function SevenSistersOverlay({ intensity = 0.5 }) {
  const stars = [
    { x: 20, y: 10 }, { x: 40, y: 20 }, { x: 60, y: 12 },
    { x: 30, y: 35 }, { x: 50, y: 40 }, { x: 70, y: 28 }, { x: 85, y: 18 }
  ];
  const glow = 0.3 + 0.7 * intensity;
  return (
    <svg style={{ position: 'absolute', right: 20, top: 60 }} width={120} height={80}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={2 + 2 * glow} fill={`rgba(200,230,255,${glow})`}>
          <animate attributeName="r" values={`${2 + 2 * glow};${3 + 3 * glow};${2 + 2 * glow}`} dur="3s" repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
