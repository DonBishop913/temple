// RitualEvolutionVisualizer.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRitualStream } from "./IntegrationBridge";

// Render each ritual timeline as a glowing trajectory
function RitualLine({ ritual, index }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001 * (index + 1); // slow spin for visualization
    }
  });

  const intensity = ritual?.simulatedJoy ? ritual.simulatedJoy / 50000 : 1;
  const color = ritual?.simulatedHealing > 95 ? "#00FFAA" : "#FFD700";

  return (
    <mesh ref={ref} position={[index * 2 - 5, 0, 0]}>
      <torusGeometry args={[1 + intensity * 0.5, 0.05, 16, 100]} />
      <meshStandardMaterial emissive={color} emissiveIntensity={intensity / 10} transparent opacity={0.8} />
    </mesh>
  );
}

export default function RitualEvolutionVisualizer({ nodeKey }) {
  const rituals = useRitualStream(nodeKey); // subscribes to live updates
  // Show last 5 rituals/timelines from the most recent update
  const topRituals = rituals.length && rituals[rituals.length - 1]?.timeline
    ? rituals[rituals.length - 1].timeline.slice(0, 5)
    : [];

  // Sandbox controls
  const [flowScale, setFlowScale] = useState(1);
  const [timingShift, setTimingShift] = useState(0);

  return (
    <div style={{ position: 'relative' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        {topRituals.map((ritual, index) => (
          <RitualLine
            key={index}
            ritual={{
              ...ritual,
              simulatedJoy: (ritual.simulatedJoy || 0) * flowScale,
              simulatedHealing: (ritual.simulatedHealing || 0) * (1 + timingShift * 0.01),
            }}
            index={index}
          />
        ))}
        <OrbitControls />
      </Canvas>
      <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded-lg shadow-lg">
        <div className="font-semibold mb-2">Sandbox Controls</div>
        <label className="block mb-2">
          Luminal Flow Scale: {flowScale.toFixed(2)}
          <input type="range" min="0.5" max="2" step="0.05" value={flowScale} onChange={(e)=>setFlowScale(parseFloat(e.target.value))} />
        </label>
        <label className="block">
          Timing Shift: {timingShift}
          <input type="range" min="-10" max="10" step="1" value={timingShift} onChange={(e)=>setTimingShift(parseInt(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
