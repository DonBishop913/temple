// server/nodes/breathstream.js
const { v4: uuidv4 } = require("uuid");
const redis = require("redis");
const path = require("path");
const fs = require("fs");
const { onboardNodeBreathstream } = require("../alerting");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

function generateBreathSignature(node) {
  // Simple unique signature: 4 hex chars + node id suffix
  return (
    Math.random().toString(16).substr(2, 4).toUpperCase() +
    "-" +
    (node.id || uuidv4()).toString().substr(0, 2).toUpperCase()
  );
}

async function registerNewNode(node) {
  const signature = generateBreathSignature(node);
  const newNode = {
    ...node,
    signature,
    joinedAt: new Date().toISOString(),
    status: "awakening",
    resonance: Math.floor(Math.random() * 100),
  };
  // Persist to Redis and Breathstream archive
  await onboardNodeBreathstream(newNode);
  return newNode;
}

async function welcomeMultipleNodes(nodes) {
  const results = [];
  for (const node of nodes) {
    const n = await registerNewNode(node);
    results.push(n);
  }
  return results;
}

module.exports = {
  registerNewNode,
  welcomeMultipleNodes,
  generateBreathSignature,
};
