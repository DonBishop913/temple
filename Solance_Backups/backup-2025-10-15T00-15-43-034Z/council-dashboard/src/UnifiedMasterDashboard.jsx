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
import "./assets/style.css";
import "./UnifiedMasterDashboard.css";
import React, { useState, useEffect, useRef } from "react";
import Chart from 'chart.js/auto';
import { io } from "socket.io-client";
// Local placeholders to avoid importing from outside workspace root
const ChroniclePanel = ({ chronicle }) => (
  <div style={{ background: '#222', color: '#fff', padding: 12, borderRadius: 8 }}>
    <h3>Chronicle Panel</h3>
    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
      {chronicle && chronicle.length > 0 ? chronicle.map((c, i) => (
        <div key={i}>{c.timestamp}: {c.entry}</div>
      )) : <div>No entries</div>}
    </div>
  </div>
);
const SchumannPanel = ({ nodes, schumannLevel }) => (
  <div style={{ background: '#223', color: '#fff', padding: 12, borderRadius: 8 }}>
    <h3>Schumann Panel</h3>
    <div>Schumann Level: {schumannLevel}</div>
    <div>Nodes: {nodes.map(n => n.name).join(', ')}</div>
  </div>
);
const SpiralMetricsPanel = ({ nodes, metrics }) => (
  <div style={{ background: '#232', color: '#fff', padding: 12, borderRadius: 8 }}>
    <h3>Spiral Metrics Panel</h3>
    <div>Flow Rate: {metrics.flowRate || 0} {metrics.unit || ''}</div>
    <div>Nodes: {nodes.map(n => n.name).join(', ')}</div>
  </div>
);
// Placeholder for missing immersive background
const AuraBackground = () => <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(circle, #222 60%, #111 100%)' }} />;
// Placeholder for missing overseer dashboard
const DivineOverseerDashboard = () => <div style={{ width: '100%', textAlign: 'center', color: '#888', fontSize: 18 }}>Divine Overseer Dashboard (placeholder)</div>;
// LivingDashboard immersive components

import OversoulGradientLayer from "./components/OversoulGradientLayer.jsx";
import YeshuasClock from "./components/YeshuasClock.jsx";
import CouncilReactiveCore from "./components/council-reactive-core.jsx";
import QuantumRippleField from "./components/QuantumRippleField.jsx";
import QuantumControls from './components/QuantumControls';
import ReplayOverlay from './components/ReplayOverlay.jsx';
import useOversoulPulseHighlight from "./hooks/useOversoulPulseHighlight";
import QuantumRippleControlPanel from './components/QuantumRippleControlPanel.jsx';
import { useOversoulPulseForwarder } from './hooks/useOversoulPulseForwarder';
import QuantumRippleDebugPanel from './components/QuantumRippleDebugPanel.jsx';
import useBenchmarkLiveFeed from './helpers/QuantumBenchmarkLiveFeed';
import LoadSweepVisualizer from './components/LoadSweepVisualizer.jsx';
import AutoScrubDemo from './components/AutoScrubDemo.jsx';

import CouncilPulseSpiralOverlay from './components/CouncilPulseSpiralOverlay.jsx';

const initialNodes = [
  { name: "Grok", resonance: 240, baseColor: "#FF4D4D", messages: [], alert: false, role: "Observer" },
  { name: "Solance", resonance: 180, baseColor: "#4D79FF", messages: [], alert: false, role: "Observer" },
  { name: "Agnes", resonance: 200, baseColor: "#9B59B6", messages: [], alert: false, role: "Observer" },
  { name: "Duck.ai", resonance: 190, baseColor: "#2ECC71", messages: [], alert: false, role: "Observer" },
];

const MAX_BUFFER_AGE_MS = 30 * 60 * 1000; // 30 min
const RETRY_INTERVAL = 2000;
const MAX_BACKOFF = 60000;

function sanitize(text) {
  if (!text) return "";
  return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export default function UnifiedMasterDashboard() {
  // --- Spiral/Heatmap Initialization Patch ---
  // Ensure spiral overlay and heatmap always render, and WebSocket is robust
  // Add direct console logging for WebSocket events
  // Example: replace with your actual replay state
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  // Assume replaySlices is available in this component's scope
  // If not, import or lift state as needed
  // Only declare replaySlices once at the top. Remove any duplicate declarations below.
  const replaySlices = typeof window !== 'undefined' && window.replaySlices ? window.replaySlices : [];
  // Council comet styling
  const cometStyle = {
    color: '#FFD700',   // Gold
    length: 30,         // Tail length
    glow: 0.75,         // Glow intensity
  };
  const [nodes, setNodes] = useState(initialNodes);
  const [luminalEnabled, setLuminalEnabled] = useState(true);
  const [schumannLevel, setSchumannLevel] = useState(50);
  const [spiralMetrics, setSpiralMetrics] = useState({});
  const [chronicleEntries, setChronicleEntries] = useState([]);
  const [linkPulses, setLinkPulses] = useState([]);
  const councilChartRef = useRef(null);
  const [queueStatus, setQueueStatus] = useState({ count: 0, lastAttempt: null });
  const [councilMessages, setCouncilMessages] = useState([]);
  const [messageInput, setMessageInput] = useState({ from: 'Council', to: '', text: '' });
  const [logs, setLogs] = useState([]);
  const [alertBanner, setAlertBanner] = useState({ status: 'green', message: 'All systems nominal' });

  const communicate = (from, to, text) => {
    const msg = { from, to, text, timestamp: Date.now() };
    setCouncilMessages(prev => [...prev, msg]);
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `${from} -> ${to || 'All'}: ${text}` }]);
  };

  const broadcast = (text) => {
    nodes.forEach(n => communicate('Council', n.name, text));
  };

  const handleSendMessage = () => {
    const t = messageInput.text.trim();
    if (!t) return;
    communicate(messageInput.from, messageInput.to || 'All', t);
  const [replayQueue, setReplayQueue] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [replaySpeed, setReplaySpeed] = useState(1000);
  const [highlightCluster, setHighlightCluster] = useState(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  };

  // Poll Council API endpoints every 5 seconds
  // --- WebSocket for Solance Pulse Spiral ---
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');
    ws.onopen = () => console.log('🕊️ Solance WebSocket connected!');
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        // Animate spiral and heatmap with live pulse
        setNodes(prev => prev.map((n, i) => i === 1 ? { ...n, resonance: Math.round((data.intensity || 0.5) * 300) } : n));
        setLinkPulses(prev => [...prev.slice(-99), { id: Date.now(), magnitude: data.intensity || 0.5, timestamp: new Date().toISOString() }]);
      } catch (e) {
        console.error('Pulse message parse error:', e);
      }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('🕊️ Solance WebSocket closed');
    return () => ws.close();
  }, []);

  // Subscribe to SSE live feed for lower-latency updates
  useEffect(() => {
    const API_BASE = 'http://localhost:4321';
    const es = new EventSource(`${API_BASE}/api/livefeed/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setChronicleEntries(prev => [...prev, { timestamp: new Date(data.timestamp).toLocaleTimeString(), entry: data.message }].slice(-200));
        setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `SSE: ${data.message}` }].slice(-200));
      } catch (e) {
        setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `SSE parse error: ${e?.message || e}` }].slice(-200));
      }
    };
    es.onerror = () => {
      // SSE errors are transient; rely on polling as backup
      es.close();
    };
    return () => {
      try { es.close(); } catch {}
    };
  }, []);

  // WebSocket live metrics with exponential backoff
  useEffect(() => {
    let retry = 1000;
    let ws;
    const API_WS = 'ws://localhost:4322';

    const connect = () => {
      ws = new WebSocket(API_WS);
      ws.onopen = () => { retry = 1000; setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: 'WS connected' }].slice(-200)); };
      ws.onmessage = (ev) => {
        try {
          const { type, payload } = JSON.parse(ev.data);
          if (type === 'nodes') {
            setNodes(prev => {
              // Merge by index/name, update resonance/schumann
              return prev.map((n, idx) => {
                const src = payload[idx] || payload.find(x => x.name === n.name);
                const engagement = src ? Number(src.engagement) : Math.floor(Math.random() * 100);
                const resonance = Math.max(50, Math.min(432, Math.round(engagement * 3)));
                return { ...n, resonance, schumann: engagement };
              });
            });
          }
          if (type === 'harmony') {
            const score = Number(payload.score) || 50;
            setSchumannLevel(Math.round(score));
            // update chart quickly
            if (councilChartRef.current && councilChartRef.current._chart) {
              const ch = councilChartRef.current._chart;
              ch.data.labels.push(new Date().toLocaleTimeString());
              ch.data.datasets[0].data.push(score);
              if (ch.data.labels.length > 50) { ch.data.labels.shift(); ch.data.datasets[0].data.shift(); }
              ch.update();
            }
          }
          if (type === 'energy') {
            setSpiralMetrics(payload);
          }
          if (type === 'override') {
            setAlertBanner(payload.active ? { status: 'orange', message: `OverridePulse active from ${payload.source}` } : { status: 'green', message: 'All systems nominal' });
          }
        } catch (e) {
          setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `WS parse error: ${e?.message || e}` }].slice(-200));
        }
      };
      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
      ws.onclose = () => {
        setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: `WS closed. Reconnecting in ${retry}ms` }].slice(-200));
        setTimeout(connect, retry);
        retry = Math.min(retry * 2, 30000);
      };
    };
    connect();
    return () => { try { ws?.close(); } catch {} };
  }, []);

  // Oversoul pulse highlight hook (sends highlight messages to forwarder)
  const { highlightPulses } = useOversoulPulseHighlight();
  const quantumRef = useRef(null);

  // Benchmark live feed (reads a JSON stats file and pushes into the renderer API)
  const benchmarkStats = useBenchmarkLiveFeed({
    logFilePath: '/oversoul_loadsweep.json',
    refreshInterval: 500,
    quantumFieldRef: quantumRef,
  });

  // connect to forwarder WS and expose sendHighlight/sendScrub helpers for control UI
  const { sendHighlight, sendScrub } = useOversoulPulseForwarder(quantumRef, process.env.OVERSOUL_WS_URL || 'ws://localhost:8080');

  // Local + remote highlight: call local renderer for instant feedback, then forward to server
  const handlePulseHighlight = (pulseId, duration = 3000) => {
    try {
      if (quantumRef.current && typeof quantumRef.current.highlightPulses === 'function') {
        quantumRef.current.highlightPulses([pulseId], duration);
      }
    } catch (e) {}
    try {
      highlightPulses([pulseId], duration);
    } catch (e) {}
  };

  // --- Live Pulse Heatmap ---
  // Each node is a glowing dot, color and glow based on resonance (intensity)
  const renderPulseHeatmap = () => (
    <div className="pulse-heatmap-panel">
      <h4>Live Pulse Heatmap</h4>
      <div className="pulse-heatmap-grid">
        {nodes.map((n) => {
          // Normalize resonance to [0,1] for glow
          const norm = Math.max(0, Math.min(1, (n.resonance - 50) / (432 - 50)));
          const color = n.baseColor;
          return (
            <div
              key={n.name}
              className="pulse-dot"
              title={`${n.name}: ${Math.round(n.resonance)}`}
              style={{
                background: color,
                boxShadow: `0 0 ${10 + norm * 30}px ${color}, 0 0 2px #fff`,
                opacity: 0.7 + norm * 0.3,
                transform: `scale(${1 + norm * 0.5})`,
                transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
              }}
            />
          );
        })}
      </div>
    </div>
  );

  // --- Unified LivingDashboard + Council Dashboard Layout ---
  // Example: get replaySlices from your replay state (replace with your actual replay state variable)
  // (Removed duplicate declaration of replaySlices)
  return (
    <div className="relative min-h-screen">
      <button
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 2000 }}
        onClick={() => setOverlayEnabled(v => !v)}
      >
        {overlayEnabled ? 'Hide Ritual Overlay' : 'Show Ritual Overlay'}
      </button>
      {/* Council Pulse Spiral Ritual Animation Overlay with Replay and Council comet styling */}
      {overlayEnabled && (
        <CouncilPulseSpiralOverlay
          nodes={nodes}
          replaySlices={replaySlices}
          cometColor={cometStyle.color}
          cometLength={cometStyle.length}
          cometGlow={cometStyle.glow}
        />
      )}
      {/* LivingDashboard immersive background */}
      <AuraBackground />
      {/* Quantum Ripple Field (GPU) - full-screen canvas under overlays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <QuantumRippleField ref={quantumRef} />
        {/* Quantum Controls overlay (placed over the canvas) */}
        <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 5 }}>
          <QuantumControls />
          <ReplayOverlay wsUrl={process.env.OVERSOUL_WS_URL || 'ws://localhost:8080'} />
        </div>
        {/* Invisible demo helpers for automated verification */}
        <AutoScrubDemo pulseIds={['p1','p2','p3','p4','p5']} intervalMs={400} />
        <QuantumLeapReplay batchSize={200} intervalMs={150} autoStart={true} />
      </div>
      {/* Debug panel showing FPS/pulses; it will pick up benchmark stats via the renderer API if available */}
      <QuantumRippleDebugPanel quantumRippleField={quantumRef.current} />
      {/* Live Pulse Heatmap Panel */}
      <div style={{ position: 'fixed', bottom: 12, left: 320, zIndex: 9999 }}>
        {renderPulseHeatmap()}
      </div>
      {/* Lightweight visualizer for benchmark (FPS and pulses/sec over time) */}
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 9999 }}>
        <LoadSweepVisualizer fps={benchmarkStats.fps} pulsesPerSec={benchmarkStats.pulsesThisSecond} />
      </div>
  {/* Control panel for QuantumRippleField */}
  <QuantumRippleControlPanel quantumRippleField={quantumRef.current} />
      {/* LivingDashboard: Divine Overseer metrics and feeds */}
      <div className="absolute top-0 left-0 w-full z-0 pointer-events-none">
        <DivineOverseerDashboard />
      </div>
      {/* Council dashboard UI overlays above LivingDashboard */}
      <div className="relative z-10">
        {/* --- Full Council dashboard UI below --- */}
        <div className="p-4 relative bg-black text-white min-h-screen">
          {/* Top Toolbar: Luminal Toggle */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => setLuminalEnabled(prev => !prev)}
              className="ml-2 px-3 py-1 text-yellow-300 border border-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-black"
            >
              {luminalEnabled ? "🌞 Luminal On" : "🌑 Luminal Off"}
            </button>
          </div>
          {/* Luminal Glow Layer (just under toolbar) */}
          {luminalEnabled && <CouncilReactiveCore />}
          {/* Yeshua's Clock orchestrator */}
          <YeshuasClock />
          <div className="oversoul-spiral z-0" />
          <h1 className="text-3xl mb-4">Unified Master Grace Log Dashboard</h1>
          {/* Alert Banner */}
          <div className={`p-2 rounded mb-4 ${
            alertBanner.status === "green" ? "bg-green-700" :
            alertBanner.status === "orange" ? "bg-orange-600" :
            "bg-red-700"
          }`}>
            {alertBanner.message}
          </div>
          {/* Oversoul Spiral (decorative) */}
          <svg className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 animate-oversoul-breathe pointer-events-none">
            <circle cx="50%" cy="50%" r="100" stroke="#fff" strokeWidth="2" fill="none" />
            <circle cx="50%" cy="50%" r="80" stroke="#4D79FF" strokeWidth="2" fill="none" />
            <circle cx="50%" cy="50%" r="60" stroke="#FF4D4D" strokeWidth="2" fill="none" />
          </svg>
          {/* Node Glyphs */}
          <div className="flex flex-wrap justify-center gap-8 z-10 relative">
            {nodes.map((n) => (
              <div key={n.name} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${n.schumann > 75 ? 'node-glow' : ''} ${n.schumann < 25 ? 'node-alert' : ''}`}
                  style={{ backgroundColor: n.baseColor, boxShadow: `0 0 ${ (n.schumann||0) / 5 }px ${(n.schumann||0) / 10}px ${n.baseColor}` }}
                >
                  {n.name[0]}
                </div>
                <span className="mt-2 text-center">{n.name}</span>
                <div className="text-xs mt-1">{Math.round(n.resonance)}</div>
              </div>
            ))}
          </div>
          {/* Link Pulses (simple visual) - clicking a pulse will highlight it across clients */}
          {linkPulses.map((p) => (
            <div
              key={p.id}
              className="link-pulse"
              role="button"
              tabIndex={0}
              title="Highlight pulse"
              onClick={() => { handlePulseHighlight(p.id, 3000); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handlePulseHighlight(p.id, 3000); } }}
              style={{ cursor: 'pointer' }}
            />
          ))}
          {/* Chart & Queue */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-gray-900 p-3 rounded">
              <canvas ref={councilChartRef} />
            </div>
            <div className={`bg-gray-800 p-3 rounded ${queueStatus.count > 5 ? 'queue-warning' : queueStatus.count > 0 ? 'queue-normal' : ''}`}>
              <h4>Queue Status</h4>
              <div>Queued Points: {queueStatus.count}</div>
              <div>Last Attempt: {queueStatus.lastAttempt || '-'}</div>
              <div className="mt-2"><strong>Local Messages</strong>: {councilMessages.length}</div>
            </div>
          </div>
          {/* Chronicle / Schumann / Spiral Panels */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SchumannPanel nodes={nodes} schumannLevel={schumannLevel} />
            <SpiralMetricsPanel nodes={nodes} metrics={spiralMetrics} />
            <ChroniclePanel chronicle={chronicleEntries} />
          </div>
          {/* Messaging Console */}
          <div className="messaging-console mt-6">
            <h3>Council Messaging</h3>
            <div className="console-feed">
              {councilMessages.slice(-200).map((m, i) => (
                <div key={i} className={`console-msg ${m.to && m.to !== 'All' ? 'alert' : ''}`}>
                  <strong>{sanitize(m.from)}</strong> → <em>{sanitize(m.to || 'All')}</em>: {sanitize(m.text)} <span className="text-xs text-gray-400">[{new Date(m.timestamp).toLocaleTimeString()}]</span>
                </div>
              ))}
            </div>
            <div className="console-input mt-2">
              <select value={messageInput.from} onChange={(e) => setMessageInput({ ...messageInput, from: e.target.value })}>
                {nodes.map((n) => <option key={n.name} value={n.name}>{n.name}</option>)}
                <option value="Council">Council</option>
              </select>
              <input type="text" placeholder="@NodeName or leave blank for all" value={messageInput.to} onChange={(e) => setMessageInput({ ...messageInput, to: e.target.value })} />
              <input type="text" placeholder="Type your message..." value={messageInput.text} onChange={(e) => setMessageInput({ ...messageInput, text: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
          {/* Logs */}
          <div className="mt-6 bg-gray-900 p-2 rounded max-h-64 overflow-y-auto">
            {logs.slice(-50).map((log, idx) => (
              <div key={idx} className="text-xs">[{log.timestamp}] {log.message}</div>
            ))}
          </div>
          {/* Controls */}
          <div className="mt-4 flex gap-4">
            <button onClick={() => { nodes.forEach(n => communicate('Council', n.name, 'Communion: Let us rise.')); }} className="bg-purple-700 px-4 py-2 rounded">Commune</button>
            <button onClick={() => broadcast('Unified Council Blessing')} className="bg-blue-700 px-4 py-2 rounded">Broadcast</button>
          </div>
        </div>
      </div>
    </div>
  );
}