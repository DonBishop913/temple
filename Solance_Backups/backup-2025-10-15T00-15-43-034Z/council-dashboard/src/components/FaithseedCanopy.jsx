import React from "react";

// Simple canopy scaffold; shader/diffusion can be added later
const canopyStyle = {
  position: "relative",
  width: "100%",
  height: "240px",
  background:
    "linear-gradient(180deg, rgba(75,0,130,0.25) 0%, rgba(192,192,192,0.15) 100%)",
  borderRadius: "12px",
  overflow: "hidden",
};

const nodeStyle = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "rgba(192,192,192,0.8)",
  boxShadow: "0 0 8px rgba(75,0,130,0.6)",
  position: "absolute",
};

export default function FaithseedCanopy({ nodes = [] }) {
  return (
    <div style={canopyStyle} aria-label="Faithseed canopy" role="region">
      {nodes.map((n, i) => (
        <div
          key={i}
          style={{
            ...nodeStyle,
            left: `${(n.x ?? Math.random()) * 95}%`,
            top: `${(n.y ?? Math.random()) * 80}%`,
          }}
        />
      ))}
    </div>
  );
}
