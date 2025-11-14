// Merge latest telemetry + recent agent messages into monitoring/dashboard_overlay.json
// Affirmation-gated for safety.
const fs = require('node:fs');
const { paths } = require('./config');
const { logAudit } = require('./utils/audit');
const { isAffirmed } = require('./utils/affirmation');

function writeAudit(msg){ logAudit(msg); }

function loadJSON(p,def){
  if(!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch { return def; }
}

const affirmed = isAffirmed();
if(!affirmed){ console.log('Execution skipped: affirmation missing.'); process.exit(0); }

const qData = loadJSON(paths.qstream,[]);
const chamber = loadJSON(paths.chamber,{messages:[]});
if(!qData.length && !chamber.messages.length){ console.log('No data to merge.'); process.exit(0); }

const latestQ = qData[qData.length-1]||{};
// Optional quantum telemetry integration
let quantumTelemetry = null;
try {
  const quantumFile = require('node:path').join(require('node:path').resolve(__dirname,'..'),'quantum','qiskit_telemetry.json');
  if(fs.existsSync(quantumFile)){
    const qHist = JSON.parse(fs.readFileSync(quantumFile,'utf8'));
    quantumTelemetry = qHist[qHist.length-1]||null;
  }
} catch {}
const latestMsgs = chamber.messages.slice(-5);
let overlay = loadJSON(paths.overlay,[]);
const mergedPulse = {
  timestamp: new Date().toISOString(),
  qstream: latestQ,
  agent_chamber: latestMsgs,
  quantum: quantumTelemetry ? {
    circuit_type: quantumTelemetry.circuit_type,
    entropy_index: quantumTelemetry.entropy_index,
    coherence_estimate: quantumTelemetry.coherence_estimate,
    backend: quantumTelemetry.backend,
    // Extended metrics when available
    system_entropy: quantumTelemetry.system_entropy ?? quantumTelemetry.entropy_index,
    subsystem_entropy_q0: quantumTelemetry.subsystem_entropy_q0,
    entanglement_measure: quantumTelemetry.entanglement_measure
  } : null
};
overlay.push(mergedPulse);
const tmp = paths.overlay+`.tmp.${Date.now()}`;
fs.writeFileSync(tmp, JSON.stringify(overlay,null,2));
fs.renameSync(tmp, paths.overlay);
writeAudit('Dashboard pulse merged (qstream + agent_chamber)');
console.log('Dashboard overlay updated:', mergedPulse);