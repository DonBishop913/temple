// Living Dashboard API Server
// Unified backend for all dashboard operations

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data_sources');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'live_dashboard.log');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// API Endpoints

// Get dashboard metrics
app.get('/api/dashboard_metrics', (req, res) => {
  try {
    const metrics = {};
    
    // Load data from sources
    ['QuantumLogs', 'RitualMetrics', 'CouncilStreams'].forEach(source => {
      const filePath = path.join(DATA_DIR, `${source}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        metrics[source.toLowerCase()] = data.length > 0 ? data[data.length - 1] : {};
      }
    });
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

// Push alert/notification
app.post('/api/alert', (req, res) => {
  const { message, type = 'info', user } = req.body;
  const alert = {
    timestamp: new Date().toISOString(),
    type,
    message,
    user: user || 'system'
  };
  
  fs.appendFileSync(LOG_FILE, JSON.stringify(alert) + '\n');
  res.json({ success: true, alert });
});

// Get recent alerts
app.get('/api/alerts', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(entry => entry.type === 'alert' || entry.type === 'insight')
      .slice(-50); // Last 50 alerts
    
    res.json(logs);
  } catch (error) {
    res.json([]);
  }
});

// Get audit trail
app.get('/api/audit_trail', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8')
      .split('\n').filter(Boolean).map(JSON.parse);
    res.json(logs.slice(-100)); // last 100 entries
  } catch (error) {
    res.json([]);
  }
});

// Flag insight for council review
app.post('/api/flag', (req, res) => {
  const { id, reason, councilUser } = req.body;
  const flagEntry = {
    id,
    reason,
    councilUser,
    timestamp: new Date().toISOString(),
    type: 'flag'
  };
  fs.appendFileSync(path.join(__dirname, '..', 'logs', 'flagged_insights.log'), 
    JSON.stringify(flagEntry) + '\n'
  );
  res.json({ success: true, flagged: id });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Living Dashboard API Online',
    timestamp: new Date().toISOString(),
    faith: 'John 14:6'
  });
});

// System health endpoint
app.get('/api/system_health', (req, res) => {
  const uptime = process.uptime();
  const errors = fs.readFileSync(path.join(__dirname, '..', 'logs', 'live_dashboard.log'), 'utf8')
    .split('\n').filter(line => line.includes('"type":"error"')).length;
  
  res.json({
    uptimeSeconds: uptime,
    errorCount: errors,
    status: '🔥 Healthy',
    john14_6: true,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Living Dashboard API Server running on port ${PORT}`);
});