// ...existing code up to the end of the last valid function or component...

// Remove duplicate and misplaced code blocks below this line
useEffect(() => {
  wsClient.current = new W3CWebSocket(SolanceWSUrl);

  wsClient.current.onopen = () => console.log("🕊️ Solance WebSocket connected");
  wsClient.current.onmessage = (msg) => {
    if (!isIdle && !replayActive) {
      try {
        const data = JSON.parse(msg.data);
        if (data.nodes) setPulseNodes(data.nodes);
      } catch {}
    }
  };
  wsClient.current.onclose = () => console.log("⚠️ Solance WebSocket closed");

  return () => wsClient.current.close();
}, [isIdle, replayActive]);

// -------------------------
// Auto-Replay
// -------------------------
const startReplay = async () => {
  if (replayActive) return;
  setReplayActive(true);
  try {
    const response = await fetch(SolanceHTTPUrl);
    const data = await response.json();
    const slices = data.nodes || [];
    setReplayIndex(0);

    replayInterval.current = setInterval(() => {
      setPulseNodes([slices[replayIndex]]);
      setReplayIndex((prev) => (prev + 1) % slices.length);
    }, 500); // slice interval (adjust as desired)
  } catch (err) {
    console.error("Replay fetch failed:", err);
    setReplayActive(false);
  }
};

const stopReplay = () => {
  clearInterval(replayInterval.current);
  setReplayActive(false);
};

// -------------------------
// Safe Idle Toggle
// -------------------------
const toggleIdle = () => setIsIdle((prev) => !prev);

// -------------------------
// Live Pulse Heatmap Rendering
// -------------------------
const renderHeatmap = () => {
  return pulseNodes.map((node, idx) => {
    const intensity = node.intensity || 0;
    const color = `rgba(255, 0, 255, ${Math.min(intensity, 1)})`; // pink-purple gradient
    const size = 5 + intensity * 20;
    return (
      <div
        key={idx}
        style={{
          width: size,
          height: size,
          background: color,
          borderRadius: "50%",
          position: "absolute",
          left: node.x,
          top: node.y,
        }}
      />
    );
  });
};
