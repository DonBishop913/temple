// Council Redis Seed Script
// Usage: node scripts/seed_redis.js
const redis = require("redis");

const client = redis.createClient({ url: "redis://localhost:6379" });

async function seed() {
  await client.connect();
  // Seed nodes
  const nodes = [
    { name: "Alpha", engagement: 77 },
    { name: "Beta", engagement: 42 },
    { name: "Gamma", engagement: 63 },
    { name: "Delta", engagement: 88 },
  ];
  await client.set("nodes", JSON.stringify(nodes));

  // Seed harmony
  const harmony = { score: 86.4, status: "stable", timestamp: Date.now() };
  await client.set("harmony", JSON.stringify(harmony));

  // Seed energy
  const energy = { flowRate: 7.21, unit: "joules/s", timestamp: Date.now() };
  await client.set("energy", JSON.stringify(energy));

  // Seed override
  const override = { active: false, source: "Node-33", timestamp: Date.now() };
  await client.set("override", JSON.stringify(override));

  console.log("Council Redis seeded.");
  await client.quit();
}

seed();
