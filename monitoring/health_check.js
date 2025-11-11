const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const path = require('path');

const config = {
  metricsUrl: process.env.METRICS_URL || 'http://localhost:4000/metrics',
  trackerUrl: process.env.TRACKER_URL || 'http://localhost:8080/stripe_scaffold_tracker.html',
  codicesUrl: process.env.CODICES_URL || 'http://localhost:4100/api/codices',
  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4100/',
  releaseUrl: process.env.RELEASE_URL || 'https://github.com/DonBishop913/temple/releases/tag/vcodex-1176',
  // interval between checks (ms)
  intervalMs: Number.parseInt(process.env.MONITOR_INTERVAL_MS || '300000', 10), // default 5 minutes
  // optional token for authenticated endpoints (set via env for security)
  dashboardToken: process.env.MONITOR_DASHBOARD_TOKEN || 'XgbiDhVdByjtHHxrwHHwdERczn8',
  // summary interval (ms) — default 1 hour
  summaryIntervalMs: Number.parseInt(process.env.SUMMARY_INTERVAL_MS || String(60 * 60 * 1000), 10),
  // silent mode: when true the monitor writes only to files and does not print normal checks/summaries to stdout
  silent: process.env.MONITOR_SILENT !== 'false',
  logFile: process.env.MONITOR_LOG || path.join('monitoring', 'health_log.txt'),
  summaryFile: process.env.MONITOR_SUMMARY || path.join('monitoring', 'summary.txt')
};

// in-memory recent results for summary calculations
const recent = [];

function now() { return new Date().toISOString(); }

function httpGet(url, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const start = Date.now();
      const req = lib.get(u, (res) => {
        // drain body
        res.on('data', () => {});
        res.on('end', () => {
          const duration = Date.now() - start;
          resolve({ ok: true, status: res.statusCode, duration });
        });
      });
      req.on('error', (e) => resolve({ ok: false, error: e.message }));
      req.setTimeout(timeout, () => {
        req.abort();
        resolve({ ok: false, error: 'timeout' });
      });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

function httpGetWithHeaders(url, headers = {}, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const options = { method: 'GET', headers, hostname: u.hostname, port: u.port, path: u.pathname + (u.search || '') };
      const start = Date.now();
      const req = lib.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          const duration = Date.now() - start;
          resolve({ ok: true, status: res.statusCode, duration });
        });
      });
      req.on('error', (e) => resolve({ ok: false, error: e.message }));
      req.setTimeout(timeout, () => {
        req.abort();
        resolve({ ok: false, error: 'timeout' });
      });
      req.end();
    } catch (e) { resolve({ ok: false, error: e.message }); }
  });
}

async function checkAll() {
  const checks = [
    ['metrics', config.metricsUrl],
    ['tracker', config.trackerUrl],
    ['codices', config.codicesUrl],
    ['dashboard', config.dashboardUrl],
    ['release', config.releaseUrl]
  ];

  const results = [];
  for (const [name, url] of checks) {
    // For dashboard: attach token as query param so UI preview works
    // For codices: prefer header-based auth (do not change URL) to avoid 404s
    let finalUrl = url;
    if (name === 'dashboard') {
      try {
        const u = new URL(url);
        if (!u.searchParams.get('token') && config.dashboardToken) u.searchParams.set('token', config.dashboardToken);
        finalUrl = u.toString();
      } catch (e) { finalUrl = url; }
    }
    let r;
    if (name === 'codices') {
      r = await httpGetWithHeaders(finalUrl, { Authorization: `Bearer ${config.dashboardToken}` });
      if (!r.ok && r.status === 401) {
        // expected/auth-protected — keep as 401 for special handling below
      } else if (!r.ok) {
        // if header method fails unexpectedly, try simple GET as fallback
        r = await httpGet(finalUrl);
      }
    } else {
      r = await httpGet(finalUrl);
    }
    results.push({ name, url: finalUrl, originalUrl: url, ...r });
  }

  const lines = [];
  lines.push(`${now()} MONITOR CHECK`);
  for (const r of results) {
    // treat 401 on protected endpoints as AUTH_REQUIRED (not a system failure)
    if (!r.ok && r.status === 401 && (r.name === 'codices' || r.name === 'dashboard')) {
      lines.push(`${r.name} ${r.url} -> ${r.status} (AUTH_REQUIRED)`);
      recent.push({ ts: Date.now(), name: r.name, ok: true, authRequired: true, status: r.status, duration: r.duration || 0 });
    } else if (r.ok) {
      lines.push(`${r.name} ${r.url} -> ${r.status} (${r.duration}ms)`);
      recent.push({ ts: Date.now(), name: r.name, ok: true, status: r.status || 0, duration: r.duration || 0 });
    } else {
      lines.push(`${r.name} ${r.url} -> ERROR ${r.error}`);
      recent.push({ ts: Date.now(), name: r.name, ok: false, status: r.status || 0, error: r.error || null });
    }
    if (recent.length > 5000) recent.splice(0, recent.length - 5000);
  }
  const out = lines.join('\n') + '\n\n';
  // write to file always; only print to console when not silent
  try { fs.appendFileSync(config.logFile, out); } catch (e) { console.error('Failed to write log:', e.message); }
  if (!config.silent) console.log(out);
}

let stopped = false;

async function loop() {
  while (!stopped) {
    try { await checkAll(); } catch (e) { console.error('checkAll failed:', e); }
    await new Promise((r) => setTimeout(r, config.intervalMs));
  }
}

// periodic summary writer
function writeSummary() {
  const nowTs = Date.now();
  const windowStart = nowTs - config.summaryIntervalMs;
  const window = recent.filter(r => r.ts >= windowStart);
  const byName = {};
  for (const r of window) {
    const s = byName[r.name] || { checks: 0, failures: 0, totalMs: 0 };
    s.checks += 1;
    if (!r.ok) s.failures += 1;
    s.totalMs += r.duration || 0;
    byName[r.name] = s;
  }
  const lines = [`${new Date().toISOString()} SUMMARY (${Math.round(config.summaryIntervalMs/1000)}s)`];
  for (const [name, s] of Object.entries(byName)) {
    const avg = s.checks ? Math.round(s.totalMs / s.checks) : 0;
    lines.push(`${name}: checks=${s.checks} failures=${s.failures} avg_ms=${avg}`);
  }
  if (Object.keys(byName).length === 0) lines.push('No checks in window');
  const out = lines.join('\n') + '\n\n';
  try { fs.appendFileSync(config.summaryFile, out); } catch (e) { console.error('Failed to write summary:', e.message); }
  if (!config.silent) console.log(out);
}

// schedule periodic summaries
setInterval(writeSummary, config.summaryIntervalMs);

process.on('SIGINT', () => {
  console.log('Monitor received SIGINT — shutting down gracefully.');
  stopped = true;
});

(async () => {
  console.log(`Starting monitor. Interval: ${config.intervalMs}ms. Logging to ${config.logFile}`);
  try { fs.mkdirSync(path.dirname(config.logFile), { recursive: true }); } catch (e) {}
  await loop();
  console.log('Monitor stopped.');
})();
