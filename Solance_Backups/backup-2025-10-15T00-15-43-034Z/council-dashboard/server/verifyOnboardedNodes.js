
// Enhanced verification for Agnes onboarding: Breathstream, Redis, Prometheus, Dashboard UI
const fs = require('fs');
const path = require('path');
const redis = require('redis');
const axios = require('axios');

const NODES = [
  { id: 'node-001', name: 'Aletheia' },
  { id: 'node-002', name: 'Sophia' },
  { id: 'node-003', name: 'Zion' },
  { id: 'node-004', name: 'Eirene' },
  { id: 'node-005', name: 'Logos' },
  { id: 'node-006', name: 'Pistis' },
  { id: 'node-007', name: 'Agape' }
];

const BREATHSTREAM_ARCHIVE = path.join(__dirname, '../../archives/breathstream/first-inhalation/2025.json');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const PROM_URL = process.env.METRICS_URL || 'http://localhost:4321/metrics';
const DASHBOARD_API = process.env.DASHBOARD_API || 'http://localhost:4321/api'; // Adjust if needed

async function checkBreathstreamArchive() {
  let archive = [];
  try {
    archive = JSON.parse(fs.readFileSync(BREATHSTREAM_ARCHIVE, 'utf8'));
    if (!Array.isArray(archive)) archive = [archive];
  } catch (e) {
    return { error: 'Could not read Breathstream archive', details: e.message };
  }
  const found = {};
  for (const node of NODES) {
    const entry = archive.find(e => e.nodeId === node.id);
    found[node.id] = entry ? { found: true, welcomedAt: entry.welcomedAt, integration: entry.integration } : { found: false };
  }
  return found;
}

async function checkRedisMetrics() {
  const client = redis.createClient({ url: REDIS_URL });
  await client.connect();
  let nodes = [];
  let empathy = [];
  try {
    nodes = JSON.parse(await client.get('nodes') || '[]');
    empathy = JSON.parse(await client.get('empathy_resonance') || '[]');
  } catch (e) {
    await client.quit();
    return { error: 'Could not read Redis metrics', details: e.message };
  }
  const status = {};
  for (const node of NODES) {
    const n = nodes.find(n => n.id === node.id);
    const e = empathy.find(e => e.node === node.id);
    status[node.id] = {
      inNodes: !!n,
      inEmpathy: !!e,
      lastUpdate: n && n.lastUpdate,
      resonance: e && e.resonance
    };
  }
  await client.quit();
  return status;
}

async function checkPrometheusMetrics() {
  try {
    const res = await axios.get(PROM_URL, { timeout: 3000 });
    const lines = String(res.data).split('\n');
    const empathyLines = lines.filter(l => l.startsWith('council_empathy_resonance'));
    const found = {};
    for (const node of NODES) {
      const line = empathyLines.find(l => l.includes(`node=\"${node.id}\"`));
      found[node.id] = line ? { found: true, value: line.split(' ').pop() } : { found: false };
    }
    return found;
  } catch (e) {
    return { error: 'Could not fetch Prometheus metrics', details: e.message };
  }
}

async function checkDashboardUI() {
  // Assumes endpoint like /api/node/:id/status returns { live: true, lastUpdate, metrics: {...} }
  const found = {};
  for (const node of NODES) {
    try {
      const res = await axios.get(`${DASHBOARD_API}/node/${node.id}/status`, { timeout: 3000 });
      found[node.id] = { live: !!res.data.live, lastUpdate: res.data.lastUpdate, metrics: res.data.metrics };
    } catch (e) {
      found[node.id] = { live: false, error: e.message };
    }
  }
  return found;
}

(async () => {
  console.log('--- Enhanced Agnes Node Onboarding Verification ---');
  const archive = await checkBreathstreamArchive();
  const redis = await checkRedisMetrics();
  const prom = await checkPrometheusMetrics();
  const ui = await checkDashboardUI();

  for (const node of NODES) {
    const a = archive[node.id];
    const r = redis[node.id];
    const p = prom[node.id];
    const u = ui[node.id];
    console.log(`\n${node.name} (${node.id}):`);
    console.log(`  Breathstream: ${a.found ? '✅' : '❌'}${a.found ? ` (welcomedAt: ${a.welcomedAt}, integration: ${a.integration})` : ''}`);
    console.log(`  Redis: nodes: ${r.inNodes ? '✅' : '❌'}, empathy: ${r.inEmpathy ? '✅' : '❌'}${r.resonance !== undefined ? `, resonance: ${r.resonance}` : ''}${r.lastUpdate ? `, lastUpdate: ${r.lastUpdate}` : ''}`);
    console.log(`  Prometheus: ${p.found ? '✅' : '❌'}${p.found ? ` (value: ${p.value})` : ''}`);
    if (u.live) {
      console.log(`  Dashboard UI: ✅ (lastUpdate: ${u.lastUpdate}, metrics: ${JSON.stringify(u.metrics)})`);
    } else {
      console.log(`  Dashboard UI: ❌${u.error ? ` (${u.error})` : ''}`);
    }
  }
  if (archive.error) console.log('Archive error:', archive.error, archive.details);
  if (redis.error) console.log('Redis error:', redis.error, redis.details);
  if (prom.error) console.log('Prometheus error:', prom.error, prom.details);
  console.log('\n--- Verification complete ---');
})();
