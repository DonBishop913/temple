// Master Index for Branch Pages (affirmation-gated)
const fs = require('node:fs');
const path = require('node:path');
const { paths } = require('./config');
const { requireAffirmation } = require('./utils/affirmation');
const { logAudit } = require('./utils/audit');

requireAffirmation('Master Index Generation');

if(!fs.existsSync(paths.branchPages)){
  console.log('No branch pages directory found.');
  process.exit(0);
}

const files = fs.readdirSync(paths.branchPages).filter(f=>/^branch_\d+\.html$/.test(f)).sort((a,b)=>{
  const A = Number.parseInt(a.match(/branch_(\d+)/)[1],10);
  const B = Number.parseInt(b.match(/branch_(\d+)/)[1],10);
  return A - B;
});

if(!files.length){ console.log('No branch pages to index.'); process.exit(0); }

// Load branch outcomes for risk highlighting
let branchData=[];
try { const overlayPath = path.join(paths.monitoring,'branch_overlay.json'); if(fs.existsSync(overlayPath)) branchData = JSON.parse(fs.readFileSync(overlayPath,'utf8')); } catch{}
let alerts=[]; try{ const alertsPath = path.join(paths.monitoring,'council_alerts.json'); if(fs.existsSync(alertsPath)) alerts = JSON.parse(fs.readFileSync(alertsPath,'utf8')); }catch{}
const outcomeMap = new Map(branchData.map(b=>[`branch_${b.branchId}.html`, b.outcome]));
const panels = files.map((f,i)=>{
  const outcome = outcomeMap.get(f) || 'UNKNOWN';
  const cls = outcome.replaceAll(' ','-');
  return `<div class="branch ${cls}"><h3>Branch ${i+1} <span class="outcome">${outcome}</span></h3><iframe src="branches/${f}" title="Branch ${i+1} Reality"></iframe></div>`;
}).join('');
const riskCounts = branchData.reduce((acc,b)=>{ acc[b.outcome]=(acc[b.outcome]||0)+1; return acc; },{});
const riskBadges = Object.entries(riskCounts).map(([k,v])=>`<span class="rb ${k.replaceAll(' ','-')}">${k}:${v}</span>`).join('');
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Council Master Index</title><style>body{margin:0;background:#0a0a0a;color:#eee;font-family:Arial;padding:20px;}h1{text-align:center;color:#7fffd4;margin-bottom:12px;} .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px;} .branch{background:#181818;padding:12px;border:2px solid #2e2e40;border-radius:8px;transition:border-color .3s;} .branch.HIGH-RISK{border-color:#ff6b6b;} .branch.WATCH{border-color:#ffd86b;} .branch.STABLE{border-color:#6bff8b;} .branch h3{margin:0 0 8px;color:#ffdf80;display:flex;justify-content:space-between;font-size:16px;} .branch .outcome{font-size:12px;padding:2px 6px;border-radius:4px;background:#222;} iframe{width:100%;height:420px;border:none;border-radius:4px;background:#000;} footer{margin-top:32px;font-size:11px;color:#666;text-align:center;} .summary{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px;} .rb{background:#222;padding:4px 8px;border-radius:4px;font-size:11px;} .rb.HIGH-RISK{background:#ff6b6b;color:#000;font-weight:bold;} .rb.WATCH{background:#ffd86b;color:#000;} .rb.STABLE{background:#6bff8b;color:#000;} .alertsBadge{background:#344;padding:4px 10px;border-radius:18px;font-size:12px;margin-left:8px;} .alertsBadge.active{background:#ff6b6b;color:#000;font-weight:bold;} </style></head><body><h1>🌌 Council Master Index – Parallel Realities 🌌</h1><div class="summary">${riskBadges}<span class="alertsBadge ${alerts.length?'active':''}">Alerts:${alerts.length}</span></div><div class="grid">${panels}</div><footer>Generated ${new Date().toISOString()} | Joyful Honor Mode</footer></body></html>`;

if(!fs.existsSync(paths.frontend)) fs.mkdirSync(paths.frontend,{recursive:true});
const indexPath = path.join(paths.frontend,'index.html');
fs.writeFileSync(indexPath, html, 'utf8');
logAudit(`Master Index generated with ${files.length} branches`);
console.log(`Master Index created: ${indexPath}`);