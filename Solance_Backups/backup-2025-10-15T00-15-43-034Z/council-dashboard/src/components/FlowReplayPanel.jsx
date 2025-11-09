import React, { useEffect, useState, useRef } from "react";

export default function FlowReplayPanel() {
  const [events, setEvents] = useState([]);
  const [playing, setPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to the Replay WebSocket port started by the server (default 4323)
    const url = process.env.REACT_APP_REPLAY_WS || "ws://localhost:4323";
    const endpoint = `${url.replace(/\/$/, "")}/`; // normalize
    try {
      ws.current = new WebSocket(
        process.env.REACT_APP_REPLAY_WS || "ws://localhost:4323",
      );
    } catch (e) {
      console.warn("FlowReplayPanel: websocket init failed", e && e.message);
      return;
    }

    ws.current.onopen = () =>
      console.log("FlowReplayPanel: connected to replay WS");
    ws.current.onclose = () => console.log("FlowReplayPanel: replay WS closed");
    ws.current.onerror = (err) =>
      console.warn("FlowReplayPanel: ws error", err);

    ws.current.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // Handle envelope { type: 'replay:event', entry } or raw event payload
        if (data && data.type === "replay:event" && data.entry) {
          setEvents((prev) => [...prev, data.entry]);
        } else if (data && data.type === "replay:hello") {
          // ignore handshake
        } else if (data && data.entry && data.entry.timestamp) {
          // sometimes driver may send { entry }
          setEvents((prev) => [...prev, data.entry]);
        } else {
          // assume the message is an event object
          setEvents((prev) => [...prev, data]);
        }
      } catch (e) {
        console.warn("FlowReplayPanel: failed to parse ws message", e);
      }
    };

    return () => {
      try {
        ws.current && ws.current.close();
      } catch {}
    };
  }, []);

  // Replay loop advances currentIndex while playing
  useEffect(() => {
    if (!playing || events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((idx) => (idx + 1 < events.length ? idx + 1 : idx));
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, events]);

  const handlePlayPause = () => setPlaying((p) => !p);

  const handleSeek = (index) => {
    setCurrentIndex(index);
    try {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const evt = events[index] || {};
        // send seek by id or timestamp when available
        const payload = { action: "seek" };
        if (evt.id) payload.id = evt.id;
        if (evt.timestamp) payload.timestamp = evt.timestamp;
        ws.current.send(JSON.stringify(payload));
      }
    } catch (e) {
      console.warn("seek send failed", e && e.message);
    }
  };

  const handleAddAnnotation = () => {
    const note = window.prompt("Enter annotation for this moment:");
    if (!note) return;
    setAnnotations((prev) => [
      ...prev,
      { index: currentIndex, note, at: new Date().toISOString() },
    ]);
  };

  const currentEvent = events[currentIndex] || null;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Helvetica, Arial, sans-serif",
        background: "#E0F7FA",
        borderRadius: 8,
      }}
    >
      <h3 style={{ marginTop: 0 }}>🌟 Flow Replay Panel</h3>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <button onClick={handlePlayPause}>
          {playing ? "⏸ Pause" : "▶️ Play"}
        </button>
        <button onClick={handleAddAnnotation}>📝 Add Annotation</button>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#333" }}>
          {events.length} events
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={currentIndex}
          onChange={(e) => handleSeek(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <div style={{ width: 160, fontSize: 12 }}>
          {currentEvent &&
          (currentEvent.timestamp || currentEvent.at || currentEvent.ts)
            ? new Date(
                currentEvent.timestamp || currentEvent.at || currentEvent.ts,
              ).toLocaleString()
            : "--:--"}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          background: "#fff",
          padding: 12,
          borderRadius: 6,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        <pre style={{ margin: 0, fontSize: 12 }}>
          {currentEvent
            ? JSON.stringify(currentEvent, null, 2)
            : "No event selected"}
        </pre>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: "8px 0" }}>Annotations</h4>
        <ul>
          {annotations.map((a, i) => (
            <li key={i}>
              [{a.index}] {a.note}{" "}
              <span style={{ color: "#666", marginLeft: 8 }}>
                {new Date(a.at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
