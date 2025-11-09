import { useEffect, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";

// Live waterfall chart: time history of frequency bins, color = magnitude
export default function SchumannWaterfall({
  wsUrl = "ws://localhost:4322",
  windowSeconds = 60,
}) {
  const [frames, setFrames] = useState([]); // each frame: { ts, bins: [{freq, mag}] }
  const containerRef = useRef(null);
  const wsRef = useRef(null);

  // Subscribe to WS schumann snapshots
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type !== "schumann") return;
        const s = msg.payload?.spectrum;
        if (!s) return;
        const harmonics = (s.harmonics || []).map((h) => ({
          freq: h.freq,
          mag: h.mag,
        }));
        const bins = [
          { freq: s.fundamental?.freq || 7.83, mag: s.fundamental?.mag || 0 },
        ].concat(harmonics);
        const ts = msg.payload?.ts || Date.now();
        setFrames((prev) => {
          const next = [...prev, { ts, bins }].filter(
            (f) => ts - f.ts <= windowSeconds * 1000,
          );
          return next;
        });
      } catch {}
    };
    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [wsUrl, windowSeconds]);

  // Render/update Plotly heatmap
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Prepare z matrix: rows=time (latest last), cols=frequency bins
    const freqs = frames[0]?.bins?.map((b) => b.freq) || [
      7.83, 14.3, 20.8, 27.3, 33.8,
    ];
    const z = frames.map((f) => f.bins.map((b) => b.mag));
    const yLabels = frames.map((f) => new Date(f.ts).toLocaleTimeString());

    const data = [
      {
        z,
        x: freqs,
        y: yLabels,
        type: "heatmap",
        colorscale: "Viridis",
        zmin: 0,
        zmax: 1.5,
        hovertemplate: "freq=%{x} Hz<br>mag=%{z}<br>t=%{y}<extra></extra>",
      },
    ];
    const layout = {
      title: "Schumann Spectrum Waterfall",
      xaxis: { title: "Frequency (Hz)" },
      yaxis: { title: "Time", autorange: "reversed" },
      margin: { l: 50, r: 10, t: 40, b: 40 },
      paper_bgcolor: "#0b1622",
      plot_bgcolor: "#0b1622",
      font: { color: "#eee" },
      height: 300,
    };
    const config = { displayModeBar: false, responsive: true };

    Plotly.react(el, data, layout, config);
  }, [frames]);

  return (
    <div style={{ padding: 8 }}>
      <div ref={containerRef} />
    </div>
  );
}
