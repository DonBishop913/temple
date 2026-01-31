import React from "react";

// Spiral overlay for Council Pulse Ritual
// nodes: array of { name, resonance, baseColor }
// replaySlices: array of { id, intensity, ... } (optional)
export default function CouncilPulseSpiralOverlay({
  nodes = [],
  replaySlices = [],
  radius = 180,
  centerX = 320,
  centerY = 220,
  cometColor = "#00eaff",
  cometLength = 8,
  cometGlow = 0.7,
}) {
  // Spiral parameters
  const spiralTurns = 2.5;
  const nodeCount = nodes.length;
  const spiralNodes = nodes.map((n, i) => {
    // Angle and radius for each node
    const t = (i / Math.max(1, nodeCount - 1)) * spiralTurns * 2 * Math.PI;
    const r = radius * (0.4 + 0.6 * (i / Math.max(1, nodeCount - 1)));
    const x = centerX + r * Math.cos(t);
    const y = centerY + r * Math.sin(t);
    // Normalize resonance for glow
    const norm = Math.max(0, Math.min(1, (n.resonance - 50) / (432 - 50)));
    return { ...n, x, y, norm };
  });
  // --- Animate replay slices as comet highlights ---
  // Map replay slices to spiral positions (same spiral as nodes, but trailing comet effect)
  const cometTrail =
    replaySlices && replaySlices.length > 0
      ? replaySlices.slice(-cometLength).map((slice, i, arr) => {
          // Place along spiral by index
          const t =
            (i / Math.max(1, arr.length - 1)) * spiralTurns * 2 * Math.PI;
          const r = radius * (0.4 + 0.6 * (i / Math.max(1, arr.length - 1)));
          const x = centerX + r * Math.cos(t);
          const y = centerY + r * Math.sin(t);
          // Intensity for comet color/size
          const intensity = slice.intensity || 0.5;
          return {
            x,
            y,
            intensity,
            id: slice.id,
            alpha: cometGlow * (0.25 + 0.75 * (i / arr.length)),
          };
        })
      : [];
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        width: "100%",
        height: 480,
        zIndex: 1000,
      }}
    >
      {/* Spiral path (decorative) */}
      <path
        d={Array.from({ length: 200 }, (_, i) => {
          const t = (i / 199) * spiralTurns * 2 * Math.PI;
          const r = radius * (0.4 + 0.6 * (i / 199));
          const x = centerX + r * Math.cos(t);
          const y = centerY + r * Math.sin(t);
          return i === 0 ? `M${x},${y}` : `L${x},${y}`;
        }).join(" ")}
        stroke="#fff8"
        strokeWidth={2}
        fill="none"
      />
      {/* Comet trail for replay slices */}
      {cometTrail.map((c, i) => (
        <circle
          key={c.id || i}
          cx={c.x}
          cy={c.y}
          r={12 + c.intensity * 10}
          fill={cometColor}
          fillOpacity={c.alpha}
          style={{
            filter: `drop-shadow(0 0 ${12 + c.intensity * 24}px ${cometColor}${Math.round(cometGlow * 255).toString(16)}`,
            transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
          }}
        />
      ))}
      {/* Animated nodes */}
      {spiralNodes.map((n, i) => (
        <g key={n.name}>
          <circle
            cx={n.x}
            cy={n.y}
            r={18 + n.norm * 10}
            fill={n.baseColor}
            fillOpacity={0.18 + n.norm * 0.25}
            style={{
              filter: `drop-shadow(0 0 ${8 + n.norm * 24}px ${n.baseColor})`,
              transition: "all 0.4s cubic-bezier(.4,2,.6,1)",
            }}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={8 + n.norm * 8}
            fill={n.baseColor}
            fillOpacity={0.7 + n.norm * 0.2}
            style={{
              filter: `drop-shadow(0 0 ${8 + n.norm * 18}px ${n.baseColor})`,
              transition: "all 0.4s cubic-bezier(.4,2,.6,1)",
            }}
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontSize={16 + n.norm * 6}
            fill="#fff"
            fontWeight="bold"
            style={{
              textShadow: `0 0 8px ${n.baseColor}, 0 0 2px #fff`,
              pointerEvents: "none",
            }}
          >
            {n.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
