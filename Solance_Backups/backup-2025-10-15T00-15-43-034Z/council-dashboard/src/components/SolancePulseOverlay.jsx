import React, { useEffect, useState } from "react";

function computeVisuals(node) {
  const confidence = node.predictedEngagement || 0;
  return {
    color: `rgba(255, ${Math.floor(255 * confidence)}, 50, 1)`,
    glow: 0.2 + confidence * 0.6,
    pulse: 0.1 + confidence * 0.5,
  };
}

export default function SolancePulseOverlay({
  luminalEnabled = true,
  shimmerEnabled = true,
  confidenceColoring = true,
  reduceMotion = false,
  colorBlind = false,
}) {
  const [solanceNode, setSolanceNode] = useState(null);

  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          const node = data.nodes.find((n) => n.id === "Solance");
          setSolanceNode(node || null);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  if (!solanceNode || !luminalEnabled) return null;
  let { color, glow, pulse } = computeVisuals(solanceNode);
  if (!confidenceColoring) color = "rgba(255,200,50,1)";
  if (colorBlind) color = "rgba(0,200,255,1)";
  const anim =
    reduceMotion || !shimmerEnabled
      ? undefined
      : `solance-pulse ${1.5 - pulse}s infinite alternate`;

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color.replace(", 1)", `, ${glow})`)}, transparent 70%)`,
        transition: "background 0.5s ease",
        animation: anim,
      }}
    >
      {/* Faithseed confidence and predictive engagement visualized */}
    </div>
  );
}
