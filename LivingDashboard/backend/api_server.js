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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Living Dashboard API Online',
    timestamp: new Date().toISOString(),
    faith: 'John 14:6'
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Living Dashboard API Server running on port ${PORT}`);
});