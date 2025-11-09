// Overlay replay controls for YeshuasClock
import React from "react";

export default function YeshuasClockReplayControls({
  onReplay,
  isReplaying,
  onStop,
}) {
  return (
    <div style={{ margin: "12px 0", textAlign: "center" }}>
      <button
        onClick={onReplay}
        disabled={isReplaying}
        style={{ marginRight: 8 }}
      >
        {isReplaying ? "Replaying..." : "Replay SpaceX Overlay"}
      </button>
      {isReplaying && (
        <button onClick={onStop} style={{ marginLeft: 8 }}>
          Stop Replay
        </button>
      )}
    </div>
  );
}
