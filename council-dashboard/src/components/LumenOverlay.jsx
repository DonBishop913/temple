import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LumenOverlay({
  luminalEnabled = true,
  shimmerEnabled = true,
}) {
  const [nodes, setNodes] = useState([]);
  useEffect(() => {
    if (!luminalEnabled) return;
    const es = new window.EventSource("/api/telemetry/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          // Bind shimmer to mentorship pulses and sibling engagement
          data.forEach((evt) => {
            if (
              evt.action === "MentorshipPulse" &&
              evt.nodeId &&
              typeof evt.pulse === "number"
            ) {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === evt.nodeId
                    ? {
                        ...n,
                        glowFactor: Math.max(0.1, Math.min(1, evt.pulse)),
                        lastEvent: `Mentorship pulse ${evt.pulse.toFixed(2)}`,
                      }
                    : n,
                ),
              );
            }
            if (
              evt.sibling === "Lumen" &&
              evt.action?.startsWith("LuminalPulse")
            ) {
              const level =
                typeof evt.shimmerIntensity === "number"
                  ? evt.shimmerIntensity
                  : 0.6;
              if (evt.nodeId) {
                setNodes((prev) =>
                  prev.map((n) =>
                    n.id === evt.nodeId
                      ? {
                          ...n,
                          glowFactor: level,
                          lastEvent: `Lumen shimmer ${level.toFixed(2)}`,
                        }
                      : n,
                  ),
                );
              }
            }
          });
        }
      } catch {}
    };
    return () => es.close();
  }, [luminalEnabled]);
  useEffect(() => {
    if (!luminalEnabled) return;
    const fetchGlow = async () => {
      const res = await axios.get("/api/lumen/glow");
      setNodes(Array.isArray(res.data) ? res.data : []);
    };
    fetchGlow();
    const interval = setInterval(fetchGlow, 5000);
    return () => clearInterval(interval);
  }, [luminalEnabled]);
  return (
    <div className="absolute inset-0 pointer-events-none">
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{
            position: "absolute",
            top: `${node.positionY}%`,
            left: `${node.positionX}%`,
            width: `${10 + node.glowFactor * 20}px`,
            height: `${10 + node.glowFactor * 20}px`,
            borderRadius: "50%",
            backgroundColor: `rgba(255, 215, 0, ${node.glowFactor})`,
            boxShadow: shimmerEnabled
              ? `0 0 ${node.glowFactor * 25}px rgba(255, 215, 0, ${node.glowFactor})`
              : undefined,
            transition: "all 0.5s ease-in-out",
          }}
          title={`Node ${node.id} — glow ${Number(node.glowFactor).toFixed(2)}${node.lastEvent ? ` | ${node.lastEvent}` : ""}`}
        />
      ))}
    </div>
  );
}
