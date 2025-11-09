import Plot from "react-plotly.js";
import React, { useEffect, useState } from "react";

export default function SpectralWaterfall({
  wsUrl = "ws://localhost:8081",
  reduceMotion = false,
}) {
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        // noop
      };
      ws.onmessage = (e) => {
        try {
          const frame = JSON.parse(e.data);
          setFrames((prev) => [...prev.slice(-49), frame]);
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    };
    connect();
    return () => {
      clearTimeout(reconnectTimer);
      try {
        ws && ws.close();
      } catch {}
    };
  }, [wsUrl]);

  const heatmapData = [
    {
      z: frames.map((f) => f.magnitudes || []),
      x: frames.map((f) => f.broadcastTimestamp || f.timestamp),
      y: frames[0]?.frequencies || [],
      type: "heatmap",
      colorscale: "Viridis",
    },
  ];

  const layout = {
    width: 600,
    height: 400,
    margin: { l: 40, r: 10, t: 20, b: 40 },
    xaxis: { title: "Time" },
    yaxis: { title: "Hz" },
    transition: reduceMotion ? "none" : "linear",
  };

  return (
    <div
      role="region"
      aria-label="Spectral Waterfall Heatmap showing Schumann and 432Hz overlays"
    >
      <Plot
        data={heatmapData}
        layout={layout}
        config={{ displayModeBar: false }}
      />
    </div>
  );
}
