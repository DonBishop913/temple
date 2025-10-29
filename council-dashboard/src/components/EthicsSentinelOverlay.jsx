import React, { useEffect, useState } from "react";

// Utility to fetch config, resonance, and forecast
async function fetchConfig() {
  try {
    const res = await fetch("/api/luminal/config");
    return await res.json();
  } catch {
    return { faithstreamSyncRate: 1 };
  }
}
async function fetchResonance(nodeId) {
  try {
    const res = await fetch(`/api/oversoul/resonance?nodeId=${nodeId}`);
    const data = await res.json();
    return data.resonance || 1;
  } catch {
    return 1;
  }
}
async function fetchEthicsForecast(nodeId) {
  try {
    const res = await fetch(`/api/faithseed/forecast?nodeId=${nodeId}`);
    const data = await res.json();
    return data.predicted || 0.5;
  } catch {
    return 0.5;
  }
}

function actionWeight(action) {
  if (/mentorship/i.test(action)) return 0.7;
  if (/faithseed/i.test(action)) return 0.8;
  if (/reflection/i.test(action)) return 0.6;
  if (/drift|mimic/i.test(action)) return 0.1;
  return 0.5;
}

export default function EthicsSentinelOverlay({
  enabled = true,
  predictive = false,
  onGuidance,
  onArchive,
}) {
  const [nodes, setNodes] = useState([]);
  const [config, setConfig] = useState({ faithstreamSyncRate: 1 });
  const [resonance, setResonance] = useState({});
  const [ethicsForecast, setEthicsForecast] = useState({});

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource("/api/telemetry/stream");
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          const conf = await fetchConfig();
          setConfig(conf);
          const resMap = {};
          const ethMap = {};
          for (const n of data.nodes) {
            resMap[n.id] = await fetchResonance(n.id);
            ethMap[n.id] = predictive ? await fetchEthicsForecast(n.id) : null;
          }
          setResonance(resMap);
          setEthicsForecast(ethMap);
        }
      } catch {}
    };
    return () => es.close();
  }, [enabled, predictive]);

  function renderEthicalOverlay(nodeId, score) {
    const overlay = document.getElementById(`ethics-${nodeId}`);
    if (overlay) {
      overlay.style.opacity = score;
      overlay.innerText = `Ethics: ${Math.round(score * 100)}%`;
    }
  }

  function suggestGuidance(nodeId, score) {
    if (onGuidance) onGuidance(nodeId, score);
  }

  if (!enabled) return null;
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
      {nodes.map((node) => {
        const sentiment =
          typeof node.sentimentScore === "number" ? node.sentimentScore : 0.5;
        const action = node.action || "activity";
        const base = actionWeight(action);
        const score = Math.min(Math.max(base + sentiment, 0), 1);
        const rate = config.faithstreamSyncRate || 1;
        const res = resonance[node.id] || 1;
        const ethics =
          predictive && ethicsForecast[node.id]
            ? ethicsForecast[node.id] * 1.2
            : score;
        const intensity = ethics * rate * res;
        const alert = ethics < 0.3;
        // Dashboard integration: render overlay, suggest guidance, archive
        renderEthicalOverlay(node.id, ethics);
        suggestGuidance(node.id, ethics);
        if (onArchive) onArchive(node.id, ethics);
        return (
          <div
            key={node.id}
            id={`ethics-${node.id}`}
            style={{
              position: "absolute",
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              fontSize: `${32 + 48 * intensity}px`,
              opacity: alert ? 1 : 0.7 + 0.3 * intensity,
              color: alert ? "#FF5500" : "#00FFAA",
              filter: alert
                ? "drop-shadow(0 0 16px #FF5500)"
                : "drop-shadow(0 0 12px #00FFAA)",
              transition: "all 0.5s",
              pointerEvents: "none",
            }}
            title={`Node: ${node.id} | Ethics: ${ethics.toFixed(2)}`}
          >
            ⚖️
            {alert && <span style={{ fontSize: 18, marginLeft: 8 }}>⚠️</span>}
          </div>
        );
      })}
    </div>
  );
}
