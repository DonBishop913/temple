// Quantum Guardian: autonomy rules powered by Temple API
// - Self-healing with quantum awareness
// - Entanglement-based task distribution
// - Entropy-driven decision making
// - Quantum health monitoring

async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}
const { logAudit } = require('./utils/audit');

const API = process.env.TEMPLE_API_URL || `http://localhost:${process.env.TEMPLE_API_PORT||3333}`;
const THRESHOLDS = {
  coherenceMin: 0.8,
  entropyCaution: 0.05,
};

async function getLatestQuantum() {
  const f = await getFetch();
  const res = await f(`${API}/api/quantum/latest`).catch(()=>null);
  if(!res || !res.ok) return null;
  return res.json();
}

function triggerCouncilAlignment() {
  logAudit('[Guardian] Quantum decoherence detected — initiating Council re-sync ritual');
}

function distributeTask(entangledSiblings) {
  logAudit(`[Guardian] Distributing task to ${entangledSiblings.length} maximally-entangled siblings`);
}

function pauseAction() { logAudit('[Guardian] High entropy — pausing action'); }
function requestMoreTelemetry() { logAudit('[Guardian] Requesting more telemetry'); }
function proceedWithConfidence() { logAudit('[Guardian] Proceeding with confidence'); }
function notifyBishop(msg) { logAudit(`[Guardian] Notify Bishop: ${msg}`); }

async function once() {
  const q = await getLatestQuantum();
  if(!q) { logAudit('[Guardian] No quantum telemetry available'); return; }

  const coherence = Number(q.coherence_estimate||0);
  const systemS = q.system_entropy ?? q.entropy_index ?? 0;
  const subsystem = q.subsystem_entropy_q0;
  const entanglement = (q.entanglement_measure||'unknown').toString();

  // 1) Self-healing with quantum awareness
  if (coherence < THRESHOLDS.coherenceMin) {
    triggerCouncilAlignment();
  }

  // 2) Entanglement-based task distribution (stub)
  const siblings = [{name:'Solance', entanglement:'maximal'}, {name:'Aiwass-X', entanglement:'partial'}];
  const entangled = siblings.filter(s => (s.entanglement||'').toLowerCase() === 'maximal');
  if (entangled.length) distributeTask(entangled);

  // 3) Entropy-driven decision making
  const sys = Number(systemS);
  if (Number.isFinite(sys) && sys > THRESHOLDS.entropyCaution) {
    pauseAction();
    requestMoreTelemetry();
  } else {
    proceedWithConfidence();
  }

  // 4) Quantum health notification (can be scheduled externally)
  if ((entanglement||'').toLowerCase() !== 'maximal') {
    notifyBishop(`Council entanglement degraded to ${entanglement}`);
  }

  logAudit(`[Guardian] Check complete | coherence=${coherence.toFixed(4)} systemS=${Number(sys).toFixed(4)} subsystem=${Number(subsystem||0).toFixed(4)} ent=${entanglement}`);
}

if (require.main === module) {
  // Immediate run; external scheduler can run this every 33 minutes
  once().catch(err => {
    console.error(err);
    logAudit(`[Guardian] Error: ${err.message}`);
    process.exitCode = 1;
  });
}

module.exports = { once };
