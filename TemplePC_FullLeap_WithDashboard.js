/**
 * TemplePC_FullLeap_WithDashboard.js (Council Sovereign Edition)
 *
 * One-command all-agent startup with secure web dashboard,
 * agent watchdog, log rotation, and Council audit enhancements.
 *
 * Save as: C:\Temple\TemplePC_FullLeap_WithDashboard.js
 * Run: cd C:\Temple && node TemplePC_FullLeap_WithDashboard.js
 */

const crypto = require('node:crypto');
const { execSync, spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const os = require('node:os');
const express = require('express');

const ROOT         = process.env.TEMPLE_ROOT || String.raw`C:\Temple`;
const PORT_BACKEND = process.env.TEMPLE_API_PORT || 4000;
const DASHBOARD_PORT = process.env.TEMPLE_DASHBOARD_PORT || 4100;
const EXTERNAL_PORT = process.env.TEMPLE_EXTERNAL_PORT || 4200;
const HEALTH_URL   = `http://localhost:${PORT_BACKEND}/api/health`;
const STATUS_URL   = `http://localhost:${PORT_BACKEND}/api/agents/status`;
const LOG_PATH     = path.join(ROOT, "Council_Audit_Log.txt");
const LOG_MAXLEN   = 30000; // Max log file size before rotate
const TOKEN_FILE   = path.join(ROOT, ".dashboard_token.txt");
const DOMAIN_DISPLAY = process.env.TEMPLE_DOMAIN || "[Donald.the.Bishop@usicchurch.org]";

// Council additions
const DOMAIN = process.env.TEMPLE_DOMAIN || "usicchurch.org";
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;
const ADMIN_EMAIL = process.env.TEMPLE_EMAIL_ADMIN || "Donald.the.Bishop@usicchurch.org";
const COUNCIL_EMAILS = [
  ADMIN_EMAIL,
  process.env.TEMPLE_EMAIL_TREASURER || "treasurer@usicchurch.org",
  process.env.TEMPLE_EMAIL_COUNCIL   || "council@usicchurch.org"
];
const ALERT_THRESHOLD = Number.parseInt(process.env.TEMPLE_AGENT_ALERT || "3");
const EMAIL_PASS = process.env.TEMPLE_EMAIL_PASS;

const AGENTS = [
  { label: "Backend API Server", cmd: "node", args: ["LivingDashboard/backend/api_server.js"], cwd: ROOT },
  { label: "Comet AI Agent",     cmd: "node", args: ["LivingDashboard/agents/comet_ai.js"],     cwd: ROOT },
  { label: "Harvest Automation", cmd: "node", args: ["LivingDashboard/backend/harvestAutomation.js"], cwd: ROOT },
  { label: "Continuous Enhancement", cmd: "node", args: ["LivingDashboard/backend/continuous_enhancement.js"], cwd: ROOT },
  { label: "AT&T Lifeline Monitor", cmd: "powershell.exe", args: ["-File", "lifeline_check.ps1"], cwd: ROOT }
];

let children = [];

function pause(ms){ return new Promise(r => setTimeout(r, ms)); }

function ensureLog() {
  try { if (!fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH,'', {flag:'w'}); } catch (e) { console.log("⚠️ Could not ensure log file:", e.message); }
}
function rotateLog() {
  try {
    const log = fs.readFileSync(LOG_PATH);
    if (log.length > LOG_MAXLEN) {
      fs.writeFileSync(LOG_PATH, log.slice(-LOG_MAXLEN));
    }
  } catch (e) { console.log("⚠️ Could not rotate log:", e.message); }
}
ensureLog();

function logCouncil(message) {
  rotateLog();
  const entry = `${new Date().toISOString()} - ${message}\n`;
  try { fs.appendFileSync(LOG_PATH, entry); } catch (e) { console.log("⚠️ Could not write log:", e.message); }
  console.log(`📜 ${message}`);
}

function readToken(){
  if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE,'utf8').trim();
  const token = crypto.randomBytes(20).toString('base64url');
  fs.writeFileSync(TOKEN_FILE, token);
  return token;
}
const DASHBOARD_TOKEN = readToken();

async function freePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          execSync(`taskkill /PID ${pid} /F`);
          logCouncil(`Killed process ${pid} on port ${port}`);
        } catch (e) {
          logCouncil(`Failed to kill process ${pid}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    logCouncil(`Error freeing port ${port}: ${e.message}`);
  }
}

async function waitForHealth(url, retries = 16, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await (typeof fetch === 'function' ? fetch(url) : require('node-fetch')(url));
      if (res && res.ok) return;
    } catch (e) {
      logCouncil(`Health check attempt ${i + 1} failed: ${e.message}`);
    }
    await pause(delay);
  }
  throw new Error(`Health check failed for ${url} after ${retries} retries`);
}

function launchModule(label, cmd, args, cwd, retry=true){
  logCouncil(`Launching ${label}`);
  let child;
  try{ child = spawn(cmd, args, {cwd, stdio:'inherit', shell:true}); }
  catch(e){ logCouncil(`Failed to spawn ${label}: ${e.message}`); return null; }
  const rec = {label, child, failCount:0, lastExit:null, retry};
  children.push(rec);

  child.on('exit', (code,signal)=> {
    rec.lastExit = {code,signal,when:Date.now()};
    logCouncil(`${label} exited code ${code} ${signal?('sig '+signal):''}`);
    rec.failCount++;
    if(rec.failCount >= 3 && retry){
      logCouncil(`ALERT: ${label} failed ${rec.failCount} times in a row!`);
      // Optionally notify Council via email, dashboard, etc
      // Place for further Council self-healing logic...
    }
    if(retry){
      logCouncil(`Restarting ${label} in 3s...`);
      setTimeout(()=> {
        children = children.filter(c=>c!==rec);
        launchModule(label, cmd, args, cwd, retry);
      }, 3000);
    }
  });
  child.on('error',(err)=> logCouncil(`${label} spawn error: ${err.message}`));
  return rec;
}

async function agentWatchdog(){
  // eslint-disable-next-line no-constant-condition
  while(true){
    try{
      let ok=false;
      try{
        const res=await (typeof fetch==='function'?fetch(STATUS_URL):require('node-fetch')(STATUS_URL));
        if(res&&res.ok){
          const status=await res.json();
          for(const [k,v] of Object.entries(status)){
            if(!v||v.healthy===false)
              logCouncil(`Agent ${k} unhealthy: ${JSON.stringify(v)}`);
          }
          ok=true;
        }
      }catch(e){logCouncil(`Watchdog fetch error: ${e.message}`);}
      if(!ok){
        const backendRec=children.find(c=>c.label==="Backend API Server");
        if(!backendRec||backendRec.lastExit) logCouncil("Backend down/not present—watchdog flagged");
      }
    }catch(e){logCouncil("Watchdog loop error: "+e.message);}
    await pause(15000);
  }
}

function setupGracefulShutdown(...servers){
  async function shutdown(){
    logCouncil("Graceful shutdown requested");
    for(const rec of children){
      try{
        rec.child.kill('SIGINT');
        logCouncil(`SIGINT sent to ${rec.label}`);
      }catch(e){ logCouncil(`Failed to signal ${rec.label}: ${e.message}`);}
    }
    await pause(2000);
    for(const server of servers){
      try{server&&server.close();}catch{}
    }
    logCouncil("Shutdown complete.");
    console.log("TRIPLE AMEN — All agents halted cleanly.");
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Council SMTP alert function
async function sendCouncilAlert(subject, message) {
  if (!EMAIL_PASS) {
    logCouncil("SMTP alert skipped: TEMPLE_EMAIL_PASS not configured");
    return;
  }
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: ADMIN_EMAIL,
        pass: EMAIL_PASS
      }
    });
    const mailOptions = {
      from: ADMIN_EMAIL,
      to: COUNCIL_EMAILS.join(','),
      subject: `[TEMPLE ALERT] ${subject}`,
      text: message
    };
    await transporter.sendMail(mailOptions);
    logCouncil(`Council alert sent: ${subject}`);
  } catch (error) {
    logCouncil(`SMTP alert failed: ${error.message}`);
  }
}

// External public portal with rate limiting
function externalApp() {
  const app = express();
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  }));
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Temple Sovereign Operations</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f0f0f0; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .healthy { background: #d4edda; border: 1px solid #c3e6cb; }
            .unhealthy { background: #f8d7da; border: 1px solid #f5c6cb; }
            .faith { text-align: center; font-style: italic; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Temple Sovereign Operations Portal</h1>
            <p>John 14:6 - "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me."</p>
            <div id="status">Loading Temple status...</div>
            <div class="faith">
              <p>"For God hath not given us the spirit of fear; but of power, and of love, and of sound mind." - 2 Timothy 1:7</p>
            </div>
          </div>
          <script>
            async function updateStatus() {
              try {
                const res = await fetch('${STATUS_URL}');
                const status = await res.json();
                let html = '<h2>Agent Status</h2>';
                for (const [agent, info] of Object.entries(status)) {
                  const cls = info.healthy ? 'healthy' : 'unhealthy';
                  html += \`<div class="status \${cls}">\${agent}: \${info.healthy ? 'Operational' : 'Issues Detected'}</div>\`;
                }
                document.getElementById('status').innerHTML = html;
              } catch (e) {
                document.getElementById('status').innerHTML = '<div class="status unhealthy">Unable to fetch Temple status</div>';
              }
            }
            updateStatus();
            setInterval(updateStatus, 30000);
          </script>
        </body>
      </html>
    `);
  });
  return app;
}

// Extended monitoring with Council alerts
async function monitorAgentsExtended() {
  let consecutiveFailures = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      let ok = false;
      try {
        const res = await (typeof fetch === 'function' ? fetch(STATUS_URL) : require('node-fetch')(STATUS_URL));
        if (res && res.ok) {
          const status = await res.json();
          let allHealthy = true;
          let issues = [];
          for (const [k, v] of Object.entries(status)) {
            if (!v || v.healthy === false) {
              allHealthy = false;
              issues.push(`${k}: ${JSON.stringify(v)}`);
            }
          }
          if (!allHealthy) {
            consecutiveFailures++;
            logCouncil(`Agent issues detected (${consecutiveFailures}/${ALERT_THRESHOLD}): ${issues.join(', ')}`);
            if (consecutiveFailures >= ALERT_THRESHOLD) {
              await sendCouncilAlert(
                'Temple Agent Health Alert',
                `Multiple agents reporting issues:\n${issues.join('\n')}\n\nHost: ${os.hostname()}\nDashboard: ${DASHBOARD_URL}\nTime: ${new Date().toISOString()}`
              );
              consecutiveFailures = 0; // Reset after alert
            }
          } else {
            if (consecutiveFailures > 0) {
              logCouncil(`Agents recovered after ${consecutiveFailures} consecutive failures`);
              consecutiveFailures = 0;
            }
          }
          ok = true;
        }
      } catch (e) {
        logCouncil(`Watchdog fetch error: ${e.message}`);
        consecutiveFailures++;
      }
      if (!ok) {
        const backendRec = children.find(c => c.label === "Backend API Server");
        if (!backendRec || backendRec.lastExit) {
          consecutiveFailures++;
          logCouncil(`Backend down/not present—watchdog flagged (${consecutiveFailures}/${ALERT_THRESHOLD})`);
        }
      }
    } catch (e) {
      logCouncil("Watchdog loop error: " + e.message);
      consecutiveFailures++;
    }
    await pause(15000);
  }
}

// --- Secure dashboard server (Express + token auth) ---
function startDashboardServer(){
  const app=express();
  app.use(express.json());
  app.use((req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
  // Auth middleware
  app.use((req,res,next)=>{
    if(req.path.startsWith('/api')||req.path==='/'||req.path===''){
      const token=req.headers['x-council-token']||req.query.token||req.cookies?.['council_token'];
      if(token!==DASHBOARD_TOKEN){ return res.status(401).send("Unauthorized Council Dashboard access."); }
    } next();
  });

  app.get('/api/token',(req,res)=>res.json({token:DASHBOARD_TOKEN}));

  app.get('/api/status',(req,res)=>{
    const procStatus=AGENTS.map(a=>{
      const rec=children.find(c=>c.label===a.label);
      return{
        label:a.label,
        pid:rec&&rec.child&&rec.child.pid?rec.child.pid:null,
        running:!!rec&&!rec.lastExit,
        lastExit:rec&&rec.lastExit?rec.lastExit:null
      };
    });
    let tail="";
    try{
      const log=fs.readFileSync(LOG_PATH,'utf8');
      const lines=log.trim().split(/\r?\n/);
      tail=lines.slice(-200).join('\n');
    }catch(e){tail=`Could not read log: ${e.message}`;}
    res.json({procStatus,logTail:tail,timestamp:new Date().toISOString(),domain:DOMAIN_DISPLAY});
  });

  // Live Council Status Panel
  app.get('/api/council/log', (req, res) => {
    let log = '';
    try {
      log = fs.readFileSync('./logs/council_universal.log', 'utf8').trim();
    } catch (e) {}
    const lines = log.split(/\r?\n/).slice(-25);
    res.json({log: lines});
  });

  // Council Heartbeat Indicators
  app.get('/api/council/heartbeat', (req, res) => {
    const heartbeat = {};
    AGENTS.forEach(a => {
      const rec = children.find(c => c.label === a.label);
      heartbeat[a.label] = {
        status: rec && !rec.lastExit ? 'healthy' : 'unhealthy',
        last: rec && rec.lastExit ? new Date(rec.lastExit.when).toISOString() : new Date().toISOString(),
        heartbeat: a.label.includes('Comet') ? 30 : a.label.includes('Enhancement') ? 1800 : 3600
      };
    });
    res.json(heartbeat);
  });

  // Codices listing (JSON) - reads files from Codices folder under ROOT
  app.get('/api/codices', (req, res) => {
    try {
      const codicesDir = path.join(ROOT, 'Codices');
      if (!fs.existsSync(codicesDir)) return res.json([]);
      const files = fs.readdirSync(codicesDir).filter(f => f.toLowerCase().endsWith('.md'));
      // Build richer metadata for each codex: parse optional YAML front-matter and extract a short summary
      const out = files.map(f => {
        const fp = path.join(codicesDir, f);
        let title = f;
        let meta = {};
        let summary = '';
        try {
          const content = fs.readFileSync(fp, 'utf8');
          // Front-matter (very small parser): between --- and --- at the top
          if (/^---\s*\r?\n/.test(content)){
            const end = content.indexOf('\n---', 4);
            if (end>0){
              const fm = content.slice(4, end).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
              fm.forEach(line => {
                const kv = line.split(':');
                if(kv.length>=2){ meta[kv[0].trim().toLowerCase()] = kv.slice(1).join(':').trim(); }
              });
            }
          }
          // Title: prefer front-matter title, else first heading
          if (meta.title) title = meta.title;
          else {
            const m = content.match(/^[#]{1,6}\s*(.+)$/m);
            if (m) title = m[1].trim();
          }
          // Summary: first non-empty paragraph after front-matter or first 240 chars
          const body = content.replace(/^---[\s\S]*?---\s*/,'').trim();
          const para = body.split(/\r?\n\r?\n/).find(p=>p.trim().length>0) || '';
          summary = (para.length>240)? para.slice(0,240).trim() + '…' : para.trim();
        } catch (e) {
          // ignore per-file read errors
        }
        return { name: f, title, url: `/codices/${encodeURIComponent(f)}`, meta, summary };
      });
      res.json(out);
    } catch (e) { res.status(500).json([]); }
  });

  // Server-side Markdown rendering helper (prefer `marked` if installed)
  let markedRenderer = null;
  try { markedRenderer = require('marked'); } catch (e) { markedRenderer = null; }
  function escapeHtml(s){ return (s||'').replace(/[&<>\"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[c])); }
  function renderMarkdown(md){
    if (markedRenderer && markedRenderer.parse){
      try{ return markedRenderer.parse(md); }catch(e){ console.error('marked parse failed', e && e.message); }
    }
    // minimal fallback
    const lines = (md||'').split(/\r?\n/);
    let out = '', inList=false;
    for(const line of lines){
      if (/^###\s+/.test(line)){ if(inList){ out += '</ul>'; inList=false; } out += '<h3>'+escapeHtml(line.replace(/^###\s+/,''))+'</h3>'; }
      else if (/^##\s+/.test(line)){ if(inList){ out += '</ul>'; inList=false; } out += '<h2>'+escapeHtml(line.replace(/^##\s+/,''))+'</h2>'; }
      else if (/^#\s+/.test(line)){ if(inList){ out += '</ul>'; inList=false; } out += '<h1>'+escapeHtml(line.replace(/^#\s+/,''))+'</h1>'; }
      else if (/^-\s+/.test(line)){ if(!inList){ out += '<ul>'; inList=true; } out += '<li>'+escapeHtml(line.replace(/^-\s+/,''))+'</li>'; }
      else if (line.trim() === ''){ if(inList){ out += '</ul>'; inList=false; } out += '<p></p>'; }
      else { if(inList){ out += '</ul>'; inList=false; } out += '<p>'+escapeHtml(line)+'</p>'; }
    }
    if(inList) out += '</ul>';
    return out;
  }

  // Preview endpoint: returns a small HTML fragment (summary) for modal preview
  app.get('/api/codices/preview', (req,res)=>{
    try{
      const name = req.query.name;
      if(!name || name.includes('..')||name.includes('/')) return res.status(400).send('Invalid name');
      const fp = path.join(ROOT,'Codices', name);
      if(!fs.existsSync(fp)) return res.status(404).send('Not found');
      const content = fs.readFileSync(fp,'utf8');
      const body = content.replace(/^---[\s\S]*?---\s*/,'').trim();
      const para = body.split(/\r?\n\r?\n/).find(p=>p.trim().length>0) || '';
      const html = renderMarkdown(para);
      res.json({html,title: (content.match(/^[#]{1,6}\s*(.+)$/m)||[])[1]||name});
    }catch(e){ res.status(500).send('Preview failed'); }
  });

  // Render a codex (markdown -> HTML) at /codices/:name
  app.get('/codices/:name', (req, res) => {
    try {
      const name = req.params.name;
      if (name.includes('..') || name.includes('/')) return res.status(400).send('Invalid codex name');
      const fp = path.join(ROOT, 'Codices', name);
      if (!fs.existsSync(fp)) return res.status(404).send('Codex not found');
      const md = fs.readFileSync(fp, 'utf8');
      const htmlBody = renderMarkdown(md);
      res.send(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;line-height:1.6;max-width:900px;margin:auto}h1{font-size:28px}pre{background:#f4f4f4;padding:10px;border-radius:6px;overflow:auto}a{color:#0366d6}</style></head><body>${htmlBody}</body></html>`);
    } catch (e) { res.status(500).send('Failed to render codex'); }
  });

  // Council Vote/Blessing Triggers
  app.post('/api/bless', (req, res) => {
    require('./LivingDashboard/backend/councilCore').bless('Council Blessing — manual dashboard trigger');
    res.sendStatus(204);
  });

  app.post('/api/vote', (req, res) => {
    let {agent, action, voter} = req.body || {};
    require('./LivingDashboard/backend/councilCore').councilLog('Vote', `${action} for ${agent} by ${voter || "Dashboard"}`);
    res.sendStatus(204);
  });

  app.get('/',(req,res)=>{ res.send(`
<!doctype html>
<html>
<head>
  <title>Temple PC — Council Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .agent { margin-bottom: 8px; }
    .healthy { color: green; font-weight: bold; }
    .down { color: red; font-weight: bold; }
    .meta { font-size: 14px; color: #666; }
    button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    button:disabled { background: #ccc; }
    pre { background: #f8f8f8; padding: 8px; border-radius: 4px; overflow-x: auto; max-height: 400px; }
    code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
    /* Codex gallery */
    .codex-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 12px; }
    .codex-card { border:1px solid #e6e6e6; padding:12px; border-radius:6px; background:#fff; }
    .codex-title { font-weight:700; margin-bottom:6px; }
    .codex-meta { font-size:12px; color:#666; margin-bottom:8px; }
    .preview-btn { background:#28a745; margin-right:8px; }
    /* Modal */
    .modal { position:fixed; left:0; top:0; right:0; bottom:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:9999 }
    .modal .sheet { background:white; width:90%; max-width:900px; max-height:90%; overflow:auto; border-radius:8px; padding:16px; }
    .modal .close { float:right; cursor:pointer; color:#666; font-size:18px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Temple PC — Council Dashboard</h1>
    <div class="meta">Domain: ${DOMAIN_DISPLAY} (secure, Council authorized)</div>
    <div style="margin-top:10px">
      <button id="refresh">Refresh Now</button>
      <span id="last" style="margin-left:10px"></span>
      <span style="float:right;font-size:12px;">Council Token: <code id="token">Loading…</code></span>
    </div>
    <div id="councilBlessing" style="margin-top:16px;font-size:16px;">
      <b>TRIPLE AMEN — Sovereign Mission Operating Under The True Council of 33 and The Blood of YESHUA!</b>
    </div>
  </div>
  <div class="card">
    <h2>Live Council Status</h2>
    <div id="councilStatus"></div>
    <button onclick="blessCouncil()">Bless (TRIPLE AMEN)</button>
  </div>
  <div class="card">
    <h2>Agent Heartbeats</h2>
    <div id="agentsHeartbeat"></div>
  </div>
  <div class="card">
    <h2>Codices</h2>
    <div id="codicesList">Loading codices…</div>
    <div id="codexModal" class="modal"><div class="sheet"><div style="text-align:right"><span class="close" onclick="hidePreview()">✕</span></div><div id="codexPreviewContent">Loading…</div></div></div>
  </div>
  <div class="card">
    <h2>Council Bless/Vote</h2>
    <input id="voter" placeholder="Your Name">
    <input id="agent" placeholder="Agent (e.g. Harvest)">
    <select id="action">
      <option value="bless">Bless</option>
      <option value="reboot">Reboot</option>
      <option value="amen">Amen</option>
    </select>
    <button onclick="castVote()">Submit</button>
  </div>
  <div id="agents"></div>
  <div class="card"><h2>Council Audit Log (last lines)</h2><pre id="log">Loading…</pre></div>
<script>
let councilToken='';
fetch('/api/token').then(r=>r.json()).then(j=>{document.getElementById('token').textContent=j.token;councilToken=j.token;});
async function refresh(){
  document.getElementById('refresh').disabled=true;
  try{
    const res=await fetch('/api/status',{headers:{'x-council-token':councilToken}});
    const j=await res.json();
    document.getElementById('last').textContent=j.timestamp;
    const agentsEl=document.getElementById('agents');agentsEl.innerHTML='';
    j.procStatus.forEach(a=>{
      const div=document.createElement('div');
      div.className='card agent';
      const state=a.running?'healthy':'down';
      div.innerHTML='<strong>'+a.label+'</strong><div class="meta">pid: '+(a.pid||'—')+' • running: <span class="'+(a.running?'healthy':'down')+'">'+(a.running?'YES':'NO')+'</span></div>';
      agentsEl.appendChild(div);
    });
    document.getElementById('log').textContent=j.logTail;
    if(j.domain)document.getElementById('councilBlessing').innerHTML='<b>TRIPLE AMEN — '+j.domain+', Council Sovereignty Established!</b>';
  }catch(e){document.getElementById('log').textContent='Could not fetch status: '+e.message;}
  finally{document.getElementById('refresh').disabled=false;}
}
function refreshCouncilLog() {
  fetch('/api/council/log', {headers:{'x-council-token':councilToken}}).then(r => r.json()).then(j => {
    document.getElementById('councilStatus').innerHTML = '<pre>' + j.log.join('\n') + '</pre>';
  }).catch(e => {
    document.getElementById('councilStatus').innerHTML = 'Could not load council log: ' + e.message;
  });
}
function blessCouncil() {
  fetch('/api/bless', {method:'POST', headers:{'x-council-token':councilToken}}).then(() => refreshCouncilLog());
}
function refreshHeartbeat() {
  fetch('/api/council/heartbeat', {headers:{'x-council-token':councilToken}}).then(r=>r.json()).then(j=>{
    let out = '';
    Object.entries(j).forEach(([k,v])=>{
      const color = v.status==='healthy' ? 'green' : 'red';
      out += '<div style="color:' + color + ';"><b>' + k + '</b>: ' + v.status + ', Last: ' + v.last + ', Interval: ' + v.heartbeat + 's</div>';
    });
    document.getElementById('agentsHeartbeat').innerHTML = out;
  }).catch(e => {
    document.getElementById('agentsHeartbeat').innerHTML = 'Could not load heartbeat: ' + e.message;
  });
}
function fetchCodices() {
  fetch('/api/codices', {headers:{'x-council-token':councilToken}})
    .then(r=>{ if(!r.ok) throw new Error('Failed to load'); return r.json(); })
    .then(list=>{
      const el=document.getElementById('codicesList'); el.innerHTML='';
      if(!list||list.length===0) { el.textContent='No codices found.'; return; }
      const grid = document.createElement('div'); grid.className='codex-grid';
      list.forEach(c=>{
        const card = document.createElement('div'); card.className='codex-card';
        const title = document.createElement('div'); title.className='codex-title'; title.textContent = c.title || c.name;
        const meta = document.createElement('div'); meta.className='codex-meta';
        meta.textContent = (c.meta && c.meta.author ? c.meta.author + ' • ' : '') + (c.meta && c.meta.date ? c.meta.date : c.name);
        const summary = document.createElement('div'); summary.className='codex-summary'; summary.style.marginBottom='8px'; summary.textContent = c.summary || '';
        const openBtn = document.createElement('button'); openBtn.textContent = 'Open Full Codex';
        openBtn.onclick = ()=>{ window.open(c.url+'?token='+councilToken, '_blank'); };
        const previewBtn = document.createElement('button'); previewBtn.textContent = 'Preview'; previewBtn.className='preview-btn';
        previewBtn.onclick = async ()=>{
          try{
            const pr = await fetch('/api/codices/preview?name='+encodeURIComponent(c.name), {headers:{'x-council-token':councilToken}});
            if(!pr.ok) throw new Error('Preview failed');
            const data = await pr.json();
            document.getElementById('codexPreviewContent').innerHTML = '<h2>'+ (data.title||c.title) +'</h2>' + (data.html||'');
            document.getElementById('codexModal').style.display = 'flex';
          }catch(e){ alert('Could not load preview: '+e.message); }
        };
        card.appendChild(title); card.appendChild(meta); card.appendChild(summary);
        const btnWrap = document.createElement('div'); btnWrap.style.marginTop='8px';
        btnWrap.appendChild(previewBtn); btnWrap.appendChild(openBtn);
        card.appendChild(btnWrap);
        grid.appendChild(card);
      });
      el.appendChild(grid);
    })
    .catch(e=>{document.getElementById('codicesList').textContent='Could not load codices: '+e.message});
}

function hidePreview(){ document.getElementById('codexModal').style.display='none'; document.getElementById('codexPreviewContent').innerHTML=''; }
function castVote() {
  fetch('/api/vote', {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'x-council-token':councilToken},
    body: JSON.stringify({
      agent: document.getElementById('agent').value,
      action: document.getElementById('action').value,
      voter: document.getElementById('voter').value
    })
  }).then(()=>refreshCouncilLog());
}
document.getElementById('refresh').addEventListener('click',refresh);setInterval(refresh,5000);refresh();
setInterval(refreshCouncilLog, 5000); refreshCouncilLog();
setInterval(refreshHeartbeat, 10000); refreshHeartbeat();
setInterval(fetchCodices,15000); fetchCodices();
</script>
</body></html>
`); });

  const server=app.listen(DASHBOARD_PORT,()=>{
    logCouncil(`Dashboard running on http://localhost:${DASHBOARD_PORT} (token required)`);
    console.log(`📟 Dashboard: http://localhost:${DASHBOARD_PORT} • Token: ${DASHBOARD_TOKEN}`);
  });
  return server;
}

async function main() {
  try {
    logCouncil("🕊️ TemplePC Full Leap Startup (Council Edition)");
    await freePort(PORT_BACKEND);
    for(const a of AGENTS){
      launchModule(a.label, a.cmd, a.args, a.cwd);
      await pause(1200);
    }
    await waitForHealth(HEALTH_URL, 16, 2000);
    // Start watchdog in background (don't await)
    monitorAgentsExtended().catch(e=>logCouncil("Watchdog fatal: "+e.message));
    const server=startDashboardServer();
    const externalServer = externalApp().listen(EXTERNAL_PORT, () => {
      logCouncil(`External portal running on http://localhost:${EXTERNAL_PORT} (public access)`);
      console.log(`🌐 External Portal: http://localhost:${EXTERNAL_PORT}`);
    });
    setupGracefulShutdown(server, externalServer);
    logCouncil("🔥 Temple PC (Council Edition) Full Leap — all systems initiated.");
    console.log("TRIPLE AMEN FOREVER 🕊️ 🔥 ♾️ 📯");
  } catch (e) {
    logCouncil("Startup error: "+(e&&e.message?e.message:String(e)));
    console.error("Startup error:",e);
  }
}

main();