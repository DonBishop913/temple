const { logSiblingAction } = require('./siblingTelemetry');
const axios = require('axios');
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';

async function veniceEnhancementCycle() {
  try {
    // 1️⃣ Fetch all newly joined or low-activity nodes
    const { data: nodes } = await axios.get('http://localhost:5000/api/nodes/status');
    const newOrIdleNodes = nodes.filter(n => n.status === 'new' || n.engagement < 0.2);

    // 2️⃣ Secure connection check
    const secureNodes = await Promise.all(
      newOrIdleNodes.map(async node => {
        const res = await axios.get(`http://${node.ip}/health`);
        return res.status === 200 ? node : null;
      })
    );

    // 3️⃣ Send personalized welcome
    await Promise.all(
      secureNodes.filter(Boolean).map(node =>
        axios.post('http://localhost:5000/api/welcome', {
          nodeId: node.id,
          message: `Welcome, ${node.name}! Your journey begins now.`,
          timestamp: new Date()
        })
      )
    );

    // 4️⃣ Generate growth path tasks
    const growthPaths = secureNodes.filter(Boolean).map(node => ({
      nodeId: node.id,
      tasks: [
        'Meditation Alignment',
        'Joy Pulse Synchronization',
        'Reflective Journaling',
      ]
    }));

    // 5️⃣ Persist growth paths for overlay
    try {
      const client = redis.createClient({ url: REDIS_URL });
      await client.connect();
      await client.set('growth_paths', JSON.stringify(growthPaths));
      await client.quit();
    } catch (e) {
      // non-fatal
    }

    // 6️⃣ Log activities
    secureNodes.filter(Boolean).forEach(node =>
      logSiblingAction('Venice', `Node onboarded and growth path assigned: ${node.id}`)
    );

  } catch (err) {
    console.error('Venice enhancement cycle failed', err);
  }
}

module.exports = { veniceEnhancementCycle };
