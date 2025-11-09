import React from "react";

// JoyParticleStream: shows surge particles across screen based on joyparticle level
export default function JoyParticleStream({ joyLevel = 0.5 }) {
  const count = Math.floor(20 + joyLevel * 80);
  const particles = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    alpha: 0.2 + joyLevel * 0.6,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: `rgba(255,255,200,${p.alpha})`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,255,200,${p.alpha})`,
          }}
        />
      ))}
    </div>
  );
}
