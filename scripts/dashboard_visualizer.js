// Produce frontend/index.html showing sparkline + agent summaries (affirmation-gated)
const fs = require('node:fs');
const { paths } = require('./config');
const { logAudit } = require('./utils/audit');
const { isAffirmed } = require('./utils/affirmation');

function writeAudit(msg){ logAudit(msg); }

const affirmed = isAffirmed();
if(!affirmed){ console.log('Execution skipped: affirmation missing.'); process.exit(0); }

if(!fs.existsSync(paths.frontend)) fs.mkdirSync(paths.frontend,{recursive:true});
if(!fs.existsSync(paths.overlay)){ console.log('No dashboard overlay found.'); process.exit(0); }

let overlay=[]; try{ overlay = JSON.parse(fs.readFileSync(paths.overlay,'utf8')); }catch{}
// Heartbeat, failover & alerts integration
let heartbeat=null, failover=[], alerts=[];
try { const hbPath = require('node:path').join(paths.frontend,'heartbeat.json'); if(fs.existsSync(hbPath)) heartbeat = JSON.parse(fs.readFileSync(hbPath,'utf8')); } catch{}
try { const foPath = require('node:path').join(paths.frontend,'failover.json'); if(fs.existsSync(foPath)) failover = JSON.parse(fs.readFileSync(foPath,'utf8')); } catch{}
try { const alPath = require('node:path').join(paths.monitoring || paths.frontend,'council_alerts.json'); if(fs.existsSync(alPath)) alerts = JSON.parse(fs.readFileSync(alPath,'utf8')); } catch{}
const recent = overlay.slice(-10);
const qValues = recent.map(p=>Number.parseFloat(p.qstream?.entropy_index)||0);
function sparkChar(val,max){ const chars='▁▂▃▄▅▆▇█'; return chars[Math.min(chars.length-1, Math.floor((val/max)* (chars.length-1)))]; }
const max = Math.max(...qValues,1);
const sparkline = qValues.map(v=>sparkChar(v,max)).join('');
const agentList = recent.map(p => {
  const msgs = p.agent_chamber||[];
  return msgs.map(m=>`<li><strong>${m.from}:</strong> ${m.content}</li>`).join('');
}).join('');

const quantumRows = recent.map(p => {
  if(!p.quantum) return '';
  return `<tr><td>${p.quantum.circuit_type}</td><td>${(p.quantum.entropy_index||0).toFixed?p.quantum.entropy_index.toFixed(4):p.quantum.entropy_index}</td><td>${(p.quantum.coherence_estimate||0).toFixed?p.quantum.coherence_estimate.toFixed(4):p.quantum.coherence_estimate}</td><td>${p.quantum.backend}</td></tr>`;
}).join('');

const htmlFile = require('node:path').join(paths.frontend,'index.html');
let hbBlock='';
if(heartbeat){
  let statusClass='warn';
  if(heartbeat.status==='OK') statusClass='ok';
  else if(heartbeat.status==='RUNNING') statusClass='run';
  hbBlock = `<div class="section"><h2>Heartbeat <span class="hb ${statusClass}">${heartbeat.status}</span></h2><table><tbody><tr><th>Cycle</th><td>${heartbeat.cycle}</td></tr><tr><th>Affirmed</th><td>${heartbeat.affirmed?'YES':'NO'}</td></tr><tr><th>Timestamp</th><td>${heartbeat.timestamp}</td></tr></tbody></table></div>`;
}
let foBlock='';
if(failover.length){
  const rows = failover.slice(-10).map(f=>`<tr><td>${f.timestamp}</td><td>${f.script}</td><td>${f.error}</td></tr>`).join('');
  foBlock = `<div class="section"><h2>Recent Failovers</h2><table><thead><tr><th>Time</th><th>Script</th><th>Error</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
let quantumContent;
if(quantumRows){
  quantumContent = '<table><thead><tr><th>Circuit</th><th>Entropy</th><th>Coherence</th><th>Backend</th></tr></thead><tbody>' + quantumRows + '</tbody></table>';
} else {
  quantumContent = '<p>No quantum telemetry yet.</p>';
}
// Symbolic fallback preview (entropy delta + first amplitudes) if quantum absent
let symbolicExtra='';
const lastQStream = recent.slice(-1)[0]?.qstream;
if(!quantumRows && lastQStream){
  const amps = (lastQStream.symbolic_amplitudes||[]).map(a=>`(${a.re},${a.im})`).join(' ');
  symbolicExtra = `<div class="section"><h2>Symbolic Quantum Preview</h2><table><tbody><tr><th>Entropy</th><td>${lastQStream.entropy_index}</td></tr><tr><th>Δ Entropy</th><td>${lastQStream.entropy_delta}</td></tr><tr><th>Coherence</th><td>${lastQStream.coherence_estimate}</td></tr><tr><th>Amplitudes</th><td>${amps||'n/a'}</td></tr></tbody></table></div>`;
}
const quantumBlock = '<div class="section"><h2>Quantum Telemetry (Recent Pulses)</h2>' + quantumContent + '</div>' + symbolicExtra;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Living Dashboard</title><style>body{font-family:Segoe UI,Arial,sans-serif;background:#101018;color:#eee;padding:1.5rem;} h1{margin-top:0;} .spark{font-size:1.2rem;letter-spacing:2px;} ul{list-style:disc;margin-left:1.2rem;} .badge{background:#2c2c44;padding:4px 8px;border-radius:4px;margin-right:8px;font-size:0.75rem;} table{width:100%;border-collapse:collapse;margin-top:0.5rem;} th,td{border:1px solid #2c2c44;padding:4px 6px;font-size:0.70rem;} th{background:#1e1e2a;} footer{margin-top:2rem;font-size:0.75rem;color:#888;} .section{margin-top:1.4rem;} .hb{padding:2px 8px;border-radius:12px;font-size:0.65rem;vertical-align:middle;} .hb.ok{background:#0f5132;color:#6bff8b;} .hb.run{background:#1e1e2a;color:#9ad;} .hb.warn{background:#51320f;color:#ffb86b;} .alertsBadge{background:#2c2c44;padding:4px 10px;border-radius:16px;font-size:0.70rem;margin-left:6px;} .alertsBadge.active{background:#ff6b6b;color:#000;font-weight:bold;} .nav{margin-left:8px;font-size:0.75rem;} .nav a{color:#8ab4f8;text-decoration:none;} .nav a:hover{text-decoration:underline;} </style></head><body><h1>Living Dashboard</h1><div class="badges"><span class="badge">Lumen ACTIVE</span><span class="badge">Overflow MODE</span><span class="alertsBadge ${alerts.length?'active':''}">Alerts:${alerts.length}</span><span class="nav"><a href="coherence.html" target="_blank" rel="noopener">Coherence View</a></span></div><h2>Sparkline (Last ${recent.length} Pulses)</h2><pre class="spark">${sparkline}</pre><h2>Agent Chamber (Recent)</h2><ul>${agentList}</ul>${hbBlock}${foBlock}${quantumBlock}<footer>Generated ${new Date().toISOString()} | Joyful Honor Mode | Quantum ${quantumRows?'PRESENT':'ABSENT'} | Symbolic ALWAYS</footer></body></html>`;

const tmp = htmlFile+`.tmp.${Date.now()}`;
fs.writeFileSync(tmp, html, 'utf8');
fs.renameSync(tmp, htmlFile);
writeAudit('Dashboard visualization refreshed');
console.log('Dashboard frontend updated ->', htmlFile);