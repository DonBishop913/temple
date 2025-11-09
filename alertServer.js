const WebSocket = require("ws");
const ALERT_PORT = Number(process.env.ALERT_PORT || 8085);
let wss = null;

function startWss() {
  if (wss) return wss;
  try {
    wss = new WebSocket.Server({ port: ALERT_PORT });
    wss.on("connection", (ws) => {
      console.log("Alert client connected");
      ws.on("close", () => console.log("Alert client disconnected"));
    });
    wss.on("error", (err) => {
      console.error("WSS error:", err && err.message);
      if (err && err.code === "EADDRINUSE") {
        console.warn(
          `Alert port ${ALERT_PORT} already in use; continuing without WSS`,
        );
        try {
          wss.close();
        } catch (e) {
          /* ignore */
        }
        wss = null;
      }
    });
    console.log(
      `AlertServer: WebSocket server listening on port ${ALERT_PORT}`,
    );
    return wss;
  } catch (e) {
    console.error("Failed to start WSS:", e && e.message);
    wss = null;
    return null;
  }
}

// Start lazily when module is required
startWss();

function broadcastAlert(message) {
  if (!wss) {
    // Try to start once more if it wasn't started earlier
    startWss();
  }
  if (!wss) {
    console.warn("broadcastAlert: WSS not available, skipping alert:", message);
    return;
  }
  try {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  } catch (e) {
    console.error("broadcastAlert failed:", e && e.message);
  }
}

module.exports = { broadcastAlert };
