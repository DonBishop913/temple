#!/usr/bin/env node
// High-throughput Redis -> WebSocket forwarder (batching)
const WebSocket = require('ws');
const Redis = require('ioredis');

const WS_PORT = Number(process.env.OVERSOUL_WS_PORT || 8080);
const CHANNEL = process.env.OVERSOUL_CHANNEL || 'oversoul_pulse';
const CHANNEL_BATCH = CHANNEL + '_batch';
const BATCH_INTERVAL = Number(process.env.OVERSOUL_BATCH_INTERVAL_MS || 16);
const MAX_BATCH = Number(process.env.OVERSOUL_MAX_BATCH || 500);

const wss = new WebSocket.Server({ port: WS_PORT });
const pulseQueue = [];
const REPLAY_BUFFER = [];
const REPLAY_LIMIT = Number(process.env.OVERSOUL_REPLAY_LIMIT || 5000);

// debug logging gate
const DEBUG = !!process.env.OVERSOUL_DEBUG;
function dlog(...args) { if (DEBUG) try { console.log(...args); } catch (e) {} }

console.log(`[oversoul_forwarder] WS listening on ws://0.0.0.0:${WS_PORT}, subscribing to Redis channel '${CHANNEL}'`);

const sub = new Redis(process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379');
sub.on('connect', () => console.log('[oversoul_forwarder] Redis subscriber connected'));
sub.on('error', (err) => console.error('[oversoul_forwarder] Redis error', err && err.message));

// subscribe to both single and batch channels where available
sub.subscribe(CHANNEL, CHANNEL_BATCH, (err, count) => {
  if (err) return console.error('[oversoul_forwarder] subscribe failed', err && err.message);
  console.log(`[oversoul_forwarder] subscribed to ${CHANNEL} (count=${count})`);
});

sub.on('message', (chan, message) => {
  try { dlog('[oversoul_forwarder] Redis message on', chan, 'len=', (message||'').length); } catch(e){}
  try {
    const parsed = JSON.parse(message);
    // Normalize incoming messages into individual pulse objects and push them to the pulseQueue.
    // Support three formats:
    // 1) Raw array: [pulse, pulse, ...]
    // 2) Wrapper: { type: 'oversoul_pulse_batch', payload: [pulse, ...] }
    // 3) Single pulse object
    function pushPulse(p) {
      if (!p || typeof p !== 'object') return;
      p.id = p.id || p.timestamp || Date.now();
      pulseQueue.push(p);
    }

    if (Array.isArray(parsed)) {
      try { dlog('[oversoul_forwarder] parsed array batch length=', parsed.length); } catch(e){}
      for (const p of parsed) pushPulse(p);
      return;
    }

    // If it's a wrapper with a payload array, unpack it
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.payload)) {
        try { dlog('[oversoul_forwarder] parsed wrapper payload length=', parsed.payload.length); } catch(e){}
        for (const p of parsed.payload) pushPulse(p);
        return;
      }

      // Some publishers may send { type: 'oversoul_pulse_batch', payload: [...] } or
      // single pulse objects with fields like 'x' or 'amplitude'. Treat those as single pulses.
      if ('x' in parsed || 'amplitude' in parsed || 'payload' in parsed || parsed.type === 'oversoul_pulse') {
        // If payload exists but isn't an array, ignore it for now and treat parsed as the pulse
        pushPulse(parsed);
        return;
      }
    }
  } catch (e) {
    // ignore malformed messages
  }
});

function broadcastBatch() {
  if (pulseQueue.length === 0) return;
  const batch = pulseQueue.splice(0, MAX_BATCH);
  try { dlog('[oversoul_forwarder] broadcasting batch size=', batch.length, 'pulseQueueRemaining=', pulseQueue.length); } catch(e){}
  REPLAY_BUFFER.push(...batch);
  if (REPLAY_BUFFER.length > REPLAY_LIMIT) REPLAY_BUFFER.splice(0, REPLAY_BUFFER.length - REPLAY_LIMIT);
  try { dlog('[oversoul_forwarder] REPLAY_BUFFER length=', REPLAY_BUFFER.length); } catch(e){}

  const data = JSON.stringify({ type: 'oversoul_pulse_batch', payload: batch });
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      try { c.send(data); } catch (e) { /* ignore per-client send errors */ }
    }
  });
}

setInterval(broadcastBatch, BATCH_INTERVAL);

wss.on('connection', (ws, req) => {
  console.log('[oversoul_forwarder] client connected', req.socket.remoteAddress);
  // send a welcome
  try { ws.send(JSON.stringify({ type: 'connected', serverTime: Date.now() })); } catch (e) {}

  ws.on('message', (m) => {
    try {
      // normalize message payload: ws may deliver string or Buffer
      let r = null;
      try {
        const raw = (typeof m === 'string') ? m : (m && m.toString ? m.toString() : String(m));
        r = JSON.parse(raw);
      } catch (e) {
        r = null;
      }
      try { console.log('[oversoul_forwarder] client message received type=', r && r.type); } catch(e){}
      if (r && r.type === 'request_replay') {
        try {
          // support optional percent-based scrub: r.percent in 0..1
          if ((typeof r.start === 'number' || typeof r.end === 'number') && REPLAY_BUFFER.length > 0) {
            // slice by provided indices (safeguard bounds)
            const s = Math.max(0, Math.floor(r.start || 0));
            const e = Math.min(REPLAY_BUFFER.length, Math.max(s + 1, Math.floor(r.end || (s + 1))));
            const slice = REPLAY_BUFFER.slice(s, e);
            try { ws.send(JSON.stringify({ type: 'replay', payload: slice })); } catch (e) {}
          } else if (typeof r.percent === 'number' && REPLAY_BUFFER.length > 0) {
            // compute time range
            const times = REPLAY_BUFFER.map(p => p.timestamp || p.t || p.time || 0).filter(Boolean);
            const minT = Math.min(...times);
            const maxT = Math.max(...times);
            const target = minT + Math.max(0, Math.min(1, r.percent)) * (maxT - minT);
            // return up to MAX items ending at target
            const maxItems = Number(process.env.OVERSOUL_REPLAY_CHUNK || 2000);
            // find index of last item <= target
            let idx = REPLAY_BUFFER.length - 1;
            for (let i = REPLAY_BUFFER.length - 1; i >= 0; i--) {
              const ts = REPLAY_BUFFER[i].timestamp || REPLAY_BUFFER[i].t || REPLAY_BUFFER[i].time || 0;
              if (ts <= target) { idx = i; break; }
            }
            const start = Math.max(0, idx - maxItems + 1);
            const slice = REPLAY_BUFFER.slice(start, idx + 1);
            try { ws.send(JSON.stringify({ type: 'replay', payload: slice })); } catch (e) {}
          } else {
            try { ws.send(JSON.stringify({ type: 'replay', payload: REPLAY_BUFFER })); } catch (e) {}
          }
        } catch (e) {}
      }
      // server-driven scrub by timestamp -> return pulses at or after provided timestamp
      if (r && r.type === 'request_scrub' && (typeof r.timestamp === 'number' || typeof r.timestamp === 'string')) {
        try { console.log('[oversoul_forwarder] request_scrub received ts=', r.timestamp); } catch(e){}
        try {
          const targetTs = Number(r.timestamp);
          if (REPLAY_BUFFER.length === 0) {
            try { ws.send(JSON.stringify({ type: 'replay_pulses', payload: [] })); } catch (e) {}
            try { dlog('[oversoul_forwarder] request_scrub -> REPLAY_BUFFER empty'); } catch(e){}
          } else {
            // find first index with timestamp >= targetTs
            let idx = 0;
            for (let i = 0; i < REPLAY_BUFFER.length; i++) {
              const ts = REPLAY_BUFFER[i].timestamp || REPLAY_BUFFER[i].t || REPLAY_BUFFER[i].time || 0;
              if (ts >= targetTs) { idx = i; break; }
            }
            const maxItems = Number(process.env.OVERSOUL_REPLAY_CHUNK || 2000);
            const slice = REPLAY_BUFFER.slice(idx, Math.min(REPLAY_BUFFER.length, idx + maxItems));
            try { ws.send(JSON.stringify({ type: 'replay_pulses', payload: slice })); } catch (e) {}
            try { dlog('[oversoul_forwarder] request_scrub -> targetTs=', targetTs, 'idx=', idx, 'sliceLen=', slice.length); } catch(e){}
          }
        } catch (e) {}
      }
      // support client-initiated highlights: broadcast to all clients
      if (r && r.type === 'oversoul_pulse_highlight' && Array.isArray(r.ids)) {
        const out = JSON.stringify({ type: 'oversoul_pulse_highlight', ids: r.ids });
        wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) { try { c.send(out); } catch (e) {} } });
      }
    } catch (e) {}
  });

  ws.on('close', () => console.log('[oversoul_forwarder] client disconnected'));
});

process.on('SIGINT', async () => {
  console.log('[oversoul_forwarder] shutting down');
  try { await sub.quit(); } catch (e) {}
  try { wss.close(); } catch (e) {}
  process.exit(0);
});
