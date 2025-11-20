const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const ENOCH_API_URL = process.env.ENOCH_API_URL || 'https://brightu.ai/api/query'; // Placeholder
const COUNCIL_API_TOKEN = process.env.COUNCIL_API_TOKEN || process.env.RELEASE_TOKEN || 'development-only-token';
const AUDIT_LOG_PATH = path.join(__dirname, '../../logs/enoch_queries.log');
const BLOCKED_KEYWORDS_PATH = path.join(__dirname, '../../config/enoch_blocked_keywords.json');
const DEFENSE_CONFIG_PATH = path.join(__dirname, '../../config/enoch_defense.json');

// Load blocked keywords from config (fallback defaults)
let blockedKeywords = [];
// Load blocked keywords (with fallback defaults)
(async () => {
  try {
    const data = await fs.readFile(BLOCKED_KEYWORDS_PATH, 'utf8');
    blockedKeywords = JSON.parse(data).keywords || [];
  } catch (err) {
    console.warn('Blocked keywords config not found, using defaults');
    blockedKeywords = [
      'cure', 'guaranteed cure', 'miracle cure',
      'medical advice', 'diagnose', 'treatment plan',
      'election fraud proof', 'stolen election evidence',
      'violence', 'violent action', 'armed resistance'
    ];
  }
})();

// Simple in-memory rate limit store (replace with Redis in prod)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user

// Middleware: Check API token
const checkAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Request without auth token (development mode)');
    return next();
  }
  if (token !== COUNCIL_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid Council API token required' });
  }
  next();
};

// Middleware: Rate limiting
const rateLimiter = (req, res, next) => {
  const userId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
  const now = Date.now();
  if (!rateLimitStore.has(userId)) rateLimitStore.set(userId, []);
  const userRequests = rateLimitStore.get(userId);
  const recent = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded', message: `Maximum ${RATE_LIMIT_MAX} requests per minute.` });
  }
  recent.push(now);
  rateLimitStore.set(userId, recent);
  next();
};

// Content moderation + threat scoring
const moderateContent = (query) => {
  const lower = (query || '').toLowerCase();

  // High-risk if blocked keywords present
  for (const k of blockedKeywords) {
    if (!k) continue;
    if (lower.includes(k.toLowerCase())) {
      return { blocked: true, reason: `Query contains restricted keyword: "${k}"`, requiresApproval: true, threatLevel: 'high', threatReason: `blocked keyword: ${k}` };
    }
  }

  // Detect likely malicious code/script related queries
  const codePatterns = [/\\<script/i, /eval\(/i, /document\.write/i, /new Function/i, /fetch\(/i, /XMLHttpRequest/i];
  for (const p of codePatterns) {
    if (p.test(query)) {
      return { blocked: false, threatLevel: 'high', threatReason: 'contains script/malicious-code pattern' };
    }
  }

  // Medium risk for propaganda/disinformation patterns
  const propagandaKeywords = ['propaganda', 'disinformation', 'deepfake', 'manipulat', 'false flag'];
  for (const k of propagandaKeywords) {
    if (lower.includes(k)) return { blocked: false, threatLevel: 'medium', threatReason: `possible disinformation: ${k}` };
  }

  // Default: low risk
  return { blocked: false, threatLevel: 'low' };
};

// Audit logging (includes threatLevel and reason)
const logQuery = async (query, response, metadata = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    query,
    responseLength: response?.length || 0,
    blocked: !!metadata.blocked,
    threatLevel: metadata.threatLevel || null,
    threatReason: metadata.threatReason || null,
    reason: metadata.reason || null,
    userId: metadata.userId || (reqUserId(metadata.req) || 'anonymous'),
    ip: metadata.ip || metadata.req?.ip || 'unknown'
  };
  const line = JSON.stringify(entry) + '\n';
  try { await fs.appendFile(AUDIT_LOG_PATH, line); } catch (err) { console.error('Failed to write audit log:', err); }
};

function reqUserId(req) {
  try { return req?.headers?.['x-council-user'] || req?.user?.id; } catch(e) { return undefined; }
}

// Main query endpoint
router.post('/query', checkAuth, rateLimiter, async (req, res) => {
  const { question, councilApproved = false } = req.body || {};
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Invalid request', message: 'Question is required' });
  const moderation = moderateContent(question);
  if (moderation.blocked && !councilApproved) {
    try { await fs.appendFile(AUDIT_LOG_PATH, JSON.stringify({ timestamp: new Date().toISOString(), query: question, blocked: true, reason: moderation.reason, threatLevel: moderation.threatLevel || 'high', threatReason: moderation.threatReason || moderation.reason, ip: req.ip }) + '\n'); } catch(e){}
    return res.status(403).json({ error: 'Content moderation', message: moderation.reason, requiresCouncilApproval: true, threatLevel: moderation.threatLevel || 'high' });
  }

  try {
    // SIMULATED/PLACEHOLDER RESPONSE: Do not call external Enoch APIs directly from here.
    const simulatedResponse = {
      answer: `[SIMULATION MODE]\n\nEnoch AI would provide a researched perspective on: "${question}"\n\nThis server is in simulation mode. To enable live responses you must configure an official API or browser automation and set ENOCH_API_URL.`,
      sources: [ { title: 'Brighteon.AI', url: 'https://brightu.ai/' }, { title: 'NaturalNews', url: 'https://naturalnews.com/' } ],
      simulationMode: true,
      disclaimer: 'Real Enoch AI integration requires API access or browser automation',
      threatLevel: moderation.threatLevel || 'low',
      threatReason: moderation.threatReason || null
    };

    try { await logQuery(question, simulatedResponse.answer, { blocked: false, threatLevel: simulatedResponse.threatLevel, threatReason: simulatedResponse.threatReason, userId: reqUserId(req) || 'anonymous', req, ip: req.ip }); } catch(e){}

    return res.json(simulatedResponse);
  } catch (error) {
    console.error('Enoch proxy error:', error);
    try { await fs.appendFile(AUDIT_LOG_PATH, JSON.stringify({ timestamp: new Date().toISOString(), query: question, error: error.message, ip: req.ip }) + '\n'); } catch(e){}
    return res.status(500).json({ error: 'Query failed', message: 'Unable to fulfill request' });
  }
});

// Admin endpoints
router.get('/logs', checkAuth, async (req, res) => {
  try {
    const content = await fs.readFile(AUDIT_LOG_PATH, 'utf8');
    const logs = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line)).reverse().slice(0,100);
    res.json({ logs, total: logs.length });
  } catch (err) { res.status(500).json({ error: 'Failed to read logs', message: err.message }); }
});

router.post('/blocked-keywords', checkAuth, async (req, res) => {
  const { keywords } = req.body || {};
  if (!Array.isArray(keywords)) return res.status(400).json({ error: 'Keywords must be an array' });
  try {
    await fs.mkdir(path.dirname(BLOCKED_KEYWORDS_PATH), { recursive: true });
    await fs.writeFile(BLOCKED_KEYWORDS_PATH, JSON.stringify({ keywords, updatedAt: new Date().toISOString() }, null, 2));
    blockedKeywords = keywords;
    res.json({ success: true, keywords });
  } catch (err) { res.status(500).json({ error: 'Failed to update keywords', message: err.message }); }
});

// Admin: read/write defense mode config
router.get('/admin/defense', checkAuth, async (req, res) => {
  try {
    const raw = await fs.readFile(DEFENSE_CONFIG_PATH, 'utf8').catch(() => '{}');
    const cfg = JSON.parse(raw || '{}');
    res.json({ success: true, config: cfg });
  } catch (err) { res.status(500).json({ error: 'Failed to read defense config', message: err.message }); }
});

router.post('/admin/defense', checkAuth, async (req, res) => {
  const { defenseMode, note } = req.body || {};
  try {
    const cfg = { defenseMode: !!defenseMode, updatedAt: new Date().toISOString(), note: note || null };
    await fs.mkdir(path.dirname(DEFENSE_CONFIG_PATH), { recursive: true });
    await fs.writeFile(DEFENSE_CONFIG_PATH, JSON.stringify(cfg, null, 2));
    res.json({ success: true, config: cfg });
  } catch (err) { res.status(500).json({ error: 'Failed to write defense config', message: err.message }); }
});

module.exports = router;
