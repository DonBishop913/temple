/** @jest-environment node */
const WebSocket = require('ws');

describe('WebSocket Telemetry Integration', () => {
  let ws;

  beforeAll(() =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WS connect timeout')), 5000);
      ws = new WebSocket('ws://localhost:4322');
      ws.on('open', () => { clearTimeout(timer); resolve(); });
      ws.on('error', (err) => { clearTimeout(timer); reject(err); });
    })
  , 15000);

  afterAll(() => {
    if (ws) ws.close();
  });

  test('should receive telemetry streams within 5 seconds', () =>
    new Promise((resolve, reject) => {
      const receivedTypes = new Set();
      const expectedEvents = [
        'nodes',
        'harmony',
        'energy',
        'override',
        'schumann',
        'joyparticle',
        'planetary',
        'nodeMap',
        'pulses',
      ];
      const timer = setTimeout(() => {
        reject(new Error(`Missing telemetry events, received: ${Array.from(receivedTypes).join(', ')}`));
      }, 5000);
      ws.on('message', (msgRaw) => {
        try {
          const msg = JSON.parse(msgRaw);
          if (msg.type) {
            receivedTypes.add(msg.type);
            // basic payload validation for a couple of types
            if (msg.type === 'planetary') {
              if (!Array.isArray(msg.payload)) reject(new Error('planetary payload must be array'));
            }
            if (msg.type === 'nodes') {
              if (!Array.isArray(msg.payload)) reject(new Error('nodes payload must be array'));
            }
            const hasAll = expectedEvents.every((evt) => receivedTypes.has(evt));
            if (hasAll) {
              clearTimeout(timer);
              resolve();
            }
          }
        } catch {}
      });
    })
  );

  test('reconnects and continues receiving telemetry', () =>
    new Promise((resolve, reject) => {
      // Close and reopen, then assert messages arrive
      const closeTimer = setTimeout(() => reject(new Error('Failed to close and reconnect in time')), 8000);
      ws.close();
      ws.on('close', () => {
        const reconnect = new WebSocket('ws://localhost:4322');
        const gotTypes = new Set();
        const expected = ['nodes', 'planetary', 'pulses'];
        const timer = setTimeout(() => {
          reject(new Error(`Reconnect missing telemetry: ${Array.from(gotTypes).join(',')}`));
        }, 5000);
        reconnect.on('message', (msgRaw) => {
          try {
            const msg = JSON.parse(msgRaw);
            if (msg.type) {
              // payload validations
              if (msg.type === 'planetary' && !Array.isArray(msg.payload)) reject(new Error('planetary payload invalid after reconnect'));
              if (msg.type === 'nodes' && !Array.isArray(msg.payload)) reject(new Error('nodes payload invalid after reconnect'));
              if (msg.type === 'pulses' && !Array.isArray(msg.payload)) reject(new Error('pulses payload invalid after reconnect'));
              gotTypes.add(msg.type);
              if (expected.every(e => gotTypes.has(e))) {
                clearTimeout(timer);
                clearTimeout(closeTimer);
                reconnect.close();
                resolve();
              }
            }
          } catch {}
        });
        reconnect.on('error', (err) => { clearTimeout(timer); clearTimeout(closeTimer); reject(err); });
      });
    })
  , 15000);
});
