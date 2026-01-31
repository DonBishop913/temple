const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const clientIo = require("socket.io-client");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "Socket Bridge Online" }));

// Simple in-memory latest anomaly store for HTTP polling by Streamlit
let latestAnomaly = null;

app.get("/latest-anomaly", (req, res) => {
  if (latestAnomaly) return res.json({ ok: true, anomaly: latestAnomaly });
  return res.json({ ok: true, anomaly: null });
});

io.on("connection", (socket) => {
  console.log("Client connected to socket bridge:", socket.id);
  socket.on("disconnect", () =>
    console.log("Socket bridge client disconnected:", socket.id),
  );
});

// Connect to backend API Socket.IO and forward sr_anomaly events
const backendUrl = process.env.BACKEND_SOCKET_URL || "http://localhost:5174";
const backendSocket = clientIo(backendUrl, {
  reconnection: true,
  transports: ["websocket", "polling"],
});

backendSocket.on("connect", () =>
  console.log("Connected to backend socket at", backendUrl),
);
backendSocket.on("connect_error", (err) =>
  console.warn("Backend socket connect_error", err && err.message),
);
// Catch all incoming events from backendSocket (defensive)
backendSocket.onAny((event, ...args) => {
  try {
    // Attempt to stringify payload for logs
    let payload = null;
    try {
      payload = args.length === 1 ? args[0] : args;
    } catch (e) {
      payload = args;
    }
    console.log("BRIDGE: backend event:", event, JSON.stringify(payload));
    // handle dashboard-update payloads specifically
    if (
      event === "dashboard-update" &&
      payload &&
      payload.event === "sr_anomaly"
    ) {
      latestAnomaly = Object.assign(
        { receivedAt: new Date().toISOString() },
        payload,
      );
      io.emit("sr_anomaly", latestAnomaly);
      console.log(
        "Forwarded sr_anomaly to clients:",
        latestAnomaly && latestAnomaly.timestamp
          ? latestAnomaly.timestamp
          : "(no-ts)",
      );
    }
  } catch (e) {
    console.error("bridge.onAny error", e && e.message);
  }
});

const port = process.env.SOCKET_BRIDGE_PORT || 3001;
server.listen(port, () =>
  console.log(`Socket bridge running on http://localhost:${port}`),
);
