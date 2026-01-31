import React, { useState, useEffect, useRef } from "react";

// --- Solance Integration ---
const WS_URL = "ws://localhost:8765";
const PRELOAD_URL = "http://localhost:4040/api/solance/preload";

// --- Initial AI Nodes ---
const initialNodes = [
  {
    name: "Grok",
    resonance: 240,
    baseColor: "#FF4D4D",
    messages: [],
    alert: false,
    role: "Observer",
    x: 0,
    y: 0,
  },
  {
    name: "Solance",
    resonance: 180,
    baseColor: "#4D79FF",
    messages: [],
    alert: false,
    role: "Observer",
    x: 0,
    y: 0,
  },
  {
    name: "Agnes",
    resonance: 200,
    baseColor: "#9B59B6",
    messages: [],
    alert: false,
    role: "Observer",
    x: 0,
    y: 0,
  },
  {
    name: "Duck.ai",
    resonance: 190,
    baseColor: "#2ECC71",
    messages: [],
    alert: false,
    role: "Observer",
    x: 0,
    y: 0,
  },
];

const UnifiedEnhancedGraceLogDashboard = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [linkPulses, setLinkPulses] = useState([]);
  const logRef = useRef([]);
  const [log, setLog] = useState([]);

  // --- Live Solance Pulse Integration ---
  useEffect(() => {
    // Fetch initial pulse batch
    fetch(PRELOAD_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.pulseBatch)) {
          setNodes((prev) =>
            prev.map((n, i) => ({
              ...n,
              resonance: data.pulseBatch[i]?.intensity
                ? Math.round(data.pulseBatch[i].intensity * 300)
                : n.resonance,
            })),
          );
        }
      })
      .catch(() => {});

    // Subscribe to live WebSocket pulses
    const ws = new window.WebSocket(WS_URL);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (typeof data.intensity === "number") {
          setNodes((prev) =>
            prev.map((n, i) =>
              i === 1
                ? { ...n, resonance: Math.round(data.intensity * 300) }
                : n,
            ),
          ); // Update Solance node
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  // --- Acknowledgement Channel Listener ---
  useEffect(() => {
    const ws = new window.WebSocket("ws://localhost:4050");

    ws.onopen = () => {
      logAction("🪷 Connected to Acknowledgement Channel");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "acknowledgement") {
          const { from, to, message } = data;
          setNodes((prev) =>
            prev.map((n) =>
              n.name === to
                ? { ...n, messages: [...n.messages, message], alert: true }
                : n,
            ),
          );
          logAction(message);
        }
      } catch (err) {
        logAction(`Ack parse error: ${err.message}`);
      }
    };

    ws.onclose = () => logAction("🔌 Acknowledgement Channel disconnected");

    return () => ws.close();
  }, []);

  // --- Action Logger ---
  const logAction = (msg) => {
    logRef.current = [
      ...logRef.current,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ];
    setLog([...logRef.current]);
  };

  // --- Node Communication ---
  const communicate = async (from, to, message) => {
    const fromNode = nodes.find((n) => n.name === from);
    const toNode = nodes.find((n) => n.name === to);

    if (fromNode && toNode) {
      setNodes((prev) =>
        prev.map((node) =>
          node.name === to
            ? {
                ...node,
                messages: [...node.messages, `${from}: ${message}`],
                alert: true,
              }
            : node,
        ),
      );

      const pulseId = Date.now();
      setLinkPulses((prev) => [...prev, { from, to, id: pulseId }]);
      logAction(`Message from ${from} to ${to}: "${message}"`);

      // 🔄 Send this action to the PulseBridge via REST API
      try {
        await fetch("http://localhost:4000/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, message }),
        });
      } catch (err) {
        logAction(`Relay error: ${err.message}`);
      }

      setTimeout(() => {
        setNodes((prev) =>
          prev.map((node) =>
            node.name === to ? { ...node, alert: false } : node,
          ),
        );
        setLinkPulses((prev) => prev.filter((pulse) => pulse.id !== pulseId));
      }, 1000);
    } else {
      logAction(`Error: Node not found (${from} or ${to})`);
    }
  };

  return (
    <div>{/* Render your dashboard components using the nodes state */}</div>
  );
};

export default UnifiedEnhancedGraceLogDashboard;
