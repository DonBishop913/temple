import React, { useEffect, useRef } from "react";

const MAX_RIPPLES = 5000;

export default function RippleWebGL({
  wsUrl = process.env.REACT_APP_AURIC_WS || "ws://localhost:8765",
}) {
  const canvasRef = useRef(null);
  const poolRef = useRef([]);
  const wsRef = useRef(null);
  const idCounterRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not available, falling back");
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // basic shaders: draw points, fragment shader discards outside circle
    const vs = `attribute vec2 a_pos; uniform vec2 u_res; void main(){ vec2 zeroToOne = a_pos / u_res; vec2 clip = zeroToOne * 2.0 - 1.0; gl_Position = vec4(clip * vec2(1,-1), 0, 1); gl_PointSize = 64.0; }`;
    const fs = `precision mediump float; uniform vec4 u_color; void main(){ vec2 c = gl_PointCoord - vec2(0.5); float d = length(c); if (d>0.5) discard; gl_FragColor = u_color; }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vsS = compile(gl.VERTEX_SHADER, vs);
    const fsS = compile(gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, vsS);
    gl.attachShader(prog, fsS);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uColor = gl.getUniformLocation(prog, "u_color");

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // initialize pool (add id and highlightUntil)
    for (let i = 0; i < MAX_RIPPLES; i++)
      poolRef.current.push({
        active: false,
        id: 0,
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 0,
        alpha: 0,
        color: [1, 1, 1, 1],
        highlightUntil: 0,
      });

    // websocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => console.log("RippleWebGL WS", wsUrl);
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        // support single pulses and batches
        if (m.type === "oversoul_pulse" || m.type === "oversoul_pulse_batch") {
          const items =
            m.type === "oversoul_pulse" ? [m.payload] : m.payload || [];
          for (const item of items) {
            const p = poolRef.current.find((x) => !x.active);
            if (!p) break;
            p.active = true;
            p.id = item?.id || item?.timestamp || idCounterRef.current++;
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
            p.radius = 0;
            p.maxRadius = 50 + 150 * Number(item?.amplitude || 0.2);
            p.alpha = 1;
            p.color = hexToRGBA(item?.color || "#ffffff");
            p.highlightUntil = 0;
          }
        }
        // allow network-triggered highlights
        if (m.type === "oversoul_pulse_highlight" && Array.isArray(m.ids)) {
          const now = Date.now();
          const H = 3000;
          for (const id of m.ids) {
            for (const r of poolRef.current) {
              if (r.active && (r.id === id || r.id === Number(id)))
                r.highlightUntil = now + H;
            }
          }
        }
      } catch (e) {
        console.warn("RippleWebGL WS parse", e);
      }
    };

    const animate = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const positions = [];
      const actives = [];
      poolRef.current.forEach((r) => {
        if (r.active) {
          positions.push(r.x, r.y);
          actives.push(r);
        }
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.DYNAMIC_DRAW,
      );
      const now = Date.now();
      actives.forEach((r, idx) => {
        // highlight boost if requested
        let alpha = r.alpha;
        if (r.highlightUntil && r.highlightUntil > now) {
          const remaining = (r.highlightUntil - now) / 3000; // 0..1
          const boost = 1 + 0.75 * remaining;
          alpha = Math.min(1, alpha * boost);
        }
        gl.uniform4f(uColor, r.color[0], r.color[1], r.color[2], alpha);
        gl.drawArrays(gl.POINTS, idx, 1);
        r.radius += 2;
        r.alpha -= 0.01;
        if (r.alpha <= 0) r.active = false;
      });
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      try {
        ws.close();
      } catch {}
      // remove highlight listener
      window.removeEventListener(
        "auric-highlight",
        window.__auric_highlight_handler__,
      );
    };
  }, [wsUrl]);

  // listen for DOM highlight events (from other components)
  useEffect(() => {
    const handler = (ev) => {
      const detail = ev && ev.detail;
      if (!detail) return;
      const ids = Array.isArray(detail.ids)
        ? detail.ids
        : detail.id
          ? [detail.id]
          : [];
      if (!ids.length) return;
      const now = Date.now();
      const H = detail.durationMs || 3000;
      for (const id of ids) {
        for (const r of poolRef.current) {
          if (r.active && (r.id === id || r.id === Number(id)))
            r.highlightUntil = now + H;
        }
      }
    };
    // keep a reference so we can remove later
    window.__auric_highlight_handler__ = handler;
    window.addEventListener("auric-highlight", handler);
    return () => window.removeEventListener("auric-highlight", handler);
  }, []);

  const hexToRGBA = (hex) => {
    const m = hex.replace("#", "").match(/.{1,2}/g);
    if (!m) return [1, 1, 1, 1];
    return m
      .map((x) => parseInt(x, 16) / 255)
      .concat([1])
      .slice(0, 4);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
