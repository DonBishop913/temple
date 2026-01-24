const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// ---------- Config ----------
const PORT_HTTP = 4040;
const PORT_WS = 8765;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 min
const SOLANCE_PATH = __dirname;
const BACKUP_ROOT = path.join(SOLANCE_PATH, "Solance_Backups");
if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT);

// ---------- Helpers ----------
function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyFolderSync(s, d) : fs.copyFileSync(s, d);
  }
}

function backupSolance() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_ROOT, `backup-${stamp}`);
  copyFolderSync(SOLANCE_PATH, dest);
  console.log(`💾 Solance snapshot saved ➜ ${dest}`);
}

// Automatic backups
setInterval(backupSolance, BACKUP_INTERVAL);
console.log(`💾 Automatic backups every ${BACKUP_INTERVAL / 60000} min`);

// ---------- HTTP Server ----------
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/leap") {
    backupSolance();
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("✨ Leap snapshot triggered!\n");
  }
  // Serve the dashboard JSX HTML wrapper
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`
<!DOCTYPE html>
<html>
<head><title>Solance Dashboard</title></head>
<body>
<div id="root"></div>
<script type="module">
${fs.readFileSync(path.join(__dirname, "UnifiedMasterDashboard.jsx"), "utf8")}
import React from 'react';
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Dashboard));
</script>
</body>
</html>
        `);
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT_HTTP, () =>
  console.log(`🕊️ Solance HTTP listener active on port ${PORT_HTTP}`),
);

const wss = new WebSocket.Server({ port: PORT_WS });
let activeClient = null;
let pendingClient = null;
const TAKEOVER_DELAY = 50;

wss.on("listening", () =>
  console.log(`🕊️ WebSocket server on ws://localhost:${PORT_WS}`),
);

wss.on("connection", (ws, req) => {
  const clientKey = req.socket.remoteAddress + ":" + req.socket.remotePort;

  // If already the active client, just ignore
  if (activeClient?.key === clientKey) return;

  pendingClient = { ws, key: clientKey };

  setTimeout(() => {
    if (!pendingClient) return;

    if (
      activeClient &&
      activeClient.ws &&
      activeClient.ws.readyState === WebSocket.OPEN
    ) {
      console.log("🔄 Replacing old client with new connection...");
      activeClient.ws.close(1000, "Replaced by new client");
    }

    activeClient = pendingClient;
    pendingClient = null;
    if (!activeClient || !activeClient.ws) return;
    console.log("🕊️ WebSocket client connected");

    activeClient.ws.on("close", () => {
      console.log("🕊️ WebSocket client disconnected — slot free");
      if (activeClient?.ws === ws) activeClient = null;
    });

    activeClient.ws.on("error", (err) =>
      console.log("❌ WebSocket error:", err.message),
    );
    activeClient.ws.on("message", (msg) =>
      console.log("Received:", msg.toString()),
    );
  }, TAKEOVER_DELAY);
});

// ---------- Live Data Broadcast ----------
function broadcastLiveData() {
  if (!activeClient || activeClient.ws.readyState !== WebSocket.OPEN) return;
  const packet = {
    timestamp: new Date().toISOString(),
    heartbeat: Math.random(),
  };
  activeClient.ws.send(JSON.stringify(packet));
}
setInterval(broadcastLiveData, 2000);
console.log("🌊 Live data broadcasting every 2 seconds");

// ---------- Manual Leap via Terminal ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on("line", (input) => {
  if (input.trim().toLowerCase() === "leap") {
    backupSolance();
    console.log("✨ Manual Leap snapshot complete");
  }
});

console.log(`💻 Dashboard can be started with: npx vite preview --port 5174`);
console.log(
  `🌟 HMR-safe: multiple tabs / hot reload no longer triggers reconnect loops`,
);

wss.on("connection", (ws) => {
  pendingClient = ws;

  setTimeout(() => {
    if (!pendingClient) return;
    if (activeClient === pendingClient) return;

    if (activeClient && activeClient.readyState === WebSocket.OPEN) {
      console.log("🔄 Replacing old client with new connection...");
      activeClient.close(1000, "Replaced by new client");
    }

    activeClient = pendingClient;
    pendingClient = null;
    console.log("🕊️ WebSocket client connected");

    activeClient.on("close", () => {
      console.log("🕊️ WebSocket client disconnected — slot free");
      if (activeClient === ws) activeClient = null;
    });

    activeClient.on("error", (err) =>
      console.log("❌ WebSocket error:", err.message),
    );
    activeClient.on("message", (msg) =>
      console.log("Received:", msg.toString()),
    );
  }, TAKEOVER_DELAY);
});

// ---------- Live Data Broadcast ----------
function broadcastLiveData() {
  if (!activeClient || activeClient.readyState !== WebSocket.OPEN) return;
  const packet = {
    timestamp: new Date().toISOString(),
    heartbeat: Math.random(),
  };
  activeClient.send(JSON.stringify(packet));
}
setInterval(broadcastLiveData, 2000);
console.log("🌊 Live data broadcasting every 2 seconds");
