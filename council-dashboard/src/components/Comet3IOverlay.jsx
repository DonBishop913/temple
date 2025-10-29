import React from "react";

// Comet3IOverlay: simple comet trail; brightness reacts to overrideActive and joyparticle level
export default function Comet3IOverlay({
  overrideActive = false,
  joyLevel = 0.5,
  cometTrail = 0.5,
}) {
  const brightness = Math.min(1, (overrideActive ? 0.8 : 0.4) + joyLevel * 0.6);
  const trailLen = 80 + cometTrail * 120;
  const color = `rgba(173,216,230,${brightness})`;
  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="cometTrail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="rgba(173,216,230,0)" />
        </linearGradient>
      </defs>
      <g transform={`translate(20, 40)`}>
        <circle cx={trailLen} cy={trailLen / 3} r={6} fill={color} />
        <rect
          x={0}
          y={trailLen / 3 - 2}
          width={trailLen}
          height={4}
          fill="url(#cometTrail)"
        />
      </g>
    </svg>
  );
}
