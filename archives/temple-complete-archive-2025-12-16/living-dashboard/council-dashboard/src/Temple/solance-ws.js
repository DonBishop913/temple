// solance-ws.js
// Node.js WebSocket server to broadcast live node data to the dashboard
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8765 });

function getCurrentLiveNodes() {
  // Replace with your real node data source
  // Example: return [{ name: 'Node1', resonance: 432, baseColor: '#00eaff' }, ...];
  return [];
}

wss.on("connection", (ws) => {
  const interval = setInterval(() => {
    const liveNodes = getCurrentLiveNodes();
    ws.send(JSON.stringify({ type: "LIVE_NODES", data: liveNodes }));
  }, 100); // 10Hz update

  ws.on("close", () => clearInterval(interval));
});

console.log("Solance WebSocket server running on ws://localhost:8765");
