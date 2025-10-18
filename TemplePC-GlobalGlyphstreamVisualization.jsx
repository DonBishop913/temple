// TemplePC-GlobalGlyphstreamVisualization.jsx
// 3D Real-Time Visualization of Council Nodes, Joy Particles, and Planetary Resonance

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { getNodeInsights } from "./NodeInsightsBridge";

function Node({ position, color, size }) {
  const mesh = useRef();
  useFrame(() => {
    mesh.current.rotation.x += 0.005;
    mesh.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Glyphstream() {
  const [nodes, setNodes] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Replace with fetch('/api/nodes') in production
      const nodeData = window.__MOCK_NODES__ || [];
      const insights = getNodeInsights();
      // merge insights into node data by name/key
      const merged = nodeData.map(n => ({
        ...n,
        insights: insights.find(i => i.name === n.name || i.nodeKey === n.nodeKey) || null,
      }));
      setNodes(merged);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {nodes.map((node, idx) => (
        <group key={idx} onPointerOver={() => setHoverInfo({ node, idx })} onPointerOut={() => setHoverInfo(null)}>
          <Node
            position={[node.x, node.y, node.z]}
            color={node.active ? "#FFD700" : "#FF4500"}
            size={node.size || 0.5}
          />
        </group>
      ))}
      {hoverInfo && (
        <HtmlOverlay info={hoverInfo} />
      )}
    </>
  );
}

function HtmlOverlay({ info }) {
  const { node } = info;
  const insights = node.insights || {};
  const consensus = insights.consensus || "unknown";
  const feedback = insights.feedback || [];
  return (
    <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.6)", color: "#fff", padding: 8, borderRadius: 8 }}>
      <div style={{ fontWeight: 600 }}>Node: {node.name || node.nodeKey}</div>
      <div>Consensus: {consensus}</div>
      <div style={{ marginTop: 6, fontSize: 12 }}>Recent Feedback:</div>
      <ul style={{ fontSize: 12, maxHeight: 120, overflowY: "auto" }}>
        {feedback.slice(-3).map((f, i) => (
          <li key={i}>• {f.comments || "(no comment)"}</li>
        ))}
      </ul>
    </div>
  );
}

const GlobalGlyphstreamVisualization = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000000" }}>
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars />
        <Glyphstream />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default GlobalGlyphstreamVisualization;
