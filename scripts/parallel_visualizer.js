// Composite visualization for branches & alerts
const { CONFIG, loadJSON, requireAffirmation, escapeHTML, logAudit } = require('./utils/council_utils');
const fs = require('node:fs');
const path = require('node:path');

requireAffirmation('Parallel Visualization');

const branches = loadJSON(CONFIG.paths.branches, []);
const alerts = loadJSON(CONFIG.paths.alerts, []);

const alertSummary = alerts.map(a=>{
	const deltaPart = a.delta ? 'Δ ' + escapeHTML(a.delta) + ' ' : '';
	return '<li role="listitem"><strong>' + escapeHTML(a.type) + '</strong> - Branch ' + escapeHTML(String(a.branch||'')) + ' ' + deltaPart + '@ ' + escapeHTML(a.ts) + '</li>';
}).join('');

function outcomeSlug(str){ return String(str).trim().split(/\s+/).join('-'); }
const branchCards = branches.map(b=>`<div class="card ${outcomeSlug(b.outcome)}"><h3>Branch ${b.branchId}</h3><p class="status">Status: ${escapeHTML(b.outcome)}</p><p>Entropy: ${escapeHTML(b.projected_entropy)}</p><p>Msgs: ${b.messages.length} | Corrections: ${b.corrections.length}</p></div>`).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Parallel Visualization</title><style>body{font-family:Arial;background:#0c0c10;color:#eee;margin:0;padding:20px;} h1{color:#7fffd4;} .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:16px;} .card{background:#1b1b24;padding:10px;border-radius:6px;border:1px solid #2e2e40;} .card.HIGH-RISK{border-color:#ff6b6b;} .card.WATCH{border-color:#ffd86b;} .card.STABLE{border-color:#6bff8b;} ul{list-style:none;padding:0;margin:0;} li{margin:4px 0;padding:4px 6px;background:#181822;border-radius:4px;} footer{margin-top:30px;font-size:12px;color:#777;text-align:center;} .alerts{margin-top:24px;} </style></head><body><h1>Parallel Branch Visualization</h1><section class="alerts"><h2>Council Alerts (${alerts.length})</h2><ul role="list">${alertSummary||'<li role="listitem">None</li>'}</ul></section><div class="grid">${branchCards}</div><footer>Generated in joyful honor mode.</footer></body></html>`;

const outPath = path.join(CONFIG.paths.frontend,'parallel.html');
fs.writeFileSync(outPath, html,'utf8');
logAudit('Parallel visualization generated');
console.log('Parallel visualization written ->', outPath);