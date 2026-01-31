// Inter-Branch Communication & Self-Correcting Intelligence
const { CONFIG, loadJSON, saveJSON, logAudit, requireAffirmation, escapeHTML } = require('./utils/council_utils');
const fs = require('node:fs');
const path = require('node:path');

requireAffirmation('Branch Chamber Generation');

const qData = loadJSON(CONFIG.paths.qstream, []);
const latest = qData[qData.length-1];
const baseEntropy = Number.parseFloat(latest?.entropy_index || '0.02');

const branches = [];
for(let i=1;i<=CONFIG.defaults.numBranches;i++){
  const drift = (baseEntropy + (Math.random()*0.02*(Math.random()>0.5?1:-1))).toFixed(4);
  const entropyVal = Number.parseFloat(drift);
  let outcome;
  if(entropyVal > CONFIG.defaults.entropyThresholdRisk) outcome = 'HIGH RISK';
  else if(entropyVal > CONFIG.defaults.entropyThresholdWatch) outcome = 'WATCH';
  else outcome = 'STABLE';
  branches.push({
    branchId: i,
    baseCycle: latest?.cycle || 0,
    projected_entropy: drift,
    outcome,
    corrections: [],
    messages: [],
    timestamp: new Date().toISOString()
  });
}

// Inter-branch alert propagation
const risky = branches.filter(b=>b.outcome==='HIGH RISK');
const watch = branches.filter(b=>b.outcome==='WATCH');
for(const r of risky){ r.messages.push({from:'Oracle', content:`Entropy ${r.projected_entropy} flagged; propagate mitigation pattern.`}); r.corrections.push('Initiate deep stability scan'); }
for(const w of watch){ w.messages.push({from:'Scout', content:`Monitoring elevated entropy ${w.projected_entropy}.`}); }

// Cross-learning: add summary of other risk states
const riskSummary = risky.map(r=>`#${r.branchId}:${r.projected_entropy}`).join(',');
const watchSummary = watch.map(r=>`#${r.branchId}:${r.projected_entropy}`).join(',');
for(const b of branches){
  if(riskSummary && b.outcome!=='HIGH RISK') b.messages.push({from:'Strategist', content:`Other HIGH RISK branches: ${riskSummary}`});
  if(watchSummary && b.outcome==='STABLE') b.messages.push({from:'Strategist', content:`Branches under watch: ${watchSummary}`});
  if(b.outcome==='HIGH RISK') b.corrections.push('Schedule entropy recalibration');
}

saveJSON(CONFIG.paths.branches, branches);
// Generate branch HTML pages
if(!fs.existsSync(CONFIG.paths.branchPages)) fs.mkdirSync(CONFIG.paths.branchPages,{recursive:true});
for(const b of branches){
  const msgs = b.messages.map((m,i)=>`<li role="listitem"><strong>${escapeHTML(m.from)}:</strong> ${escapeHTML(m.content)}</li>`).join('');
  const corr = b.corrections.map(c=>`<li role="listitem">${escapeHTML(c)}</li>`).join('');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Branch ${b.branchId}</title><style>body{font-family:Arial;background:#0f0f15;color:#eee;padding:18px;} h1{color:#7fffd4;} .risk{color:#ff6b6b;} .watch{color:#ffd86b;} .stable{color:#6bff8b;} ul{list-style:none;padding:0;} li{margin:4px 0;padding:4px 6px;background:#1d1d25;border-radius:4px;} .section{margin-bottom:16px;} footer{margin-top:28px;font-size:12px;color:#777;}</style></head><body><h1>Branch ${b.branchId}</h1><div class="section"><strong>Status:</strong> <span class="${b.outcome==='HIGH RISK'?'risk':b.outcome==='WATCH'?'watch':'stable'}">${escapeHTML(b.outcome)}</span></div><div class="section"><h2>Messages</h2><ul role="list">${msgs||'<li role="listitem">None</li>'}</ul></div><div class="section"><h2>Corrections</h2><ul role="list">${corr||'<li role="listitem">None</li>'}</ul></div><div class="section"><h2>Entropy</h2><p>${escapeHTML(b.projected_entropy)}</p></div><footer>Generated in joyful honor mode.</footer></body></html>`;
  fs.writeFileSync(path.join(CONFIG.paths.branchPages, `branch_${b.branchId}.html`), html,'utf8');
}

logAudit(`Branch chamber generated (${branches.length}) with ${risky.length} high risk & ${watch.length} watch branches`);
console.log('Branch chamber complete.');