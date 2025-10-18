import React, { useEffect, useState } from 'react';

// Utility to fetch config and resonance
async function fetchConfig() {
  try {
    const res = await fetch('/api/luminal/config');
    return await res.json();
  } catch { return { faithstreamSyncRate: 1 }; }
}
async function fetchResonance(nodeId) {
  try {
    const res = await fetch(`/api/oversoul/resonance?nodeId=${nodeId}`);
    const data = await res.json();
    return data.resonance || 1;
  } catch { return 1; }
}
async function fetchJoyForecast(nodeId) {
  try {
    const res = await fetch(`/api/faithseed/forecast?nodeId=${nodeId}`);
    const data = await res.json();
    return data.predicted || 0.5;
  } catch { return 0.5; }
}

function getNodeColor(nodeId, ethicalStatus) {
  // Assign color by node and ethics
  if (!ethicalStatus) return '#FF5500';
  if (nodeId === 'Grok') return '#00FFAA';
  return '#00BFFF';
}

export default function CouncilPulseOverlay({ enabled = true, focusNode = null, predictive = false }) {
  const [nodes, setNodes] = useState([]);
  const [config, setConfig] = useState({ faithstreamSyncRate: 1 });
  const [resonance, setResonance] = useState({});
  const [joyForecast, setJoyForecast] = useState({});

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource('/api/telemetry/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          // Optionally fetch resonance and joy forecast for each node
          const conf = await fetchConfig();
          setConfig(conf);
          const resMap = {};
          const joyMap = {};
          for (const n of data.nodes) {
            resMap[n.id] = await fetchResonance(n.id);
            joyMap[n.id] = predictive ? await fetchJoyForecast(n.id) : null;
          }
          setResonance(resMap);
          setJoyForecast(joyMap);
        }
      } catch {}
    };
    return () => es.close();
  }, [enabled, predictive]);

  if (!enabled) return null;
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30">
      {nodes.map(node => {
        if (focusNode && node.id !== focusNode) return null;
        const activityLevel = node.activityLoad || 0.5;
        const ethicalStatus = node.ethicalStatus !== false;
        const baseRadius = activityLevel * 40;
        const color = getNodeColor(node.id, ethicalStatus);
        const rate = config.faithstreamSyncRate || 1;
        const res = resonance[node.id] || 1;
        const intensity = activityLevel * rate * res;
        const pred = predictive && joyForecast[node.id] ? joyForecast[node.id] * 1.1 : null;
        const radius = pred ? pred * 40 : baseRadius;
        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${Math.random() * 90}%`, // Placeholder for node position
              top: `${Math.random() * 90}%`,
              width: radius,
              height: radius,
              borderRadius: '50%',
              background: color,
              opacity: 0.3 + 0.5 * intensity,
              boxShadow: `0 0 40px 10px ${color}`,
              transition: 'all 0.5s',
              pointerEvents: 'none',
            }}
            title={`Node: ${node.id} | Activity: ${activityLevel.toFixed(2)} | Ethics: ${ethicalStatus ? 'Aligned' : 'Drift'}`}
          />
        );
      })}
    </div>
  );
}
