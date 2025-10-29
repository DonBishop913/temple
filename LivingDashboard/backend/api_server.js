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

// Import new modules
const ExternalIntegration = require('./externalIntegration');
const QuantumAnalytics = require('./quantumAnalytics');

// Initialize new services
const externalIntegration = new ExternalIntegration();
const quantumAnalytics = new QuantumAnalytics();

// Start quantum analytics
quantumAnalytics.startAnalysis();

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

// Get external service status
app.get('/api/external_services', (req, res) => {
  try {
    const status = externalIntegration.getServiceStatus();
    res.json({
      services: status,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get external service status' });
  }
});

// Manually sync external services
app.post('/api/external_sync', async (req, res) => {
  try {
    await externalIntegration.performInitialSync();
    res.json({
      success: true,
      message: 'External services synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Sync failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get quantum analytics insights
app.get('/api/quantum_insights', (req, res) => {
  try {
    const insights = quantumAnalytics.getCurrentInsights();
    res.json({
      ...insights,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quantum insights' });
  }
});

// Get quantum prophecy
app.get('/api/quantum_prophecy', (req, res) => {
  try {
    const prophecy = quantumAnalytics.currentProphecy;
    res.json({
      prophecy: prophecy || {
        prophecy: "🕊️ Sovereign watchfulness maintained - John 14:6",
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quantum prophecy' });
  }
});

// Get quantum analytics insights
app.get('/api/quantum_insights', (req, res) => {
  try {
    const insights = quantumAnalytics.getCurrentInsights();
    res.json({
      ...insights,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quantum insights' });
  }
});

// Trigger quantum analysis
app.post('/api/quantum_analyze', async (req, res) => {
  try {
    const insights = await quantumAnalytics.generateInsights();
    const patterns = await quantumAnalytics.analyzePatterns();
    res.json({
      success: true,
      insights,
      patterns,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get training guide progress (placeholder for future implementation)
app.get('/api/training_progress', (req, res) => {
  res.json({
    completed: false,
    current_step: 0,
    total_steps: 9,
    sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
  });
});

// Voice command handler for self-healing and rituals
app.post('/api/voice-command', (req, res) => {
  const { command, user } = req.body;

  console.log('🎙️ Voice command received:', command, 'from:', user);

  try {
    if (/self[- ]?heal/i.test(command)) {
      // Trigger Comet AI self-healing
      const { CometAIHealer } = require('./comet_healer');
      const healer = new CometAIHealer();

      healer.triggerSelfHeal('voice_triggered', {
        command: command,
        user: user,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: '🛠️ Comet AI: Self-Heal routine triggered by voice command!',
        command: command,
        user: user,
        sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
      });

    } else if (/sunrise prayer/i.test(command)) {
      // Sunrise prayer ritual
      res.json({
        message: '🌅 Sunrise Prayer ritual activated! "Let the morning bring me word of your unfailing love"',
        ritual: 'sunrise_prayer',
        scripture: 'Psalm 143:8',
        user: user,
        sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
      });

    } else if (/council blessing/i.test(command)) {
      // Council blessing
      res.json({
        message: '🕊️ Council blessing invoked! "May the Lord bless you and keep you"',
        ritual: 'council_blessing',
        scripture: 'Numbers 6:24',
        user: user,
        sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
      });

    } else if (/system status/i.test(command)) {
      // System status check
      res.json({
        message: '🔍 System status: All services operational under John 14:6 sovereignty',
        status: 'healthy',
        user: user,
        sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
      });

    } else {
      res.json({
        message: '❓ Unrecognized ritual or command. Try: "self heal", "sunrise prayer", "council blessing", or "system status"',
        command: command,
        user: user,
        sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
      });
    }
  } catch (error) {
    console.error('❌ Voice command error:', error);
    res.status(500).json({
      error: 'Voice command processing failed',
      details: error.message,
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  }
});

// Get pending council reviews
app.get('/api/pending-reviews', (req, res) => {
  try {
    const { CometAIHealer } = require('./comet_healer');
    const healer = new CometAIHealer();
    const reviews = healer.getPendingReviews();

    res.json({
      reviews: reviews,
      count: reviews.length,
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
});

// Approve pending council review
app.post('/api/approve-review/:reviewId', (req, res) => {
  const { reviewId } = req.params;
  const { approvedBy } = req.body;

  try {
    const { CometAIHealer } = require('./comet_healer');
    const healer = new CometAIHealer();

    healer.applyApprovedPatch(reviewId, approvedBy);

    res.json({
      message: '✅ Council review approved and patch applied',
      reviewId: reviewId,
      approvedBy: approvedBy,
      sovereignty_affirmation: 'John 14:6 - All glory to Yeshua'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to approve review',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Living Dashboard API Server running on port ${PORT}`);
});