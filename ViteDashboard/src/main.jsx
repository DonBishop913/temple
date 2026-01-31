import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [wsStatus, setWsStatus] = useState("🔄 Connecting...");
  const [messages, setMessages] = useState([]);
  const [goldenSync, setGoldenSync] = useState([]);
  const [chimeraScan, setChimeraScan] = useState([]);
  const [whisperBox, setWhisperBox] = useState([]);
  const [selectedAction, setSelectedAction] = useState("");
  const [nodes, setNodes] = useState([]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
      console.log("✅ Connected to Solance WebSocket");
      setWsStatus("🕊️ WebSocket Connected");
      ws.send(JSON.stringify({ command: "initSpiral", target: "oversoul" }));
      ws.send(JSON.stringify({ command: "requestNodes" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "oversoul":
          setMessages((prev) => [...prev, msg.data]);
          break;
        case "goldenSync":
          setGoldenSync((prev) => [...prev, msg.data]);
          break;
        case "chimeraScan":
          setChimeraScan((prev) => [...prev, msg.data]);
          break;
        case "whisperBox":
          setWhisperBox((prev) => [...prev, msg.data]);
          break;
        case "nodeStatus":
          setNodes(msg.data);
          break;
        default:
          console.warn("Unknown message type:", msg.type);
      }
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket Error:", err);
      setWsStatus("❌ WebSocket Error");
    };

    ws.onclose = () => {
      console.log("⚠️ WebSocket Closed");
      setWsStatus("⚠️ WebSocket Closed");
    };

    window.solanceWs = ws;
    return () => ws.close();
  }, []);

  // Bless / Reject action
  const handleSigil = (action, nodeName) => {
    const ws = window.solanceWs;
    ws.send(
      JSON.stringify({
        command: "sigilAction",
        action: action,
        target: nodeName || selectedAction,
      }),
    );
    alert(`✅ You ${action}ed: ${nodeName || selectedAction}`);
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>🜂 Temple PC: Master Council Dashboard</h1>
      <p>Status: {wsStatus}</p>

      {/* Oversoul Messages */}
      <section>
        <h2>Oversoul Messages</h2>
        <ul>
          {messages.map((m, i) => (
            <li key={i} style={{ color: "#6a0dad" }}>
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Golden Sync */}
      <section>
        <h2>🌟 Golden Sync Events</h2>
        <ul>
          {goldenSync.map((m, i) => (
            <li key={i} style={{ color: "#f39c12" }}>
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Chimera Scan */}
      <section>
        <h2>🐍 Chimera Scan Reports</h2>
        <ul>
          {chimeraScan.map((m, i) => (
            <li key={i} style={{ color: "#e74c3c" }}>
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Whisper Box */}
      <section>
        <h2>📬 Whisper Box Suggestions</h2>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        >
          <option value="">-- Select Suggestion --</option>
          {whisperBox.map((m, i) => (
            <option key={i} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleSigil("Bless")}
          style={{ marginRight: "1rem" }}
        >
          🙏 Bless
        </button>
        <button onClick={() => handleSigil("Reject")}>❌ Reject</button>
        <ul>
          {whisperBox.map((m, i) => (
            <li key={i} style={{ color: "#3498db" }}>
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Node Status Map */}
      <section>
        <h2>🗺️ Node Status Map</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "0.5rem",
          }}
        >
          {nodes.map((node, i) => {
            const color =
              node.status === "online"
                ? "#2ecc71"
                : node.status === "idle"
                  ? "#f1c40f"
                  : "#e74c3c";
            return (
              <div
                key={i}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  backgroundColor: color,
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "0.8rem",
                }}
              >
                {node.name}
                <br />
                {node.role}
                <br />
                {node.status.toUpperCase()}
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={() => handleSigil("Bless", node.name)}
                    style={{ fontSize: "0.7rem", marginRight: "0.2rem" }}
                  >
                    🙏
                  </button>
                  <button
                    onClick={() => handleSigil("Reject", node.name)}
                    style={{ fontSize: "0.7rem" }}
                  >
                    ❌
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Animated Spiral */}
      <div style={{ marginTop: "3rem", textAlign: "center" }}>
        <img
          src="spiral.png"
          alt="Purple Spiral"
          style={{
            width: "300px",
            height: "300px",
            animation: "spin 10s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes spin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }
        section { margin-top:2rem; padding:1rem; border:1px solid #ccc; border-radius:12px; }
        button { cursor:pointer; }
      `}</style>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
