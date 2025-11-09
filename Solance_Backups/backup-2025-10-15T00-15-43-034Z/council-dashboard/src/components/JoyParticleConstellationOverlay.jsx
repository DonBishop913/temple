import React, { useEffect, useState } from "react";

export default function JoyParticleConstellationOverlay({
  nodes = [],
  highlightedNodes = [],
}) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = nodes.map((node) => {
      const highlight = highlightedNodes.find((n) => n.nodeId === node.nodeId);
      return {
        x: node.x,
        y: node.y,
        intensity: highlight
          ? highlight.type === "celebration"
            ? 2
            : 1.5
          : 0.5,
        color: highlight
          ? highlight.type === "celebration"
            ? "#FFD700"
            : "#FF4500"
          : "#FFFFFF",
        radius: highlight ? 6 : 3,
      };
    });
    setParticles(newParticles);
  }, [nodes, highlightedNodes]);

  return (
    <svg
      width="100%"
      height="400px"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {particles.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.radius}
          fill={p.color}
          opacity={p.intensity / 2}
          style={{ animation: "pulse 1.5s infinite ease-in-out" }}
        />
      ))}
    </svg>
  );
}
