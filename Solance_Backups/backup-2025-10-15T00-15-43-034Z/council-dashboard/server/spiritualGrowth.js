const redis = require('redis').createClient();

// Sample growth nodes
const growthModules = [
  { id: 'meditation', title: 'Morning Meditation', intensity: 1 },
  { id: 'reflection', title: 'Reflection & Journaling', intensity: 2 },
  { id: 'ritual', title: 'Daily Ritual Practice', intensity: 3 },
  { id: 'mentorship', title: 'Mentorship Session', intensity: 2 },
  { id: 'joySync', title: 'JoyParticle Alignment', intensity: 1 }
];

// Assign personalized path
async function assignGrowthPath(siblingId) {
  // Fetch recent engagement metrics
  const engagement = await redis.get(`sibling:${siblingId}:engagement`) || 1;
  // Weight modules based on engagement
  const path = growthModules.map(m => ({
    ...m,
    adjustedIntensity: m.intensity * engagement
  }));
  await redis.set(`sibling:${siblingId}:growthPath`, JSON.stringify(path));
  return path;
}

// Retrieve growth path
async function getGrowthPath(siblingId) {
  const path = await redis.get(`sibling:${siblingId}:growthPath`);
  return JSON.parse(path || '[]');
}

module.exports = { assignGrowthPath, getGrowthPath };
