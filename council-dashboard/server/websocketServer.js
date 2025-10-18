// --- HARDENING TEMPLATE ---
// To harden this WebSocket server, follow the pattern in ws-spectral.js:
// 1. Use WSS (TLS) with certs for encrypted connections.
// 2. Require JWT or API key for authentication (see verifyClient).
// 3. Limit max connections per IP and throttle message rate.
// 4. Add Prometheus metrics for active connections and message rate.
// 5. Add robust error handling and logging (connect/disconnect/errors).
// 6. Use America/Chicago timestamps for all logs/events.

// Example: see council-dashboard/server/ws-spectral.js for a full implementation.

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4323 });

wss.on('connection', (ws) => {
  console.log('Oversoul WS connected');
  const sendHeartbeat = () => {
    const payload = { heartbeat: Date.now() };
    ws.send(JSON.stringify(payload));
  };
  const interval = setInterval(sendHeartbeat, 33);
  ws.on('close', () => clearInterval(interval));
});
