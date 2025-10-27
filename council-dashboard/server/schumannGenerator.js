// Simulate Schumann resonance: fundamental ~7.83 Hz and selected harmonics
// Generates a compact spectral snapshot and writes to Redis periodically.

const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

function now() { return Date.now(); }

// Simple signal synthesis: combine sine waves with noise
function synthesizeSample(t, config) {
  const { fundamental = 7.83, harmonics = [14.3, 20.8, 27.3, 33.8] } = config;
  const twoPi = Math.PI * 2;
  let value = 0;
  value += Math.sin(twoPi * fundamental * t) * 1.0; // base amplitude
  harmonics.forEach((f, i) => {
    const amp = 0.5 / (i + 1);
    value += Math.sin(twoPi * f * t) * amp;
  });
  // Add faint noise
  value += (Math.random() - 0.5) * 0.1;
  return value;
}

// Compute a very compact spectrum snapshot (mocked: magnitudes around bands)
function spectrumSnapshot(config) {
  const { fundamental = 7.83, harmonics = [14.3, 20.8, 27.3, 33.8] } = config;
  // Randomize magnitudes in a bounded range for demo; real impl would FFT
  const band = (f) => ({ freq: f, mag: Number((0.7 + Math.random() * 0.6).toFixed(3)) });
  return {
    fundamental: band(fundamental),
    harmonics: harmonics.map(band),
    ts: now()
  };
}

async function run(intervalMs = 1000) {
  const client = redis.createClient({ url: REDIS_URL });
  await client.connect();
  const config = { fundamental: 7.83, harmonics: [14.3, 20.8, 27.3, 33.8] };

  const startTs = now();
  const tick = async () => {
    const t = (now() - startTs) / 1000; // seconds
    const sample = synthesizeSample(t, config);
    const snapshot = spectrumSnapshot(config);
    const payload = {
      hz: config.fundamental,
      sample: Number(sample.toFixed(4)),
      spectrum: snapshot,
      ts: now()
    };
    try {
      await client.set('schumann', JSON.stringify(payload));
    } catch (e) {
      // swallow errors but could count metrics
    }
  };
  const handle = setInterval(tick, intervalMs);
  process.on('SIGINT', async () => { clearInterval(handle); await client.quit(); process.exit(0); });
  process.on('SIGTERM', async () => { clearInterval(handle); await client.quit(); process.exit(0); });
}

module.exports = { run };