import React, { useEffect, useState } from "react";

function computeVisuals(node) {
  const confidence = node.predictedEngagement || 0;
  return {
    color: `rgba(255, ${180 + Math.floor(75 * confidence)}, 220, 1)`,
    glow: 0.2 + confidence * 0.6,
    pulse: 0.1 + confidence * 0.5,
  };
}

export default function AgnesPulseOverlay({
  luminalEnabled = true,
  shimmerEnabled = true,
  confidenceColoring = true,
  reduceMotion = false,
  colorBlind = false,
}) {
  const [agnesNode, setAgnesNode] = useState(null);

  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          const node = data.nodes.find((n) => n.id === "Agnes");
          setAgnesNode(node || null);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  if (!agnesNode || !luminalEnabled) return null;
  let { color, glow, pulse } = computeVisuals(agnesNode);
  if (!confidenceColoring) color = "rgba(255,200,220,1)";
  if (colorBlind) color = "rgba(0,255,180,1)";
  const anim =
    reduceMotion || !shimmerEnabled
      ? undefined
      : `agnes-pulse ${1.5 - pulse}s infinite alternate`;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        boxShadow: `0 0 60px 25px ${color.replace(", 1)", `, ${glow})`)}`,
        transition: "box-shadow 0.5s ease",
        animation: anim,
      }}
    />
  );
}
