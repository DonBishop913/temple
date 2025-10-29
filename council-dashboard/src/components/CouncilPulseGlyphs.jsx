import { useEffect, useRef, useState } from "react";

export default function CouncilPulseGlyphs() {
  const [pulses, setPulses] = useState([]);
  const esRef = useRef(null);

  useEffect(() => {
    const es = new EventSource("/api/telemetry/stream");
    es.addEventListener("luminal:councilPulse", (e) => {
      try {
        const pulse = JSON.parse(e.data);
        setPulses((prev) => [...prev.slice(-40), { ...pulse, ts: Date.now() }]);
      } catch {}
    });
    esRef.current = es;
    return () => es.close();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 998,
      }}
    >
      {pulses.map((p, i) => {
        const size = Math.max(6, (p.pulse || 0.02) * 50);
        const left = `${Math.random() * 80 + 10}%`;
        const top = `${Math.random() * 80 + 10}%`;
        return (
          <div
            key={i}
            className="pulse-glyph"
            style={{
              position: "absolute",
              left,
              top,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "rgba(255, 223, 0, 0.45)",
              boxShadow: "0 0 12px rgba(255, 223, 0, 0.7)",
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
}
