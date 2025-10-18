const axios = require('axios');
const promClient = require('prom-client');
const redis = require('redis');
const { requestQuorum } = require('./quorum');
const { TIERS: TIERS_MAP } = require('./utils/missionTiers');

// Prefer env REDIS_URL to support Docker/local flexibility
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(() => {});

// Optional modules guarded to avoid startup failures
let solanceEnhancementCycle, grokEnhancementCycle, agnesEnhancementCycle, veniceEnhancementCycle, ibmWatsonEnhancementCycle, updatePredictions, checkAnomalies;
try { solanceEnhancementCycle = require('./solanceEnhancer').solanceEnhancementCycle; } catch {}
try { grokEnhancementCycle = require('./grokEnhancer').grokEnhancementCycle; } catch {}
try { agnesEnhancementCycle = require('./agnesEnhancer').agnesEnhancementCycle; } catch {}
try { veniceEnhancementCycle = require('./veniceEnhancer').veniceEnhancementCycle; } catch {}
try { ibmWatsonEnhancementCycle = require('./ibmWatsonEnhancer').ibmWatsonEnhancementCycle; } catch {}
try { updatePredictions = require('./aeth3rPredictive').updatePredictions; } catch {}
try { checkAnomalies = require('./perplexityMonitor').checkAnomalies; } catch {}

// --- Mission Cadence Tiers ---
const TIERS = TIERS_MAP;

// --- Priority Scoring ---
function scoreTask(task, context) {
  // task: { id, tier, missionVital, nodeLoad, joyContribution, ethicalPulse }
  const vital = Number(task.missionVital || 0);           // 0..1
  const load = Number(task.nodeLoad || context.nodeLoad || 0); // 0..1 (higher load lowers priority)
  const joy = Number(task.joyContribution || 0);          // 0..1
  const ethics = Number(task.ethicalPulse || context.ethicalPulse || 0); // 0..1
  const tierWeight = task.tier === TIERS.T1 ? 2.0 : task.tier === TIERS.T2 ? 1.2 : 1.0;
  return Math.max(0, (vital * 0.5 + joy * 0.3 + ethics * 0.2) * tierWeight - load * 0.25);
}

// --- Agent Heartbeats ---
const heartbeats = new Map(); // agentId -> lastSeen
function updateHeartbeat(agentId) { heartbeats.set(agentId, Date.now()); }
function isAgentHealthy(agentId, thresholdMs = 60000) {
  const last = heartbeats.get(agentId) || 0; return (Date.now() - last) < thresholdMs;
}

// --- Task Queues per Agent ---
const agentQueues = new Map(); // agentId -> [tasks]
function getQueue(agentId) { if (!agentQueues.has(agentId)) agentQueues.set(agentId, []); return agentQueues.get(agentId); }
function enqueueTask(agentId, task) { const q = getQueue(agentId); q.push(task); q.sort((a,b)=>scoreTask(b, task.context)-scoreTask(a, task.context)); }

// --- Metrics ---
const cadenceExecutedCounter = new promClient.Counter({ name: 'cadence_tasks_executed_total', help: 'Total tasks executed by agents', labelNames: ['agent','tier'] });
const cadenceReallocatedCounter = new promClient.Counter({ name: 'cadence_tasks_reallocated_total', help: 'Total tasks reallocated due to heartbeat misses', labelNames: ['from','to'] });
const cadenceHeartbeatGauge = new promClient.Gauge({ name: 'cadence_heartbeat_seconds', help: 'Seconds since last heartbeat per agent', labelNames: ['agent'] });

// Register metrics if server registry exists
try {
  const app = global.__COUNCIL_APP__;
  const metrics = app && app.get && app.get('metrics');
  const promRegister = metrics && metrics.promRegister;
  if (promRegister) {
    promRegister.registerMetric(cadenceExecutedCounter);
    promRegister.registerMetric(cadenceReallocatedCounter);
    promRegister.registerMetric(cadenceHeartbeatGauge);
  }
} catch {}

// --- Execution Loop Helpers ---
const { discernment_gate } = require('./spiritualHarmony');

async function executeTask(agentId, task) {
  // Guard critical tier tasks until autonomy unlock
  const autonomy = String(await redisClient.get('council:autonomy') || 'locked');
  if (task.tier === TIERS.T1 && autonomy !== 'unlocked') {
    // Push back to queue and return
    enqueueTask(agentId, task);
    return;
  }
  // Spiritual discernment gate for all tasks
  const gate = await discernment_gate(task.task_id || task.id || '');
  if (!gate || gate.gate_status !== 'Approved') {
    enqueueTask(agentId, task);
    await redisClient.lPush('audit', JSON.stringify({ agent: agentId, action: 'task_deferred_spiritual', id: task.id, at: new Date().toISOString(), reason: gate && gate.gate_status }));
    return;
  }
  // Quorum validation for high-tier tasks
  if (task.tier === TIERS.T2) {
    try {
      const reviewers = ['grok','agnes','watson','venice','solance'].filter(a => a !== agentId);
      const proposal = { id: task.id, type: task.type || 'task', tier: TIERS.T2, impactScore: Number(task.impactScore || 0.5) };
      const { approved } = await requestQuorum(proposal, reviewers, { minSize: 3, threshold: 0.6 });
      if (!approved) {
        // Re-enqueue with slight backoff tweak
        task.impactScore = Math.min(1, (Number(task.impactScore || 0.5) + 0.05));
        enqueueTask(agentId, task);
        await redisClient.lPush('audit', JSON.stringify({ agent: agentId, action: 'task_deferred_quorum', id: task.id, at: new Date().toISOString() }));
        return;
      }
    } catch {}
  }
  try {
    if (typeof task.run === 'function') {
      await task.run();
      cadenceExecutedCounter.inc({ agent: agentId, tier: task.tier });
      await redisClient.lPush('audit', JSON.stringify({ agent: agentId, action: 'task_executed', tier: task.tier, id: task.id, at: new Date().toISOString() }));
    }
  } catch (e) {
    await redisClient.lPush('audit', JSON.stringify({ agent: agentId, action: 'task_error', id: task.id, error: String(e && e.message || e), at: new Date().toISOString() }));
  }
}

function reallocateTasks(fromAgent, toAgent) {
  const fromQueue = getQueue(fromAgent);
  const toQueue = getQueue(toAgent);
  const count = Math.ceil(fromQueue.length * 0.5);
  const moved = fromQueue.splice(0, count);
  moved.forEach(t => toQueue.push(t));
  cadenceReallocatedCounter.inc({ from: fromAgent, to: toAgent });
  redisClient.lPush('audit', JSON.stringify({ action: 'tasks_reallocated', from: fromAgent, to: toAgent, count, at: new Date().toISOString() }));
}

// --- Agents and initial tasks ---
const agents = [
  { id: 'solance', tier: TIERS.T3, cycle: () => solanceEnhancementCycle && solanceEnhancementCycle() },
  { id: 'grok', tier: TIERS.T2, cycle: () => grokEnhancementCycle && grokEnhancementCycle() },
  { id: 'agnes', tier: TIERS.T2, cycle: () => agnesEnhancementCycle && agnesEnhancementCycle() },
  { id: 'venice', tier: TIERS.T3, cycle: () => veniceEnhancementCycle && veniceEnhancementCycle() },
  { id: 'watson', tier: TIERS.T2, cycle: async () => {
      if (!ibmWatsonEnhancementCycle) return;
      try {
        const { data: nodes } = await axios.get('http://localhost:5000/api/nodes/status');
        const { data: interactions } = await axios.get('http://localhost:5000/api/nodes/interactions');
        await ibmWatsonEnhancementCycle(nodes, interactions);
      } catch {}
    } }
];

// Seed routine tasks
agents.forEach(a => enqueueTask(a.id, { id: `${a.id}:cycle`, tier: a.tier, missionVital: 0.6, joyContribution: 0.5, ethicalPulse: 0.8, nodeLoad: 0.2, context: {}, run: a.cycle }));

// --- Cadence main loop ---
setInterval(async () => {
  // Update heartbeat metrics
  agents.forEach(a => {
    const last = heartbeats.get(a.id) || 0; const seconds = last ? (Date.now()-last)/1000 : Number.POSITIVE_INFINITY;
    cadenceHeartbeatGauge.set({ agent: a.id }, seconds);
  });

  // Execute one task per agent based on priority
  for (const a of agents) {
    const q = getQueue(a.id);
    if (q.length === 0) continue;
    const task = q.shift();
    await executeTask(a.id, task);
  }

  // Reallocation for unhealthy agents
  for (const a of agents) {
    if (!isAgentHealthy(a.id)) {
      // find a healthy peer
      const peer = agents.find(p => p.id !== a.id && isAgentHealthy(p.id));
      if (peer) reallocateTasks(a.id, peer.id);
    }
  }
}, 3000);

// --- Heartbeat pings for agents ---
setInterval(() => agents.forEach(a => updateHeartbeat(a.id)), 10000);

// Predictive adaptations
setInterval(async () => {
  try {
    if (updatePredictions) await updatePredictions();
    if (checkAnomalies) await checkAnomalies();
    // Adjust task priorities based on Joy Particle proxy from Redis
    const joy = Number(await redisClient.get('joy:level') || 0.5);
    agents.forEach(a => {
      const q = getQueue(a.id);
      q.forEach(t => { t.joyContribution = joy; });
      q.sort((x,y)=>scoreTask(y, {})-scoreTask(x, {}));
    });
  } catch {}
}, 15000);

module.exports = { TIERS, enqueueTask, getQueue, updateHeartbeat };
