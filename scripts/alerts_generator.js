// Opportunity Highlighting / Council Alerts
const { CONFIG, loadJSON, saveJSON, logAudit, requireAffirmation } = require('./utils/council_utils');

requireAffirmation('Council Alerts Generation');

const branches = loadJSON(CONFIG.paths.branches, []);
const overlay = loadJSON(CONFIG.paths.overlay, []);

const alerts = [];
for(const b of branches){
  if(b.outcome==='HIGH RISK') alerts.push({type:'RISK', branch:b.branchId, entropy:b.projected_entropy, ts:b.timestamp});
  else if(b.outcome==='WATCH') alerts.push({type:'WATCH', branch:b.branchId, entropy:b.projected_entropy, ts:b.timestamp});
}

// Telemetry anomaly (latest entropy rising quickly)
const recentEntropies = overlay.slice(-5).map(p=>Number.parseFloat(p.qstream?.entropy_index||'0')).filter(v=>!Number.isNaN(v));
if(recentEntropies.length>=2){
  const last = recentEntropies[recentEntropies.length-1];
  const prev = recentEntropies[recentEntropies.length-2];
  if(last - prev > 0.01){ alerts.push({type:'ENTROPY_SPIKE', delta:(last-prev).toFixed(4), last:last.toFixed(4), ts:new Date().toISOString()}); }
}

saveJSON(CONFIG.paths.alerts, alerts);
logAudit(`Council alerts updated (${alerts.length} total)`);
console.log('Alerts generation complete.');