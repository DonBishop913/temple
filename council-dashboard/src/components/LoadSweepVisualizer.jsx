import React, { useEffect, useRef, useState } from "react";

// Simple SVG time-series visualizer with two lines: FPS (top) and Pulses/sec (bottom)
export default function LoadSweepVisualizer({
  fps = 0,
  pulsesPerSec = 0,
  maxPoints = 120,
  width = 420,
  height = 120,
}) {
  const [points, setPoints] = useState([]); // {t, fps, p}
  const refTicks = useRef(0);

  useEffect(() => {
    const t = Date.now();
    setPoints((prev) => {
      const next = prev.concat({
        t,
        fps: Math.round(fps || 0),
        p: Math.round(pulsesPerSec || 0),
      });
      if (next.length > maxPoints) next.shift();
      return next;
    });
  }, [fps, pulsesPerSec]);

  // derive bounds
  const now = Date.now();
  const xs = points.map((p, i) => ({
    x: (i / Math.max(1, maxPoints - 1)) * width,
    fps: p.fps,
    p: p.p,
  }));
  const maxF = Math.max(60, ...points.map((p) => p.fps || 0));
  const maxP = Math.max(1, ...points.map((p) => p.p || 0));

  const fpsPath = xs
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"} ${pt.x} ${height * 0.4 - (pt.fps / maxF) * (height * 0.35)}`,
    )
    .join(" ");
  const pPath = xs
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"} ${pt.x} ${height * 0.95 - (pt.p / maxP) * (height * 0.5)}`,
    )
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      style={{ background: "rgba(0,0,0,0.35)", borderRadius: 6, padding: 6 }}
    >
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={6}
        fill="rgba(0,0,0,0.35)"
      />
      {/* Grid lines */}
      <g stroke="rgba(255,255,255,0.06)" strokeWidth={1}>
        <line x1={0} y1={height * 0.25} x2={width} y2={height * 0.25} />
        <line x1={0} y1={height * 0.5} x2={width} y2={height * 0.5} />
        <line x1={0} y1={height * 0.75} x2={width} y2={height * 0.75} />
      </g>

      {/* FPS line */}
      <path
        d={fpsPath || ""}
        fill="none"
        stroke="#4D79FF"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Pulses/sec line */}
      <path
        d={pPath || ""}
        fill="none"
        stroke="#FFB86B"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />

      {/* Labels */}
      <text x={8} y={14} fontSize={11} fill="#fff">
        FPS: {Math.round(fps)}
      </text>
      <text x={8} y={28} fontSize={11} fill="#fff">
        P/s: {Math.round(pulsesPerSec)}
      </text>
    </svg>
  );
}
