// Integration Manifest Generator (Pilot)
// Inventories endpoints, data flows, and module contracts across Council Dashboard.
// Produces a machine-readable JSON manifest and a human-friendly summary.

const fs = require('fs');
const path = require('path');

/**
 * Scan known server modules to assemble an integration manifest.
 * This pilot uses static heuristics; future versions can dynamically introspect Express routes.
 * @returns {{ generatedAt: string, services: Array, endpoints: Array, dataFlows: Array, contracts: Array, notes: string[] }}
 */
function generateManifest() {
  const generatedAt = new Date().toISOString();

  // Services (known modules/processes)
  const services = [
    { name: 'alerting', file: 'server/alerting.js', role: 'alerts, rituals, metrics, comet glyphs' },
    { name: 'CouncilSocket', file: 'CouncilSocket.js', role: 'WebSocket/SSE bridge to UI' },
    { name: 'api', file: 'server/index.js', role: 'Express API (assumed)' },
    { name: 'cometCommunion', file: 'server/cometCommunion.js', role: 'glyph generation and archival' },
  ].filter(Boolean);

  // Endpoints (known or inferred)
  const endpoints = [
    { method: 'GET', path: '/metrics', desc: 'Prometheus metrics endpoint (UI/WS health, empathy, veilwatch)' },
    { method: 'GET', path: '/api/recent-alerts', desc: 'Replay ribbon: recent node alerts' },
    { method: 'POST', path: '/api/dispatch', desc: 'Manual alert dispatch with category' },
    { method: 'GET', path: '/api/integration/manifest', desc: 'Integration manifest (this document)' },
  ];

  // Data flows (Redis keys, logs, webhooks)
  const dataFlows = [
    { source: 'Redis', key: 'harmony', consumers: ['alerting.checkMetrics'] },
    { source: 'Redis', key: 'nodes', consumers: ['alerting.checkMetrics', 'onboardNodeBreathstream'] },
    { source: 'Redis', key: 'empathy_resonance', consumers: ['metrics exporter', 'cometCommunion'] },
    { source: 'Redis', key: 'veilwatch', consumers: ['metrics exporter', 'cometCommunion'] },
    { source: 'File', path: 'council_audit.log', producers: ['alerting.logAudit'], purpose: 'append-only audit' },
    { source: 'Webhook', kind: 'discord/teams/slack/email', producers: ['alerting dispatchers'], purpose: 'external notifications' },
  ];

  // Contracts (module interfaces)
  const contracts = [
    { module: 'alerting', exports: ['checkMetrics', 'sendRitualPulse', 'logAudit', 'dispatchAlert', 'recentAlerts', 'latencyMetrics'] },
    { module: 'cometCommunion', exports: ['createAndArchiveGlyph'] },
    { module: 'CouncilSocket', exports: ['startSocketServer', 'broadcast'] },
  ];

  // Notes for human review
  const notes = [
    'This is a pilot manifest. Route discovery is inferred; wire actual Express app to expose /api/integration/manifest.',
    'Consider adding dynamic route introspection via app._router.stack in server/index.js.',
    'Prometheus metrics are produced via prom-client; ensure /metrics endpoint is served by the server entrypoint.',
  ];

  return { generatedAt, services, endpoints, dataFlows, contracts, notes };
}

/**
 * Save manifest to a file for archival and review.
 * @param {string} outPath absolute or workspace-relative path
 */
function saveManifest(outPath) {
  const manifest = generateManifest();
  const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(manifest, null, 2));
  return abs;
}

module.exports = { generateManifest, saveManifest };
