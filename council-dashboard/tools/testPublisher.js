#!/usr/bin/env node
// Stress test publisher: publish batched pulses to Redis for QuantumRippleField
const Redis = require('ioredis');
const argv = require('minimist')(process.argv.slice(2));

const redis = new Redis(argv.redis || process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const CHANNEL = argv.channel || 'oversoul_pulse_batch';
const BATCH_SIZE = Number(argv.batch || 1000);
const INTERVAL_MS = Number(argv.interval || 100);

let pulseId = Number(argv.start || 0);

function generatePulse() {
  // positions in screen space [0..windowWidth] will be normalized by client; send as pixels for realism
  return {
    id: pulseId++,
    x: Math.floor(Math.random() * 1200),
    y: Math.floor(Math.random() * 800),
    radius: 2 + Math.random() * 8,
    color: ['#FF4D4D','#4D79FF','#9B59B6','#2ECC71'][Math.floor(Math.random()*4)],
    amplitude: Math.random(),
    timestamp: Date.now(),
  };
}

function publishBatch() {
  const batch = Array.from({ length: BATCH_SIZE }, generatePulse);
  redis.publish(CHANNEL, JSON.stringify(batch)).catch((e) => console.error('publish err', e.message));
}

console.log(`Stress-test publisher running -> ${BATCH_SIZE} pulses every ${INTERVAL_MS}ms to ${CHANNEL}`);
setInterval(publishBatch, INTERVAL_MS);
