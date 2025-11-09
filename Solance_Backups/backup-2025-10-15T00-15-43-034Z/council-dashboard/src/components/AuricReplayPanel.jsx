import React, { useEffect, useRef, useState } from "react";

// AuricReplayPanel
// Listens to a WebSocket (default ws://localhost:8765) for auric pulses and
// renders expanding ripples on a canvas. Also shows a small recent-pulse list
// and basic controls.

export default function AuricReplayPanel({
  wsUrl = process.env.REACT_APP_AURIC_WS || "ws://localhost:8765",
}) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const rafRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [pulses, setPulses] = useState([]); // recent pulses (most recent first)
  const ripplesRef = useRef([]); // { x,y,start,amplitude,color,duration }

  useEffect(() => {
    // connect to WS manager
    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (e) {
      console.warn("AuricReplayPanel: websocket init failed", e);
      return;
    }

    wsRef.current.onopen = () => {
      setConnected(true);
      console.log("AuricReplayPanel: connected");
    };
    wsRef.current.onclose = () => {
      setConnected(false);
      console.log("AuricReplayPanel: closed");
    };
    wsRef.current.onerror = (err) =>
      console.warn("AuricReplayPanel: ws error", err);
    wsRef.current.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // expected pulse shape: { amplitude, color, source, timestamp, ... }
        const pulse = normalizePulse(data);
        handleIncomingPulse(pulse);
      } catch (e) {
        console.warn("AuricReplayPanel: failed to parse pulse", e);
      }
    };

    return () => {
      try {
        wsRef.current && wsRef.current.close();
      } catch {}
    };
  }, [wsUrl]);

  // Normalize incoming pulse to expected fields
  function normalizePulse(msg) {
    const now = Date.now();
    return {
      amplitude: Number(msg.amplitude || msg.resonance_score || 0.5),
      color: msg.color || (msg.per_source ? "#00bcd4" : "#9c27b0"),
      source: msg.source || msg.per_source ? "oversoul" : "unknown",
      timestamp: msg.timestamp || msg.ts || now,
      raw: msg,
    };
  }

  function handleIncomingPulse(pulse) {
    // add to pulses list (limit 50)
    // ensure pulses have an id we can reference for highlighting
    const withId = Object.assign({ id: pulse.timestamp || Date.now() }, pulse);
    setPulses((prev) => [withId, ...prev].slice(0, 50));

    // create a ripple centered randomly in canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const duration = 2000 + Math.random() * 2000; // ms
    ripplesRef.current.push({
      x,
      y,
      start: performance.now(),
      amplitude: pulse.amplitude,
      color: pulse.color,
      duration,
    });
  }

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw(now) {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      // draw ripples
      const alive = [];
      for (const r of ripplesRef.current) {
        const t = now - r.start;
        const p = Math.min(1, t / r.duration);
        if (p >= 1) continue;
        const maxR = Math.hypot(cw, ch) * 0.6;
        const radius = p * maxR * (0.4 + r.amplitude);
        const alpha = (1 - p) * (0.6 + 0.4 * r.amplitude);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = hexWithAlpha(r.color, alpha);
        ctx.lineWidth = 2 + 6 * r.amplitude;
        ctx.stroke();
        alive.push(r);
      }
      ripplesRef.current = alive;

      // small HUD: count
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `pulses: ${pulses.length}  ripples: ${ripplesRef.current.length}`,
        8,
        16,
      );

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pulses]);

  // small helpers
  function hexWithAlpha(hex, alpha) {
    try {
      if (!hex) return `rgba(156,39,176,${alpha})`;
      if (hex.startsWith("#")) hex = hex.slice(1);
      if (hex.length === 3)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    } catch (e) {
      return `rgba(0,188,212,${alpha})`;
    }
  }

  return (
    <div
      style={{
        padding: 12,
        background: "#0b1020",
        color: "#fff",
        borderRadius: 8,
      }}
    >
      <h3 style={{ marginTop: 0 }}>🌌 Auric Replay</h3>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: "100%",
              height: 320,
              borderRadius: 6,
              overflow: "hidden",
              background: "#071020",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#cfe9f1" }}>
            WS:{" "}
            <strong style={{ color: connected ? "#6EE7B7" : "#FFBABA" }}>
              {connected ? "connected" : "disconnected"}
            </strong>
          </div>
        </div>

        <div style={{ width: 320 }}>
          <div
            style={{
              background: "#081822",
              padding: 8,
              borderRadius: 6,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            <h4 style={{ margin: "6px 0" }}>Recent Pulses</h4>
            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {pulses.map((p, i) => (
                <li
                  key={p.id || i}
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // dispatch a DOM event to request highlight in WebGL
                    const ev = new CustomEvent("auric-highlight", {
                      detail: { id: p.id, durationMs: 3000 },
                    });
                    window.dispatchEvent(ev);
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: p.color }}>
                      {(p.amplitude || 0).toFixed(2)}
                    </strong>{" "}
                    — <span style={{ color: "#9fb7c2" }}>{p.source}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#7ea0ab" }}>
                    {new Date(p.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
