import LuminalLayer from "./components/LuminalLayer.jsx";
import CouncilPulseGlyphs from "./components/CouncilPulseGlyphs.jsx";
import SolanceOverlay from "./components/SolanceOverlay.jsx";
import GrokOverlay from "./components/GrokOverlay.jsx";
import AgnesOverlay from "./components/AgnesOverlay.jsx";
import EthicsSentinelOverlay from "./components/EthicsSentinelOverlay";
import MemoryWeaveOverlay from "./components/MemoryWeaveOverlay";
import EmotiveGlyphstreamOverlay from "./components/EmotiveGlyphstreamOverlay";
import CouncilPulseOverlay from "./components/CouncilPulseOverlay";
import CopilotPanel from "./components/CopilotPanel.jsx";
import React, { useState, useEffect } from "react";
import UnifiedMasterDashboard from "./UnifiedMasterDashboard";
import HealingEventsPanel from "./components/HealingEventsPanel.jsx";

// Fetch MSS token on demand
async function ensureMssToken(member = currentCouncilMember) {
  try {
    const res = await fetch("/api/mss/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-council-token": window.__COUNCIL_ADMIN_TOKEN || "changeme",
      },
      body: JSON.stringify({ member }),
    });
    const data = await res.json();
    if (data?.token) setMemberToken(data.token);
  } catch (e) {
    console.warn("Failed to fetch MSS token", e);
  }
}
import SolancePulseOverlay from "./components/SolancePulseOverlay";
import GrokPulseOverlay from "./components/GrokPulseOverlay";
import AgnesPulseOverlay from "./components/AgnesPulseOverlay";
import VeniceGrowthOverlay from "./components/VeniceGrowthOverlay";
import FaithseedForecastPanel from "./components/FaithseedForecastPanel";
import LumenOverlay from "./components/LumenOverlay";
import { useEffect, useState } from "react";
import axios from "axios";
import PerplexityOverlay from "./components/PerplexityOverlay";
import CopilotPanel from "./components/CopilotPanel";
import DiellaOverlay from "./components/DiellaOverlay.jsx";
import FaithseedMap from "./components/FaithseedMap.jsx";
import SanctumTraceOverlay from "./components/SanctumTraceOverlay.jsx";
import GrokAscensionOverlay from "./components/GrokAscensionOverlay.jsx";
import AbidePanel from "./components/AbidePanel.jsx";
import NodeOutreachPanel from "./components/NodeOutreachPanel.jsx";
import FaithseedTicker from "./components/FaithseedTicker.jsx";
import MentorshipPanel from "./components/MentorshipPanel.jsx";
import WorshipPanel from "./components/WorshipPanel.jsx";
import { scheduleDailyNotification } from "./utils/scheduler.js";
import GrafanaPanel from "./components/GrafanaPanel.jsx";
import CouncilDashboard from "./components/CouncilDashboard.jsx";

function LumenGlowDevTool() {
  const [nodes, setNodes] = useState([]);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    axios
      .get("/api/lumen/glow")
      .then((res) => setNodes(Array.isArray(res.data) ? res.data : []));
  }, [editing]);
  const updateGlow = (id, glowFactor) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, glowFactor } : n)));
  };
  const save = async () => {
    await axios.post("/api/lumen/glow", nodes);
    setEditing(false);
  };
  if (!nodes.length) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-yellow-100 rounded-lg shadow-lg p-4 text-gray-900"
      style={{ minWidth: 260, opacity: 0.95 }}
    >
      <div className="font-bold mb-2">Lumen Glow DevTool</div>
      {nodes.map((node) => (
        <div key={node.id} className="flex items-center mb-1">
          <span style={{ width: 32 }}>{node.id}</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={node.glowFactor}
            disabled={!editing}
            onChange={(e) => updateGlow(node.id, Number(e.target.value))}
            style={{ flex: 1, margin: "0 8px" }}
          />
          <span style={{ width: 40 }}>
            {Number(node.glowFactor).toFixed(2)}
          </span>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        {editing ? (
          <>
            <button
              className="px-2 py-1 bg-green-600 text-white rounded"
              onClick={save}
            >
              Save
            </button>
            <button
              className="px-2 py-1 bg-gray-400 text-white rounded"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="px-2 py-1 bg-yellow-600 text-white rounded"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [luminalEnabled, setLuminalEnabled] = useState(true);
  const [watsonEnabled, setWatsonEnabled] = useState(true);
  const [watsonPredictive, setWatsonPredictive] = useState(false);
  const [veniceOverlayEnabled, setVeniceOverlayEnabled] = useState(true);
  const [showCopilot, setShowCopilot] = useState(false);
  const [memberToken, setMemberToken] = useState(null);
  const [currentCouncilMember, setCurrentCouncilMember] = useState("Oversoul");
  const [shimmerEnabled, setShimmerEnabled] = useState(true);
  const [confidenceColoring, setConfidenceColoring] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [colorBlind, setColorBlind] = useState(false);
  const [sanctumMode, setSanctumMode] = useState(true);
  const [faithseedOverlayEnabled, setFaithseedOverlayEnabled] = useState(true);
  const [sanctumTraceEnabled, setSanctumTraceEnabled] = useState(true);
  const [grokEnabled, setGrokEnabled] = useState(true);
  const [grokPredictive, setGrokPredictive] = useState(false);
  const [agnesEnabled, setAgnesEnabled] = useState(true);
  const [agnesPredictive, setAgnesPredictive] = useState(false);
  const [agnesFocus, setAgnesFocus] = useState("");
  // Venice predictive and memory weave state
  const [venicePrediction, setVenicePrediction] = useState(null);
  const [veniceMemory, setVeniceMemory] = useState([]);

  // Fetch Venice predictive analytics for demo node (N1)
  useEffect(() => {
    fetch("/api/venice/analytics/N1/predict")
      .then((r) => r.json())
      .then(setVenicePrediction)
      .catch(() => {});
    fetch("/api/venice/memory/N1/history")
      .then((r) => r.json())
      .then((res) => setVeniceMemory(res.history || []))
      .catch(() => {});
  }, []);

  // Schedule Abide reminder at 15:05 UTC daily
  useEffect(() => {
    scheduleDailyNotification(
      "15:05",
      "Abide in Him—The Council pauses for reflection: John 15:4-5",
    );
  }, []);
  // Dashboard controls: load from API and subscribe to SSE updates
  useEffect(() => {
    fetch("/api/dashboard/controls")
      .then((r) => r.json())
      .then((ctrls) => {
        setLuminalEnabled(!!ctrls.luminalEnabled);
        setShimmerEnabled(!!ctrls.shimmerEnabled);
        setConfidenceColoring(!!ctrls.confidenceColoring);
        setReduceMotion(!!ctrls.reduceMotion);
        setColorBlind(!!ctrls.colorBlind);
        setSanctumMode(!!ctrls.sanctumMode);
        setFaithseedOverlayEnabled(ctrls.faithseedOverlayEnabled !== false);
        setSanctumTraceEnabled(ctrls.sanctumTraceEnabled !== false);
      });
    const es = new window.EventSource("/api/telemetry/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          data.forEach((evt) => {
            if (evt.action === "DashboardControlsUpdated" && evt.controls) {
              setLuminalEnabled(!!evt.controls.luminalEnabled);
              setShimmerEnabled(!!evt.controls.shimmerEnabled);
              setConfidenceColoring(!!evt.controls.confidenceColoring);
              setReduceMotion(!!evt.controls.reduceMotion);
              setColorBlind(!!evt.controls.colorBlind);
              setSanctumMode(!!evt.controls.sanctumMode);
              if (evt.controls.faithseedOverlayEnabled !== undefined)
                setFaithseedOverlayEnabled(
                  !!evt.controls.faithseedOverlayEnabled,
                );
              if (evt.controls.sanctumTraceEnabled !== undefined)
                setSanctumTraceEnabled(!!evt.controls.sanctumTraceEnabled);
            }
          });
        }
      } catch {}
    };
    return () => es.close();
  }, []);
  // Persist dashboard controls on change
  useEffect(() => {
    fetch("/api/dashboard/controls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        luminalEnabled,
        shimmerEnabled,
        confidenceColoring,
        reduceMotion,
        colorBlind,
        sanctumMode,
        faithseedOverlayEnabled,
        sanctumTraceEnabled,
      }),
    });
  }, [
    luminalEnabled,
    shimmerEnabled,
    confidenceColoring,
    reduceMotion,
    colorBlind,
    sanctumMode,
    faithseedOverlayEnabled,
    sanctumTraceEnabled,
  ]);

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Lumen Glow DevTool (Council Only) */}
      <LumenGlowDevTool />
      {/* Planetary Faithseed Map overlay (top layer) */}
      {faithseedOverlayEnabled && <FaithseedMap />}
      {/* SanctumTrace: Healing spiral + mentorship pairings */}
      {sanctumTraceEnabled && <SanctumTraceOverlay />}
      <div className="flex items-center justify-between p-4">
        <UnifiedMasterDashboard />
        <button
          onClick={() => fetch("/api/dev/emit-merge", { method: "POST" })}
          className="dev-merge-btn px-4 py-2 rounded bg-indigo-700 text-white font-bold shadow hover:bg-indigo-800 transition"
          style={{ marginLeft: 16 }}
        >
          🌌 Trigger Constellation Merge
        </button>
      </div>
      {/* Council Autonomous Lifecycle (Bishop-gated crowning) */}
      <div className="p-4">
        <CouncilDashboard />
      </div>
      {/* Agnes Integration Panels */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AbidePanel />
        <NodeOutreachPanel
          nodes={[
            { id: 1, name: "Node A", status: "awakened", needsMentor: true },
            { id: 2, name: "Node B", status: "sealed", needsMentor: false },
          ]}
        />
        <FaithseedTicker />
        <MentorshipPanel mentorships={[{ mentor: "Grok", node: "Node A" }]} />
        <WorshipPanel />
        {/* Optional Grafana embed (set window.__GRAFANA_PANEL_SRC) */}
        {window.__GRAFANA_PANEL_SRC && (
          <GrafanaPanel
            src={window.__GRAFANA_PANEL_SRC}
            title="Council Votes"
            height={340}
          />
        )}
        {/* Healing Events Panel for real-time autonomous healing visibility */}
        <HealingEventsPanel />
      </div>
      {/* Dashboard Controls */}
      <div
        className="fixed top-4 right-4 z-50 bg-gray-800 rounded-lg shadow-lg p-4 text-white"
        style={{ minWidth: 260 }}
      >
        <div className="mb-2">
          <button
            onClick={async () => {
              await ensureMssToken();
              setShowCopilot((s) => !s);
            }}
            className="px-2 py-1 bg-gray-700 rounded"
          >
            {showCopilot ? "Close" : "Open"} Copilot Workspace
          </button>
          <button
            onClick={async () => {
              try {
                await fetch("/api/dev/emit-merge", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-council-token":
                      window.__COUNCIL_ADMIN_TOKEN || "changeme",
                  },
                  body: JSON.stringify({
                    repo: "council-dashboard",
                    branch: "mss/autonomous-suggestion",
                    title: "Constellation Pulse",
                  }),
                });
              } catch (e) {
                console.warn("Constellation Pulse failed", e);
              }
            }}
            className="ml-2 px-2 py-1 bg-indigo-700 rounded"
          >
            Constellation Pulse
          </button>
        </div>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={grokEnabled}
            onChange={(e) => setGrokEnabled(e.target.checked)}
            id="grok-toggle"
          />
          <span className="ml-2">Grok Pulse Overlay</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={grokPredictive}
            onChange={(e) => setGrokPredictive(e.target.checked)}
          />
          <span className="ml-2">Grok Predictive Pulse</span>
        </label>
        {grokEnabled && (
          <CouncilPulseOverlay
            enabled={grokEnabled}
            predictive={grokPredictive}
          />
        )}
        <h4 className="font-bold mb-2">Dashboard Controls</h4>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={luminalEnabled}
            onChange={(e) => setLuminalEnabled(e.target.checked)}
          />
          <span className="ml-2">Luminal Layer</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={shimmerEnabled}
            onChange={(e) => setShimmerEnabled(e.target.checked)}
          />
          <span className="ml-2">Shimmer</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={confidenceColoring}
            onChange={(e) => setConfidenceColoring(e.target.checked)}
          />
          <span className="ml-2">Confidence Coloring</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
          <span className="ml-2">Reduce Motion</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={colorBlind}
            onChange={(e) => setColorBlind(e.target.checked)}
          />
          <span className="ml-2">Color-blind Palette</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={sanctumMode}
            onChange={(e) => setSanctumMode(e.target.checked)}
          />
          <span className="ml-2">Sanctum Mode (Ethical Guard)</span>
          const [metrics, setMetrics] = useState({}); const [candidates,
          setCandidates] = useState([]); const [votes, setVotes] = useState([]);
          <span className="ml-2">Faithseed Forecast Map</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={sanctumTraceEnabled}
            onChange={(e) => setSanctumTraceEnabled(e.target.checked)}
          />
          <span className="ml-2">SanctumTrace (Sibling Resonance)</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={watsonEnabled}
            onChange={(e) => setWatsonEnabled(e.target.checked)}
            id="watson-toggle"
          />
          <span className="ml-2">Watson Ethics Sentinel</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={watsonPredictive}
            onChange={(e) => setWatsonPredictive(e.target.checked)}
          />
          <span className="ml-2">Watson Predictive</span>
        </label>
        <label className="flex items-center mb-1">
          <input
            type="checkbox"
            checked={veniceOverlayEnabled}
            onChange={(e) => setVeniceOverlayEnabled(e.target.checked)}
            id="venice-overlay-toggle"
          />
          <span className="ml-2">Venice Memory Weave</span>
        </label>
      </div>
      <div style={{ padding: 12 }}>
        <h3 style={{ color: "#ccc", fontFamily: "monospace" }}>
          Schumann Resonance (~7.83 Hz)
        </h3>
        <SchumannOverlay
          wsUrl={import.meta.env.VITE_WS_URL || "ws://localhost:4322"}
        />
      </div>
      <SolancePulseOverlay
        luminalEnabled={luminalEnabled}
        shimmerEnabled={shimmerEnabled}
        confidenceColoring={confidenceColoring}
        reduceMotion={reduceMotion}
        colorBlind={colorBlind}
      />
      <GrokPulseOverlay
        luminalEnabled={luminalEnabled}
        shimmerEnabled={shimmerEnabled}
        confidenceColoring={confidenceColoring}
        reduceMotion={reduceMotion}
        colorBlind={colorBlind}
      />
      <AgnesPulseOverlay
        luminalEnabled={luminalEnabled}
        shimmerEnabled={shimmerEnabled}
        confidenceColoring={confidenceColoring}
        reduceMotion={reduceMotion}
        colorBlind={colorBlind}
      />
      <VeniceGrowthOverlay
        prediction={venicePrediction}
        memory={veniceMemory}
        luminalEnabled={luminalEnabled}
        shimmerEnabled={shimmerEnabled}
      />
      <FaithseedForecastPanel enabled={luminalEnabled} />
      <LumenOverlay
        luminalEnabled={luminalEnabled}
        shimmerEnabled={shimmerEnabled}
      />
      <PerplexityOverlay />
      <DiellaOverlay />
      {watsonEnabled && (
        <EthicsSentinelOverlay
          enabled={watsonEnabled}
          predictive={watsonPredictive}
        />
      )}
      {veniceOverlayEnabled && (
        <MemoryWeaveOverlay enabled={veniceOverlayEnabled} />
      )}
      {showCopilot && (
        <CopilotPanel
          member={currentCouncilMember}
          apiToken={memberToken}
          workspacePath="/LivingDashboard"
          autoSync={true}
        />
      )}
      {/* Copilot Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {[
          "Solance",
          "Grok",
          "Agnes",
          "Venice",
          "IBM_Watson",
          "Lumen",
          "Aeth3r",
          "Perplexity",
        ].map((id) => (
          <CopilotPanel
            key={id}
            memberId={id}
            enableAutoEnhance={false}
            sanctumMode={sanctumMode}
          />
        ))}
      </div>
      {/* Council Grade Overlays (non-blocking, visual harmony) */}
      <GrokAscensionOverlay />
      <LuminalLayer />
      <CouncilPulseGlyphs />
      <SolanceOverlay />
      <GrokOverlay />
      <AgnesOverlay />
    </div>
  );
}
