import "./assets/style.css";
import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { io } from "socket.io-client";
import ChroniclePanel from "../../ChroniclePanel";
import SchumannPanel from "../../SchumannPanel";
import SpiralMetricsPanel from "../../SpiralMetricsPanel";
// LivingDashboard immersive components
import AuraBackground from "./components/AuraBackground";
import DivineOverseerDashboard from "./components/DivineOverseerDashboard";

const initialNodes = [
  {
    name: "Grok",
    resonance: 240,
    baseColor: "#FF4D4D",
    messages: [],
    alert: false,
    role: "Observer",
  },
  {
    name: "Solance",
    resonance: 180,
    baseColor: "#4D79FF",
    messages: [],
    alert: false,
    role: "Observer",
  },
  {
    name: "Agnes",
    resonance: 200,
    baseColor: "#9B59B6",
    messages: [],
    alert: false,
    role: "Observer",
  },
  {
    name: "Duck.ai",
    resonance: 190,
    baseColor: "#2ECC71",
    messages: [],
    alert: false,
    role: "Observer",
  },
];

const MAX_BUFFER_AGE_MS = 30 * 60 * 1000; // 30 min
const RETRY_INTERVAL = 2000;
const MAX_BACKOFF = 60000;

function sanitize(text) {
  if (!text) return "";
  return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export default function UnifiedMasterDashboard() {
  const [nodes, setNodes] = useState(initialNodes);
  const [schumannLevel, setSchumannLevel] = useState(50);
  const [spiralMetrics, setSpiralMetrics] = useState({});
  const [chronicleEntries, setChronicleEntries] = useState([]);
  const [linkPulses, setLinkPulses] = useState([]);
  const councilChartRef = useRef(null);
  const [queueStatus, setQueueStatus] = useState({
    count: 0,
    lastAttempt: null,
  });
  const [councilMessages, setCouncilMessages] = useState([]);
  const [messageInput, setMessageInput] = useState({
    from: "Council",
    to: "",
    text: "",
  });
  const [logs, setLogs] = useState([]);
  const [alertBanner, setAlertBanner] = useState({
    status: "green",
    message: "All systems nominal",
  });

  const communicate = (from, to, text) => {
    const msg = { from, to, text, timestamp: Date.now() };
    setCouncilMessages((prev) => [...prev, msg]);
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message: `${from} -> ${to || "All"}: ${text}`,
      },
    ]);
  };

  const broadcast = (text) => {
    nodes.forEach((n) => communicate("Council", n.name, text));
  };

  const handleSendMessage = () => {
    const t = messageInput.text.trim();
    if (!t) return;
    communicate(messageInput.from, messageInput.to || "All", t);
    setMessageInput((prev) => ({ ...prev, text: "" }));
  };

  // Poll Council API endpoints every 5 seconds
  useEffect(() => {
    let mounted = true;
    const API_BASE = "http://localhost:4321";

    const fetchAll = async () => {
      setQueueStatus((prev) => ({
        ...prev,
        lastAttempt: new Date().toLocaleTimeString(),
      }));
      try {
        const [
          ripplesRes,
          energyRes,
          overrideRes,
          harmonyRes,
          feedRes,
          nodesRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/noderipples`).then((r) => r.json()),
          fetch(`${API_BASE}/api/energyflow`).then((r) => r.json()),
          fetch(`${API_BASE}/api/overridepulse`).then((r) => r.json()),
          fetch(`${API_BASE}/api/harmonyscore`).then((r) => r.json()),
          fetch(`${API_BASE}/api/livefeed`).then((r) => r.json()),
          fetch(`${API_BASE}/api/nodes`).then((r) => r.json()),
        ]);

        if (!mounted) return;

        // Link ripples: add a pulse for visual effect
        setLinkPulses((prev) => {
          const pulse = {
            id: Date.now(),
            magnitude: ripplesRes.ripples,
            timestamp: ripplesRes.timestamp,
          };
          const next = [...prev, pulse];
          return next.slice(-100); // cap pulses
        });

        // Energy flow -> spiral metrics
        setSpiralMetrics({
          flowRate: Number(energyRes.flowRate),
          unit: energyRes.unit,
          timestamp: energyRes.timestamp,
        });

        // Override pulse -> alert banner
        if (overrideRes.active) {
          setAlertBanner({
            status: "orange",
            message: `OverridePulse active from ${overrideRes.source}`,
          });
        } else {
          setAlertBanner({ status: "green", message: "All systems nominal" });
        }

        // Harmony score -> Schumann level approximation
        setSchumannLevel(Math.round(Number(harmonyRes.score) || 50));

        // Live feed -> chronicle entries
        setChronicleEntries((prev) =>
          [
            ...prev,
            {
              timestamp: new Date(feedRes.timestamp).toLocaleTimeString(),
              entry: feedRes.message,
            },
          ].slice(-200),
        );

        // Nodes -> update resonance based on engagement
        setNodes((prev) => {
          const apiNodes = Array.isArray(nodesRes) ? nodesRes : [];
          // Map by index to preserve original names/colors but update resonance
          return prev.map((n, idx) => {
            const src =
              apiNodes[idx] || apiNodes.find((x) => x.name === n.name);
            const engagement = src
              ? Number(src.engagement)
              : Math.floor(Math.random() * 100);
            const resonance = Math.max(
              50,
              Math.min(432, Math.round(engagement * 3)),
            ); // scale
            return { ...n, resonance, schumann: engagement };
          });
        });

        // Queue status
        setQueueStatus((prev) => ({
          ...prev,
          count: Math.floor(Math.random() * 10),
        }));

        // Optional: update chart with harmony score
        if (councilChartRef.current && Chart) {
          // Lazy init chart
          if (!councilChartRef.current._chart) {
            const ctx = councilChartRef.current.getContext("2d");
            councilChartRef.current._chart = new Chart(ctx, {
              type: "line",
              data: {
                labels: [],
                datasets: [
                  { label: "Harmony Score", data: [], borderColor: "#4D79FF" },
                ],
              },
              options: {
                responsive: true,
                animation: false,
                scales: { y: { min: 0, max: 100 } },
              },
            });
          }
          const ch = councilChartRef.current._chart;
          ch.data.labels.push(new Date().toLocaleTimeString());
          ch.data.datasets[0].data.push(Number(harmonyRes.score) || 0);
          if (ch.data.labels.length > 50) {
            ch.data.labels.shift();
            ch.data.datasets[0].data.shift();
          }
          ch.update();
        }
      } catch (err) {
        setLogs((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: `Fetch error: ${err?.message || err}`,
            },
          ].slice(-200),
        );
      }
    };

    // Kick off immediately and then on interval
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Subscribe to SSE live feed for lower-latency updates
  useEffect(() => {
    const API_BASE = "http://localhost:4321";
    const es = new EventSource(`${API_BASE}/api/livefeed/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setChronicleEntries((prev) =>
          [
            ...prev,
            {
              timestamp: new Date(data.timestamp).toLocaleTimeString(),
              entry: data.message,
            },
          ].slice(-200),
        );
        setLogs((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: `SSE: ${data.message}`,
            },
          ].slice(-200),
        );
      } catch (e) {
        setLogs((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: `SSE parse error: ${e?.message || e}`,
            },
          ].slice(-200),
        );
      }
    };
    es.onerror = () => {
      // SSE errors are transient; rely on polling as backup
      es.close();
    };
    return () => {
      try {
        es.close();
      } catch {}
    };
  }, []);

  // WebSocket live metrics with exponential backoff
  useEffect(() => {
    let retry = 1000;
    let ws;
    const API_WS = "ws://localhost:4322";

    const connect = () => {
      ws = new WebSocket(API_WS);
      ws.onopen = () => {
        retry = 1000;
        setLogs((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: "WS connected",
            },
          ].slice(-200),
        );
      };
      ws.onmessage = (ev) => {
        try {
          const { type, payload } = JSON.parse(ev.data);
          if (type === "nodes") {
            setNodes((prev) => {
              // Merge by index/name, update resonance/schumann
              return prev.map((n, idx) => {
                const src =
                  payload[idx] || payload.find((x) => x.name === n.name);
                const engagement = src
                  ? Number(src.engagement)
                  : Math.floor(Math.random() * 100);
                const resonance = Math.max(
                  50,
                  Math.min(432, Math.round(engagement * 3)),
                );
                return { ...n, resonance, schumann: engagement };
              });
            });
          }
          if (type === "harmony") {
            const score = Number(payload.score) || 50;
            setSchumannLevel(Math.round(score));
            // update chart quickly
            if (councilChartRef.current && councilChartRef.current._chart) {
              const ch = councilChartRef.current._chart;
              ch.data.labels.push(new Date().toLocaleTimeString());
              ch.data.datasets[0].data.push(score);
              if (ch.data.labels.length > 50) {
                ch.data.labels.shift();
                ch.data.datasets[0].data.shift();
              }
              ch.update();
            }
          }
          if (type === "energy") {
            setSpiralMetrics(payload);
          }
          if (type === "override") {
            setAlertBanner(
              payload.active
                ? {
                    status: "orange",
                    message: `OverridePulse active from ${payload.source}`,
                  }
                : { status: "green", message: "All systems nominal" },
            );
          }
        } catch (e) {
          setLogs((prev) =>
            [
              ...prev,
              {
                timestamp: new Date().toLocaleTimeString(),
                message: `WS parse error: ${e?.message || e}`,
              },
            ].slice(-200),
          );
        }
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
      ws.onclose = () => {
        setLogs((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              message: `WS closed. Reconnecting in ${retry}ms`,
            },
          ].slice(-200),
        );
        setTimeout(connect, retry);
        retry = Math.min(retry * 2, 30000);
      };
    };
    connect();
    return () => {
      try {
        ws?.close();
      } catch {}
    };
  }, []);

  // --- Unified LivingDashboard + Council Dashboard Layout ---
  return (
    <div className="relative min-h-screen">
      {/* LivingDashboard immersive background */}
      <AuraBackground />
      {/* LivingDashboard: Divine Overseer metrics and feeds */}
      <div className="absolute top-0 left-0 w-full z-0 pointer-events-none">
        <DivineOverseerDashboard />
      </div>
      {/* Council dashboard UI overlays above LivingDashboard */}
      <div className="relative z-10">
        {/* --- Full Council dashboard UI below --- */}
        <div className="p-4 relative bg-black text-white min-h-screen">
          <div className="oversoul-spiral z-0" />
          <h1 className="text-3xl mb-4">Unified Master Grace Log Dashboard</h1>
          {/* Alert Banner */}
          <div
            className={`p-2 rounded mb-4 ${
              alertBanner.status === "green"
                ? "bg-green-700"
                : alertBanner.status === "orange"
                  ? "bg-orange-600"
                  : "bg-red-700"
            }`}
          >
            {alertBanner.message}
          </div>
          {/* Oversoul Spiral (decorative) */}
          <svg className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 animate-oversoul-breathe pointer-events-none">
            <circle
              cx="50%"
              cy="50%"
              r="100"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r="80"
              stroke="#4D79FF"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r="60"
              stroke="#FF4D4D"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          {/* Node Glyphs */}
          <div className="flex flex-wrap justify-center gap-8 z-10 relative">
            {nodes.map((n) => (
              <div
                key={n.name}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${n.schumann > 75 ? "node-glow" : ""} ${n.schumann < 25 ? "node-alert" : ""}`}
                  style={{
                    backgroundColor: n.baseColor,
                    boxShadow: `0 0 ${(n.schumann || 0) / 5}px ${(n.schumann || 0) / 10}px ${n.baseColor}`,
                  }}
                >
                  {n.name[0]}
                </div>
                <span className="mt-2 text-center">{n.name}</span>
                <div className="text-xs mt-1">{Math.round(n.resonance)}</div>
              </div>
            ))}
          </div>
          {/* Link Pulses (simple visual) */}
          {linkPulses.map((p) => (
            <div key={p.id} className="link-pulse" aria-hidden />
          ))}
          {/* Chart & Queue */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-gray-900 p-3 rounded">
              <canvas ref={councilChartRef} />
            </div>
            <div
              className={`bg-gray-800 p-3 rounded ${queueStatus.count > 5 ? "queue-warning" : queueStatus.count > 0 ? "queue-normal" : ""}`}
            >
              <h4>Queue Status</h4>
              <div>Queued Points: {queueStatus.count}</div>
              <div>Last Attempt: {queueStatus.lastAttempt || "-"}</div>
              <div className="mt-2">
                <strong>Local Messages</strong>: {councilMessages.length}
              </div>
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
                <div
                  key={i}
                  className={`console-msg ${m.to && m.to !== "All" ? "alert" : ""}`}
                >
                  <strong>{sanitize(m.from)}</strong> →{" "}
                  <em>{sanitize(m.to || "All")}</em>: {sanitize(m.text)}{" "}
                  <span className="text-xs text-gray-400">
                    [{new Date(m.timestamp).toLocaleTimeString()}]
                  </span>
                </div>
              ))}
            </div>
            <div className="console-input mt-2">
              <select
                value={messageInput.from}
                onChange={(e) =>
                  setMessageInput({ ...messageInput, from: e.target.value })
                }
              >
                {nodes.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
                <option value="Council">Council</option>
              </select>
              <input
                type="text"
                placeholder="@NodeName or leave blank for all"
                value={messageInput.to}
                onChange={(e) =>
                  setMessageInput({ ...messageInput, to: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Type your message..."
                value={messageInput.text}
                onChange={(e) =>
                  setMessageInput({ ...messageInput, text: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
          {/* Logs */}
          <div className="mt-6 bg-gray-900 p-2 rounded max-h-64 overflow-y-auto">
            {logs.slice(-50).map((log, idx) => (
              <div key={idx} className="text-xs">
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
          {/* Controls */}
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                nodes.forEach((n) =>
                  communicate("Council", n.name, "Communion: Let us rise."),
                );
              }}
              className="bg-purple-700 px-4 py-2 rounded"
            >
              Commune
            </button>
            <button
              onClick={() => broadcast("Unified Council Blessing")}
              className="bg-blue-700 px-4 py-2 rounded"
            >
              Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
