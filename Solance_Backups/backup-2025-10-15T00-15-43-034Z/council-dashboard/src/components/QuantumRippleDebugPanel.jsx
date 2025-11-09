import React, { useEffect, useState, useRef } from "react";

export default function QuantumRippleDebugPanel({ quantumRippleField }) {
  const [pulsesPerSec, setPulsesPerSec] = useState(0);
  const [highlightedCount, setHighlightedCount] = useState(0);
  const [fps, setFps] = useState(0);

  const lastUpdateRef = useRef(Date.now());
  const pulseCounterRef = useRef(0);

  useEffect(() => {
    if (!quantumRippleField) return;
    // subscribe to pulseAdded if available
    let unsubPulse = null;
    try {
      unsubPulse =
        quantumRippleField.on &&
        quantumRippleField.on("pulseAdded", () => {
          pulseCounterRef.current++;
        });
    } catch (e) {}

    let frameTimes = [];
    let animationFrameId;
    function tick() {
      const now = performance.now();
      // prefer renderer-provided stats when available
      try {
        const s = quantumRippleField.getStats
          ? quantumRippleField.getStats()
          : null;
        if (s) {
          if (typeof s.fps === "number") setFps(Math.round(s.fps));
          if (typeof s.pulsesThisSecond === "number")
            setPulsesPerSec(Math.round(s.pulsesThisSecond));
          // clear local counter when renderer supplies pulses
          pulseCounterRef.current = 0;
        } else {
          frameTimes.push(now);
          frameTimes = frameTimes.filter((t) => now - t <= 1000);
          setFps(frameTimes.length);

          const delta = (now - lastUpdateRef.current) / 1000;
          setPulsesPerSec(
            Math.round(pulseCounterRef.current / Math.max(delta, 0.001)),
          );
          pulseCounterRef.current = 0;
          lastUpdateRef.current = now;
        }
      } catch (e) {
        // fallback measurement
        frameTimes.push(now);
        frameTimes = frameTimes.filter((t) => now - t <= 1000);
        setFps(frameTimes.length);
      }

      try {
        setHighlightedCount(
          quantumRippleField.getHighlightedCount
            ? quantumRippleField.getHighlightedCount()
            : 0,
        );
      } catch (e) {}

      animationFrameId = requestAnimationFrame(tick);
    }
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (unsubPulse)
        try {
          unsubPulse();
        } catch (e) {}
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantumRippleField]);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "10px",
        borderRadius: "8px",
        fontFamily: "monospace",
        zIndex: 9999,
      }}
    >
      <div>FPS: {fps}</div>
      <div>Pulses/sec: {pulsesPerSec}</div>
      <div>Highlighted Pulses: {highlightedCount}</div>
    </div>
  );
}
