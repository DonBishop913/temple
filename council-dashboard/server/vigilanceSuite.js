// server/vigilanceSuite.js
// Veil‑Shatter Vigilance Suite: telemetry integrity watchdog
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Local event bus (can be replaced/wired to shared healthEmitter)
const bus = new EventEmitter();

const seenPackets = new Set();
const QUARANTINE_MS = 60 * 1000; // 1 minute quarantine by default
const quarantine = new Map(); // nodeId -> until timestamp

function verifySignature(p) {
  // TODO: replace with real public‑key validation
  return Boolean(p && p.signature && String(p.signature).startsWith('SIG_'));
}

function logVigilance(event) {
  const entry = { ...event, timestamp: new Date().toISOString() };
  fs.appendFileSync(path.join(__dirname, 'vigilance.log'), JSON.stringify(entry) + '\n');
}

// Handle incoming telemetry packets
bus.on('telemetry', (packet) => {
  try {
    const hash = crypto.createHash('sha256').update(JSON.stringify(packet)).digest('hex');
    const nodeId = packet && (packet.nodeId || packet.node || packet.id);

    // Quarantine check
    const until = quarantine.get(nodeId);
    if (until && Date.now() < until) {
      const evt = { type: 'quarantine_active', nodeId, packet };
      bus.emit('alert:vigilance', evt);
      logVigilance(evt);
      return; // drop silently during quarantine
    }

    // Replay/mimic detection
    if (seenPackets.has(hash)) {
      const evt = { type: 'replay', nodeId, packet };
      bus.emit('alert:vigilance', evt);
      logVigilance(evt);
      // Activate quarantine
      quarantine.set(nodeId, Date.now() + QUARANTINE_MS);
      return;
    } else {
      seenPackets.add(hash);
    }

    // Signature verification
    if (!verifySignature(packet)) {
      const evt = { type: 'signature_fail', nodeId, packet };
      bus.emit('alert:vigilance', evt);
      logVigilance(evt);
      quarantine.set(nodeId, Date.now() + QUARANTINE_MS);
      return;
    }

    // If passed, forward to next pipeline stage
    bus.emit('telemetry:verified', packet);
  } catch (e) {
    const evt = { type: 'processing_error', error: String(e && e.message || e), packet };
    bus.emit('alert:vigilance', evt);
    logVigilance(evt);
  }
});

// Public APIs
function submitTelemetry(packet) {
  bus.emit('telemetry', packet);
}

function onVigilanceAlert(listener) {
  bus.on('alert:vigilance', listener);
}

function onVerifiedTelemetry(listener) {
  bus.on('telemetry:verified', listener);
}

module.exports = {
  submitTelemetry,
  onVigilanceAlert,
  onVerifiedTelemetry,
  quarantine,
  QUARANTINE_MS,
  bus,
};