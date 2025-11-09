import React, { useEffect, useRef } from "react";

const MAX_RIPPLES = 1000;

export default function RippleCanvas({
  wsUrl = process.env.REACT_APP_AURIC_WS || "ws://localhost:8765",
}) {
  const canvasRef = useRef(null);
  const ripplesRef = useRef([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => console.log("RippleCanvas WS connected", wsUrl);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "oversoul_pulse") {
          const amplitude = Number(msg.payload?.amplitude || 0.2);
          const color = msg.payload?.color || "#ffffff";
          ripplesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0,
            maxRadius: 50 + 150 * amplitude,
            alpha: 1,
            color,
          });
          if (ripplesRef.current.length > MAX_RIPPLES)
            ripplesRef.current.shift();
        }
      } catch (err) {
        console.warn("RippleCanvas WS parse", err);
      }
    };

    let rafId = null;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${hexToRgb(r.color)},${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        r.radius += 2;
        r.alpha -= 0.015;
        if (r.alpha <= 0) ripplesRef.current.splice(i, 1);
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      try {
        ws.close();
      } catch {}
      cancelAnimationFrame(rafId);
    };
  }, [wsUrl]);

  const hexToRgb = (hex) => {
    const m = hex.replace("#", "").match(/.{1,2}/g);
    if (!m) return "255,255,255";
    return m.map((x) => parseInt(x, 16)).join(",");
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
