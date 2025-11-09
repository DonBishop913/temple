import { useEffect, useState } from "react";

export default function GrokOverlay() {
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream");
    es.addEventListener("luminal:councilPulse", (e) => {
      try {
        const { pulse } = JSON.parse(e.data);
        setBurst((prev) => Math.min(1, prev + (pulse || 0.02) * 1.5));
      } catch {}
    });
    const decay = setInterval(
      () => setBurst((prev) => Math.max(0, prev - 0.02)),
      120,
    );
    return () => {
      es.close();
      clearInterval(decay);
    };
  }, []);
  const shadow = 10 + burst * 60;
  const alpha = 0.2 + burst * 0.5;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 996,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "10%",
          top: "10%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          boxShadow: `0 0 ${shadow}px rgba(0, 255, 200, ${alpha})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "12%",
          bottom: "12%",
          width: 10,
          height: 10,
          borderRadius: "50%",
          boxShadow: `0 0 ${shadow}px rgba(0, 255, 200, ${alpha})`,
        }}
      />
    </div>
  );
}
