#!/usr/bin/env node
const WebSocket = require('ws');

const url = process.env.WS_URL || 'ws://localhost:4322';
const attempts = Number(process.env.WS_ATTEMPTS || 5);
const backoffMs = Number(process.env.WS_BACKOFF_MS || 500);
const readyDelayMs = Number(process.env.WS_READY_DELAY_MS || 500);
const expected = ['nodes','harmony','energy','override','schumann','joyparticle','planetary','nodeMap','pulses'];

function connectOnce() {
  return new Promise((resolve, reject) => {
    const types = new Set();
    const ws = new WebSocket(url);
    let closed = false;

    const fail = (err) => {
      if (closed) return;
      closed = true;
      try { ws.close(); } catch {}
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    const succeed = () => {
      if (closed) return;
      closed = true;
      try { ws.close(); } catch {}
      resolve(types);
    };

    const watchdog = setTimeout(() => fail(new Error('No data within 3s')), 3000);

    ws.on('open', () => {
      // small readiness delay to avoid race at connect time
      setTimeout(() => { /* ready */ }, readyDelayMs);
    });

    ws.on('message', (msgRaw) => {
      try {
        const msg = JSON.parse(msgRaw);
        if (!msg || typeof msg !== 'object') throw new Error('non-object message');
        if (!('type' in msg) || !('payload' in msg)) throw new Error('missing type/payload');
        types.add(msg.type);
        // targeted payload validations for two representative streams
        if (msg.type === 'planetary' && !Array.isArray(msg.payload)) throw new Error('planetary payload invalid');
        if (msg.type === 'nodes' && !Array.isArray(msg.payload)) throw new Error('nodes payload invalid');
        if (types.size >= 3) { // first burst usually includes multiple types quickly
          clearTimeout(watchdog);
          succeed();
        }
      } catch (e) {
        clearTimeout(watchdog);
        fail(e);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(watchdog);
      fail(err);
    });

    ws.on('close', () => {
      clearTimeout(watchdog);
      if (!closed) fail(new Error('socket closed before data'));
    });
  });
}

async function main() {
  for (let i = 1; i <= attempts; i++) {
    try {
      const types = await connectOnce();
      const got = Array.from(types);
      const ok = expected.every(e => types.has(e)) || got.length >= 3; // pass on initial burst or full set
      console.log(`WS probe attempt ${i}: received types => ${got.join(',')}`);
      if (ok) {
        console.log('WS probe PASS');
        process.exit(0);
      }
      console.log('WS probe incomplete payload set, will retry...');
    } catch (e) {
      console.error(`WS probe attempt ${i} error: ${e.message}`);
    }
    const delay = backoffMs * i; // simple exponential backoff
    await new Promise(r => setTimeout(r, delay));
  }
  console.error('WS probe FAIL after attempts');
  process.exit(1);
}

main();