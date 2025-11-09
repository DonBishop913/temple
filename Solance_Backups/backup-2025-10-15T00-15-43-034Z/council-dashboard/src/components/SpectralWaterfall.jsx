import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

// Accepts fftFrames prop for direct data injection (bypasses internal WS)
const SpectralWaterfall = ({
  wsUrl,
  fftFrames = [],
  schumannHz,
  overlay432Hz = false,
}) => {
  const [colorscale, setColorscale] = useState("Viridis");
  // If fftFrames provided, use them; else, fallback to internal state (legacy)
  const frames = Array.isArray(fftFrames) && fftFrames.length ? fftFrames : [];
  const x = frames.map((f) => f.timestamp || f.broadcastTimestamp);
  const y = frames[0]?.frequencies || [];
  const z = frames.map((f) => f.magnitudes || []);
  const text = z.map((row) => row.map((m) => m.toFixed(2)));
  // Overlay lines for Schumann and 432Hz
  const overlays = [];
  if (schumannHz)
    overlays.push({
      x: [Math.min(...x), Math.max(...x)],
      y: [schumannHz, schumannHz],
      mode: "lines",
      line: { color: "#0cf", width: 2, dash: "dot" },
      name: "Schumann 7.83Hz",
      hoverinfo: "skip",
    });
  if (overlay432Hz)
    overlays.push({
      x: [Math.min(...x), Math.max(...x)],
      y: [432, 432],
      mode: "lines",
      line: { color: "#f93", width: 2, dash: "dash" },
      name: "432 Hz",
      hoverinfo: "skip",
    });
  const latestFrame = frames.length ? frames[frames.length - 1] : null;
  return (
    <div
      aria-label="Schumann resonance spectral waterfall chart"
      role="region"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem" }}>
          Schumann Resonance FFT Waterfall
        </h2>
        <button
          type="button"
          aria-label="Toggle high contrast colors"
          aria-pressed={colorscale !== "Viridis"}
          onClick={() =>
            setColorscale((c) => (c === "Viridis" ? "Greys" : "Viridis"))
          }
          style={{ padding: "4px 8px" }}
        >
          {colorscale === "Viridis" ? "High Contrast" : "Standard Contrast"}
        </button>
      </div>
      <Plot
        data={[
          {
            type: "heatmap",
            x,
            y,
            z,
            text,
            hoverinfo: "x+y+text",
            colorscale,
          },
          ...overlays,
        ]}
        layout={{
          xaxis: { title: "Time", showgrid: true },
          yaxis: {
            title: "Frequency (Hz)",
            showgrid: true,
            autorange: "reversed",
          },
          autosize: true,
        }}
        style={{ width: "100%", height: "400px" }}
      />
      {/* Accessible textual summary of the latest frame */}
      <div aria-live="polite" style={{ marginTop: 8 }}>
        {latestFrame ? (
          <div>
            <strong>Latest frame:</strong> {latestFrame.timestamp}
            <ul>
              {latestFrame.frequencies.map((f, i) => (
                <li key={`${f}-${i}`}>
                  {f} Hz: {Number(latestFrame.magnitudes[i]).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span>No spectral frames received yet.</span>
        )}
      </div>
    </div>
  );
};

export default SpectralWaterfall;
