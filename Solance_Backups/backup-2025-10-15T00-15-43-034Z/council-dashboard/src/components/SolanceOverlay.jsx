import { useEffect, useState } from "react";

export default function SolanceOverlay() {
  const [intensity, setIntensity] = useState(0);
  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream");
    es.addEventListener("luminal:intensity", (e) => {
      try {
        setIntensity(JSON.parse(e.data).intensity || 0);
      } catch {}
    });
    es.addEventListener("luminal:councilPulse", (e) => {
      try {
        const { pulse } = JSON.parse(e.data);
        setIntensity((prev) => Math.min(1, prev + (pulse || 0)));
      } catch {}
    });
    return () => es.close();
  }, []);
  const hue = 45; // golden
  const alpha = 0.15 + intensity * 0.35;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 997,
        background: `hsla(${hue}, 90%, 60%, ${alpha})`,
        mixBlendMode: "soft-light",
      }}
    />
  );
}
