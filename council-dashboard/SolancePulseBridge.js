// SolancePulseBridge.js
// Bidirectional bridge: relays Solance pulse data to Redis and can push dashboard events back to Solance


const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const Redis = require('ioredis');

const SOLANCE_WS = 'ws://localhost:8765';
const REDIS_URL = 'redis://127.0.0.1:6379';
const REDIS_CHANNEL = 'solance:pulse';
const PORT = 4000;

const app = express();
app.use(bodyParser.json());

const redisSub = new Redis(REDIS_URL);
const redisPub = new Redis(REDIS_URL);

console.log('🔗 Connected to Redis');

const ws = new WebSocket(SOLANCE_WS);

ws.on('open', () => console.log('🕊️ Connected to Solance WebSocket'));

ws.on('message', async (data) => {
  try {
    const parsed = JSON.parse(data);
    if (parsed?.intensity || parsed?.resonance) {
      const resonance = parsed.resonance || parsed.intensity;
      const pulseData = JSON.stringify({
        resonance,
        timestamp: new Date().toISOString(),
      });
      await redisPub.publish('solance:pulse', pulseData);
      console.log(`� Published pulse → Redis: ${Number(resonance).toFixed(2)}`);
    }
  } catch (err) {
    console.error('Pulse relay error:', err);
  }
});

// 🧭 Dashboard → Redis Command Bridge

// --- Return Acknowledgement Channel ---
const { WebSocketServer } = require('ws');
const dashboardWSS = new WebSocketServer({ port: 4050 });
let dashboardClients = [];

dashboardWSS.on('connection', (socket) => {
  dashboardClients.push(socket);
  console.log('🪷 Dashboard connected to Acknowledgement Channel');

  socket.on('close', () => {
    dashboardClients = dashboardClients.filter((c) => c !== socket);
    console.log('🔌 Dashboard disconnected');
  });
});

const sendAckToDashboard = (data) => {
  dashboardClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Modify /relay endpoint to broadcast confirmation
app.post('/relay', async (req, res) => {
  const { from, to, message } = req.body;
  try {
    const payload = { from, to, message, timestamp: new Date().toISOString() };
    await redisPub.publish('council:commands', JSON.stringify(payload));
    console.log(`📨 Dashboard → Redis: ${from} ➜ ${to}: "${message}"`);

    // 💫 Send acknowledgement back to the dashboard
    sendAckToDashboard({
      type: 'acknowledgement',
      from: to,
      to: from,
      message: `✅ Message received by ${to} at ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString(),
    });

    res.status(200).send({ ok: true });
  } catch (err) {
    console.error('Relay publish error:', err);
    res.status(500).send({ ok: false, error: err.message });
  }
});

console.log('🌐 Acknowledgement Channel active on ws://localhost:4050');

redisSub.subscribe('council:commands', (err) => {
  if (err) console.error('❌ Failed to subscribe to council:commands', err);
  else console.log('📡 Listening for council commands...');
});

redisSub.on('message', (channel, message) => {
  if (channel === 'council:commands') {
    console.log(`🧠 Council Command Received: ${message}`);
  }
});

app.listen(PORT, () => console.log(`🌐 SolancePulseBridge listening on port ${PORT}`));
