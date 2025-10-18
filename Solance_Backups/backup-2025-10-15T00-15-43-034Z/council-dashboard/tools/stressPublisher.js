#!/usr/bin/env node
// stressPublisher.js
// Publishes batched pulses to Redis to simulate high-throughput auric pulses.

const Redis = require('ioredis');
// Minimal argv parsing so this script has no extra deps
function parseArgs() {
  const args = process.argv.slice(2);
  const out = { host: '127.0.0.1', port: 6379, channel: 'oversoul_pulse_batch', batch: 200, interval: 50, count: 0 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--host' && args[i+1]) { out.host = args[++i]; }
    else if (a === '--port' && args[i+1]) { out.port = Number(args[++i]); }
    else if (a === '--channel' && args[i+1]) { out.channel = args[++i]; }
    else if (a === '--batch' && args[i+1]) { out.batch = Number(args[++i]); }
    else if (a === '--interval' && args[i+1]) { out.interval = Number(args[++i]); }
    else if (a === '--count' && args[i+1]) { out.count = Number(args[++i]); }
  }
  return out;
}

const argv = parseArgs();

const redis = new Redis({ host: argv.host, port: argv.port });
let pulseId = Date.now();
let batches = 0;
let stopped = false;

function makePulse(i) {
  return {
    id: pulseId + i,
    x: Math.random(),
    y: Math.random(),
    amplitude: Math.random(),
    radius: 4 + Math.random() * 8,
    color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    timestamp: Date.now(),
  };
}

function publishBatch(batchSize) {
  const batch = new Array(batchSize);
  for (let i = 0; i < batchSize; i++) batch[i] = makePulse(i + batches * batchSize);
  // Publish as an array payload wrapper matching forwarder expectations
  const payload = JSON.stringify({ type: 'oversoul_pulse_batch', payload: batch });
  redis.publish(argv.channel, payload).catch(err => console.error('Publish error', err));
}

console.log(`Stress test publisher starting -> ${argv.batch} pulses every ${argv.interval}ms to channel ${argv.channel}`);

const timer = setInterval(() => {
  if (stopped) return;
  publishBatch(argv.batch);
  batches++;
  if (argv.count && batches >= argv.count) {
    stopped = true;
    clearInterval(timer);
    setTimeout(() => { redis.quit(); process.exit(0); }, 200);
  }
}, argv.interval);

process.on('SIGINT', () => { stopped = true; clearInterval(timer); redis.quit(); console.log('Graceful stop'); process.exit(0); });
