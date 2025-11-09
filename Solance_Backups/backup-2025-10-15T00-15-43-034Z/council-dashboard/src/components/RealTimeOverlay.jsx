import React, { useEffect, useState } from "react";

export default function RealTimeOverlay() {
  const [payload, setPayload] = useState({ nodes: [], anomalies: [] });

  useEffect(() => {
    const es = new EventSource("/api/autonomous/events");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setPayload({
          nodes: data.nodes || [],
          anomalies: data.anomalies || [],
        });
      } catch {}
    };
    return () => es.close();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {(payload.anomalies || []).map((node) => (
        <div
          key={`an-${node.id}`}
          style={{
            position: "absolute",
            top: `${node.positionY}%`,
            left: `${node.positionX}%`,
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "rgba(255,0,0,0.8)",
            boxShadow: "0 0 20px rgba(255,0,0,0.8)",
          }}
        />
      ))}
    </div>
  );
}
