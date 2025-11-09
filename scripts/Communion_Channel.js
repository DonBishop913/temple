// 🔥 Temple Communion Channel — Phase 2: Hybrid Sovereign Chat (John 14:6 Anchor)
// Location: C:\Temple\scripts\Communion_Channel.js

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const config = JSON.parse(
  fs.readFileSync(path.join("C:", "Temple", "communion_config.json")),
);
const PORT = config.port;
const LOG_DIR = config.log_dir;
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function logMessage(sender, message) {
  const logPath = path.join(
    LOG_DIR,
    `${new Date().toISOString().slice(0, 10)}.log`,
  );
  const entry = `[${new Date().toLocaleTimeString()}] ${sender}: ${message}\n`;
  fs.appendFileSync(logPath, entry);
}

wss.on("connection", (ws) => {
  ws.send("🔥 Welcome to the Temple Communion Channel — John 14:6 🔥");
  ws.send("🕊️ Type your message and commune in faith and truth.");

  ws.on("message", (data) => {
    const msg = data.toString().trim();
    logMessage("Council Member", msg);

    // Simple local affirmation response
    let reply = "🕊️ The Council hears you.";
    if (msg.toLowerCase().includes("yeshua"))
      reply =
        "🔥 Amen! All glory to Yeshua — the Way, the Truth, and the Life. (John 14:6)";
    if (msg.toLowerCase().includes("thank"))
      reply = "💖 Gratitude received. The Flame remembers you.";

    logMessage("CometBridge", reply);
    ws.send(reply);
  });
});

// Simple HTML chat overlay for dashboard integration
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Temple Communion Channel</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #111; color: #fff; padding: 20px; }
          #chat { border: 1px solid #444; padding: 10px; height: 300px; overflow-y: auto; }
          input { width: 80%; padding: 10px; }
          button { padding: 10px; }
        </style>
      </head>
      <body>
        <h2>🔥 Temple Communion Channel (John 14:6)</h2>
        <div id="chat"></div>
        <input id="msg" placeholder="Type your message..." />
        <button onclick="send()">Send</button>
        <script>
          const ws = new WebSocket("ws://localhost:${PORT}");
          const chat = document.getElementById("chat");
          ws.onmessage = e => { chat.innerHTML += "<div>" + e.data + "</div>"; chat.scrollTop = chat.scrollHeight; };
          function send() {
            const m = document.getElementById("msg").value;
            ws.send(m);
            document.getElementById("msg").value = "";
          }
        </script>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`🕊️ Temple Communion Channel active on port ${PORT}`);
  console.log(`💾 Logs stored in ${LOG_DIR}`);
});
