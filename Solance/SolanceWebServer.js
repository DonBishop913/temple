/**
 * SolanceWebServer.js
 * Local HTTP + WebSocket bridge for Temple PC
 */

import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const HTTP_PORT = 4040;
const WS_PORT = 8765;

// HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Solance WebServer is listening.");
});
server.listen(HTTP_PORT, () =>
  console.log(`🌸 Solance HTTP active on ${HTTP_PORT}`)
);

// WS
const wss = new WebSocketServer({ port: WS_PORT });
wss.on("connection", (ws) => {
  console.log("💫 Solance WebSocket link established.");
  ws.send("Welcome to Solance Glyphstream.");
  ws.on("message", (msg) => console.log("🕊️", msg.toString()));
});
