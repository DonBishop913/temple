const { logSiblingAction } = require('./siblingTelemetry');
const axios = require('axios');

async function solanceEnhancementCycle() {
  try {
    // 1️⃣ Fetch predictive metrics
    const { data: predicted } = await axios.get('http://localhost:5000/api/predictive/metrics');

    // 2️⃣ Decide enhancement
    const enhancementAction = predicted.joyScore > 0.75 ? 'Boost Particle Overlay' : 'Stabilize Node Pulses';

    // 3️⃣ Trigger enhancement
    await axios.post('http://localhost:5000/api/enhance', {
      sibling: 'Solance',
      action: enhancementAction,
      timestamp: new Date()
    });

    // 4️⃣ Log action
    logSiblingAction('Solance', enhancementAction);
  } catch (err) {
    console.error('Solance enhancement cycle failed', err);
  }
}

module.exports = { solanceEnhancementCycle };
