import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function UnifiedMasterDashboard() {
  const mountRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [replayQueue, setReplayQueue] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [replaySpeed, setReplaySpeed] = useState(1000);
  const [highlightCluster, setHighlightCluster] = useState(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  // --- Three.js scene setup ---
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    camera.position.z = 50;

    // Store spheres for highlighting
    let spheres = [];

    function updateScene(currentNodes) {
      // Remove old spheres
      spheres.forEach(s => scene.remove(s));
      spheres = [];
      currentNodes.forEach(node => {
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        let color = new THREE.Color(`hsl(${node.intensity * 360},100%,50%)`);
        if (highlightCluster && node.cluster === highlightCluster) {
          color = new THREE.Color(0xffff00); // highlight cluster yellow
        }
        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(Math.sin(node.id) * 10, Math.cos(node.id) * 10, Math.sin(node.id)*5);
        scene.add(sphere);
        spheres.push(sphere);
      });
    }

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // --- WebSocket connection for live mode ---
    if (isLive) {
      wsRef.current = new WebSocket('ws://localhost:8765');
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNodes(data.nodes || []);
        setReplayQueue(prev => [...prev, data.nodes || []]);
        updateScene(data.nodes || []);
      };
    }

    // --- Auto-Replay interval ---
    if (!isLive) {
      intervalRef.current = setInterval(() => {
        if (replayQueue.length > 0) {
          setReplayIndex(idx => {
            const nextIdx = (idx + 1) % replayQueue.length;
            updateScene(replayQueue[nextIdx]);
            return nextIdx;
          });
        }
      }, replaySpeed);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
      spheres.forEach(s => scene.remove(s));
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line
  }, [isLive, replaySpeed, highlightCluster]);

  // --- UI Controls ---
  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e0c4c', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 20, left: 20, color: '#fff', zIndex: 10, background: '#222a', padding: 12, borderRadius: 8 }}>
        <button onClick={() => setIsLive(l => !l)} style={{ marginRight: 10 }}>
          {isLive ? 'Switch to Replay' : 'Switch to Live'}
        </button>
        {!isLive && (
          <>
            <label style={{ marginRight: 8 }}>
              Replay Speed:
              <input
                type="range"
                min={200}
                max={3000}
                step={100}
                value={replaySpeed}
                onChange={e => setReplaySpeed(Number(e.target.value))}
                style={{ marginLeft: 8 }}
              />
              <span style={{ marginLeft: 8 }}>{replaySpeed} ms</span>
            </label>
            <label style={{ marginLeft: 16 }}>
              Highlight Cluster:
              <select value={highlightCluster || ''} onChange={e => setHighlightCluster(e.target.value || null)} style={{ marginLeft: 8 }}>
                <option value=''>None</option>
                {[...new Set(nodes.map(n => n.cluster).filter(Boolean))].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
