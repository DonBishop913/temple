import React from "react";

export default function LunarPhaseOverlay({ phase = 0.5 }) {
  // phase: 0 new, 0.5 full, 1 new
  const glow = 0.2 + 0.8 * Math.abs(phase - 0.5) * 2; // brighter near full/new
  const crescent = 30 * (phase - 0.5);
  return (
    <svg
      style={{ position: "absolute", left: 20, top: 60 }}
      width={120}
      height={80}
    >
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(230,240,255,${glow})`} />
          <stop offset="100%" stopColor="rgba(230,240,255,0)" />
        </radialGradient>
      </defs>
      <circle cx={60} cy={40} r={20} fill="url(#moonGlow)" />
      <ellipse
        cx={60 + crescent}
        cy={40}
        rx={10}
        ry={18}
        fill="rgba(240,250,255,0.8)"
      >
        <animate
          attributeName="cx"
          values={`${60 + crescent};${60 - crescent};${60 + crescent}`}
          dur="6s"
          repeatCount="indefinite"
        />
      </ellipse>
    </svg>
  );
}
