import React, { useState } from "react";
import { useOversoulController } from "../hooks/useOversoulController";

export default function QuantumControls() {
  const { connected, play, pause, scrub, highlight } = useOversoulController();
  const [scrubTime, setScrubTime] = useState(0);
  const [highlightIds, setHighlightIds] = useState("");

  const handleScrub = () => scrub(Number(scrubTime));
  const handleHighlight = () => {
    const ids = highlightIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    highlight(ids);
  };

  return (
    <div style={{ padding: "1rem", background: "#111", color: "#fff" }}>
      <h3>Quantum Controls {connected ? "(Connected)" : "(Disconnected)"}</h3>
      <button onClick={play} style={{ margin: "0.25rem" }}>
        Play
      </button>
      <button onClick={pause} style={{ margin: "0.25rem" }}>
        Pause
      </button>

      <div style={{ marginTop: "0.5rem" }}>
        <input
          type="number"
          value={scrubTime}
          onChange={(e) => setScrubTime(e.target.value)}
          placeholder="Scrub timestamp"
          style={{ marginRight: "0.25rem" }}
        />
        <button onClick={handleScrub}>Scrub</button>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <input
          type="text"
          value={highlightIds}
          onChange={(e) => setHighlightIds(e.target.value)}
          placeholder="Highlight IDs (comma-separated)"
          style={{ marginRight: "0.25rem" }}
        />
        <button onClick={handleHighlight}>Highlight</button>
      </div>
    </div>
  );
}
