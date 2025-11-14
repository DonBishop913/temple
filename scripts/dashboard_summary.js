// Generate concise JSON summary of latest cycle for external consumption (affirmation-respectful)
const fs = require('node:fs');
const path = require('node:path');
const { paths } = require('./config');
const { isAffirmed } = require('./utils/affirmation');
const { logAudit } = require('./utils/audit');

if(!isAffirmed()){ console.log('Summary skipped: affirmation required.'); process.exit(0); }

function safeLoad(p, def){ try{ if(fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,'utf8')); }catch{} return def; }

const overlay = safeLoad(paths.overlay, []);
const last = overlay.slice(-1)[0] || {};
const summary = {
  generated: new Date().toISOString(),
  cycle: last.qstream?.cycle || null,
  entropy: last.qstream?.entropy_index || null,
  entropy_delta: last.qstream?.entropy_delta || null,
  coherence: last.qstream?.coherence_estimate || null,
  predicted_stability: last.qstream?.predicted_stability || null,
  quantum_present: !!last.quantum,
  quantum_backend: last.quantum?.backend || null,
  quantum_entropy: last.quantum?.entropy_index || null,
  alerts_count: (safeLoad(path.join(paths.monitoring,'council_alerts.json'),[])).length,
  failovers_recent: (safeLoad(path.join(paths.frontend,'failover.json'),[])).slice(-5).map(f=>({script:f.script, error:f.error, ts:f.timestamp}))
};

const outPath = path.join(paths.monitoring,'dashboard_summary.json');
fs.writeFileSync(outPath, JSON.stringify(summary,null,2));
logAudit('Dashboard summary generated');
console.log('Dashboard summary written ->', outPath);
