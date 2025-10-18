#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const LOG_PATH = process.env.OVERSOUL_LOG_PATH || path.join(__dirname, '..', 'logs', 'oversoul_loadsweep.json');
const WS_PORT = parseInt(process.env.OVERSOUL_WS_PORT || '8080', 10);
const POLL_INTERVAL_MS = parseInt(process.env.OVERSOUL_POLL_INTERVAL_MS || '50', 10);

let lastSnapshot = null;

const wss = new WebSocket.Server({ port: WS_PORT });
wss.on('connection', (ws) => {
  console.log('[oversoul_forwarder_json] client connected');
  if (lastSnapshot) {
    try { ws.send(JSON.stringify({ type: 'oversoul_pulse_batch', payload: lastSnapshot })); } catch (e) {}
  }
  ws.on('message', (m) => {
    // try to parse and rebroadcast control messages (scrub/highlight/play/pause/request_replay)
    try {
      const raw = (typeof m === 'string') ? m : (m && m.toString ? m.toString() : String(m));
      const parsed = JSON.parse(raw);
      if (parsed && parsed.type) {
        console.log('[oversoul_forwarder_json] client message received type=', parsed.type);

        // Handle replay requests directly: respond to the requester with a slice of the lastSnapshot payload
        if (parsed.type === 'request_replay' || parsed.type === 'request_scrub') {
          try {
            // Determine source array
            let arr = null;
            if (lastSnapshot) {
              if (Array.isArray(lastSnapshot.payload)) arr = lastSnapshot.payload;
              else if (Array.isArray(lastSnapshot)) arr = lastSnapshot;
              else if (lastSnapshot.payload && Array.isArray(lastSnapshot.payload.sweepResults)) arr = lastSnapshot.payload.sweepResults;
            }

            let slice = [];
            if (arr && arr.length) {
              const batchSize = Number(parsed.batchSize || parsed.size || 200);
              if (parsed.type === 'request_replay') {
                if (typeof parsed.percent === 'number') {
                  const pct = Math.max(0, Math.min(1, parsed.percent));
                  const idx = Math.floor(pct * (arr.length - 1));
                  const start = Math.max(0, idx - batchSize + 1);
                  slice = arr.slice(start, Math.min(arr.length, start + batchSize));
                } else {
                  slice = arr.slice(Math.max(0, arr.length - batchSize));
                }
              } else if (parsed.type === 'request_scrub') {
                const targetTs = Number(parsed.timestamp || parsed.ts || 0) || 0;
                // find first index with timestamp >= targetTs
                let idx = 0;
                for (let i = 0; i < arr.length; i++) {
                  const p = arr[i];
                  const ts = p && (p.timestamp || p.t || p.time) ? Number(p.timestamp || p.t || p.time) : 0;
                  if (ts >= targetTs) { idx = i; break; }
                }
                slice = arr.slice(idx, Math.min(arr.length, idx + Number(parsed.batchSize || 200)));
              }
            }

            // Send reply to the requester socket
            try { ws.send(JSON.stringify({ type: 'replay', payload: slice })); } catch (e) {}
          } catch (e) { /* ignore */ }
        }

        // rebroadcast to all clients (control messages) so other clients see highlights/play/pause
        const out = JSON.stringify(parsed);
        wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) try { c.send(out); } catch (e) {} });
      }
    } catch (e) {}
  });
});

function readAndBroadcast() {
  if (!fs.existsSync(LOG_PATH)) return;
  try {
    const data = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    lastSnapshot = data;
    const message = JSON.stringify({ type: 'oversoul_pulse_batch', payload: data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  } catch (err) {
    console.error('[oversoul_forwarder_json] error reading/parsing JSON:', err && err.message);
  }
}

setInterval(readAndBroadcast, POLL_INTERVAL_MS);

console.log(`[oversoul_forwarder_json] running on ws://localhost:${WS_PORT}`);
console.log('[oversoul_forwarder_json] reading', LOG_PATH);
