#!/usr/bin/env node
/*
 Temple REST API for Living Dashboard (Option 1)
 - Read-only endpoints exposing quantum and dashboard data
 - CORS enabled, basic rate limiting, audit logging
*/

// Best-effort .env loading (optional)
try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('node:fs');
const path = require('node:path');
const { paths } = require('./config');
const { logAudit } = require('./utils/audit');

const app = express();
const PORT = Number.parseInt(process.env.TEMPLE_API_PORT || '3333', 10);
const EXTERNAL_ENABLED = ((process.env.TEMPLE_API_EXTERNAL || '').toLowerCase() === 'enabled');
const API_KEY = process.env.TEMPLE_API_KEY;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

// Optional API key guard for Layer 2 access (disabled by default).
// Enable by setting TEMPLE_API_EXTERNAL=enabled and TEMPLE_API_KEY to a secure random value.
if (EXTERNAL_ENABLED) {
  app.use((req, res, next) => {
    const provided = req.headers['x-temple-api-key'];
    if (!API_KEY || provided !== API_KEY) {
      auditReq(req, 'unauthorized');
      return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
    }
    next();
  });
}

function safeReadJson(filePath, defVal) {
  try {
    if (!fs.existsSync(filePath)) return defVal;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defVal;
  }
}

function tailLines(filePath, numLines) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const txt = fs.readFileSync(filePath, 'utf8');
    const lines = txt.split(/\r?\n/).filter(Boolean);
    return lines.slice(-numLines);
  } catch (err) {
    return [];
  }
}

function auditReq(req, msg) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  logAudit(`[API] ${req.method} ${req.originalUrl} from ${ip} :: ${msg}`);
}

// Health
app.get('/api/health', (req, res) => {
  auditReq(req, 'health');
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Quantum latest
app.get('/api/quantum/latest', (req, res) => {
  const file = path.join(paths.base, 'quantum', 'qiskit_telemetry.json');
  const hist = safeReadJson(file, []);
  const latest = hist.length ? hist[hist.length - 1] : null;
  auditReq(req, `quantum latest ${latest ? 'ok' : 'empty'}`);
  if (!latest) return res.status(204).send();
  res.json(latest);
});

// Quantum history
app.get('/api/quantum/history', (req, res) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit || '25', 10)));
  const file = path.join(paths.base, 'quantum', 'qiskit_telemetry.json');
  const hist = safeReadJson(file, []);
  const slice = hist.slice(-limit);
  auditReq(req, `quantum history count=${slice.length}`);
  res.json(slice);
});

// Dashboard overlay (recent pulses)
app.get('/api/dashboard/overlay', (req, res) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit || '25', 10)));
  const overlay = safeReadJson(paths.overlay, []);
  const slice = overlay.slice(-limit);
  auditReq(req, `overlay count=${slice.length}`);
  res.json(slice);
});

// Dashboard summary
app.get('/api/dashboard/summary', (req, res) => {
  const file = path.join(paths.monitoring, 'dashboard_summary.json');
  const data = safeReadJson(file, {});
  auditReq(req, 'summary');
  res.json(data);
});

// Q-stream latest
app.get('/api/qstream/latest', (req, res) => {
  const qstream = safeReadJson(paths.qstream, []);
  const latest = qstream.length ? qstream[qstream.length - 1] : null;
  auditReq(req, `qstream latest ${latest ? 'ok' : 'empty'}`);
  if (!latest) return res.status(204).send();
  res.json(latest);
});

// Audit recent
app.get('/api/audit/recent', (req, res) => {
  const lines = Math.max(1, Math.min(200, Number.parseInt(req.query.lines || '50', 10)));
  // Prefer root-level audit if present, else scripts-level
  const rootAudit = path.join(paths.base, 'Council_Audit_Log.txt');
  const scriptsAudit = path.join(__dirname, 'Council_Audit_Log.txt');
  const picked = fs.existsSync(rootAudit) ? rootAudit : scriptsAudit;
  const recent = tailLines(picked, lines);
  auditReq(req, `audit tail=${recent.length}`);
  res.json({ file: picked, lines: recent.length, recent });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API error:', err);
  auditReq(req, `error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Bind explicitly to loopback to preserve Layer 1 purity and avoid accidental external exposure
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Temple API listening on http://127.0.0.1:${PORT}`);
  logAudit(`[API] started on 127.0.0.1:${PORT}`);
});

// Surface listen errors to console and audit for easier diagnosis
server.on('error', (err) => {
  const msg = (err && err.message) ? err.message : String(err);
  console.error('Temple API listen error:', msg);
  try { logAudit(`[API] listen error: ${msg}`); } catch {}
});
