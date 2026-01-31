import React from "react";
import { Canvas } from "@react-three/fiber";

export default function ARVRScroll({
  reflections = [],
  particleContext,
  immersive = false,
}) {
  const Fallback = () => (
    <div
      aria-label="AR/VR Fallback Canvas"
      style={{
        width: 600,
        height: 400,
        background: "#111",
        color: "#eee",
        padding: 12,
      }}
    >
      <strong>AR/VR Unavailable:</strong> Rendering reflections in 2D fallback.
      <n />
      <ul>
        {reflections.map((r, i) => (
          <li key={i}>
            {r.label || `Reflection ${i}`} – hue {r.hue ?? 200}
          </li>
        ))}
      </ul>
    </div>
  );

  try {
    return (
      <Canvas style={{ width: 600, height: 400 }}>
        {/* Optionally add controllers here when immersive is true */}
        {reflections.map((r, i) => (
          <mesh key={i} position={[i % 10, Math.floor(i / 10), 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={`hsl(${r.hue ?? 200}, 70%, 50%)`} />
          </mesh>
        ))}
        {/* Basic light */}
        <ambientLight intensity={0.8} />
      </Canvas>
    );
  } catch (e) {
    return <Fallback />;
  }
}
