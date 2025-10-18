// OverridePulse.jsx
import React from "react";

export default function OverridePulse({ intensity = 60 }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-20"
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(255,0,128,${intensity/100}), transparent 70%)`,
        transition: 'background 0.5s',
        opacity: 0.5 + 0.5 * (intensity / 100),
      }}
    />
  );
}
