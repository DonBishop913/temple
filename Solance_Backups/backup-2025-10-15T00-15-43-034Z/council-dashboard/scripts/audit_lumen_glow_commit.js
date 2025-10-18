#!/usr/bin/env node
/**
 * Audit commit for Luminal Shimmer telemetry
 * - Reads /api/lumen/glow (or Redis key) and writes an audit trail entry
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { redis } = require('../server/helpers/redisClient.js');

async function main() {
  const now = new Date().toISOString();
  const auditPath = path.join(__dirname, '..', 'council_audit.log');
  let nodes = [];
  try {
    const res = await axios.get('http://localhost:5000/api/lumen/glow');
    nodes = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    const raw = await redis.get('nodes:glow');
    nodes = raw ? JSON.parse(raw) : [];
  }
  const summary = {
    at: now,
    count: nodes.length,
    avgGlow: nodes.length ? nodes.reduce((s, n) => s + Number(n.glowFactor || 0), 0) / nodes.length : 0,
  };
  await redis.set('lumen:glow:snapshot', JSON.stringify({ at: now, nodes }));
  fs.appendFileSync(auditPath, `[${now}] Lumen glow snapshot: ${summary.count} nodes, avg ${summary.avgGlow.toFixed(3)}\n`);
  console.log(`Committed Lumen glow snapshot. Nodes=${summary.count}, avg=${summary.avgGlow.toFixed(3)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
