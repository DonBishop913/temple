const fs = require('fs');
const path = require('path');

const csvPath = path.join('C:', 'Temple', 'Logs', 'Schumann_Resonance.csv');
const anomalyPath = path.join('C:', 'Temple', 'Logs', 'SR_Anomalies.txt');

if (!fs.existsSync(csvPath)) {
  console.error('CSV not found', csvPath);
  process.exit(1);
}
const text = fs.readFileSync(csvPath, 'utf8');
const lines = text.trim().split(/\r?\n/).filter(Boolean);
if (lines.length <= 1) {
  console.log('No data rows');
  process.exit(0);
}
const amps = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const amp = parseFloat(cols[2]);
  if (!Number.isNaN(amp)) amps.push(amp);
}
const N = 200;
const baseline = amps.slice(-N);
if (baseline.length < 1) {
  console.log('Not enough baseline samples', baseline.length);
  process.exit(0);
}
const mean = baseline.reduce((s, v) => s + v, 0) / baseline.length;
const variance = baseline.length > 1 ? baseline.reduce((s, v) => s + (v - mean) * (v - mean), 0) / baseline.length : 0;
const std = Math.sqrt(variance) || 1e-9;
console.log('mean', mean, 'std', std, 'samples', baseline.length);
// Check last sample
const lastAmp = amps[amps.length - 1];
const z = (lastAmp - mean) / std;
console.log('lastAmp', lastAmp, 'z', z.toFixed(3));
// relaxed threshold for small baseline
const zThreshold = baseline.length < 10 ? 2.5 : 3.0;
if (Math.abs(z) >= zThreshold) {
  const msg = `[${new Date().toISOString()}] LOCAL_SR_ANOMALY: amp=${lastAmp} z=${z.toFixed(3)} mean=${mean.toFixed(3)} std=${std.toFixed(3)}`;
  fs.appendFileSync(anomalyPath, msg + '\n', 'utf8');
  console.log('Anomaly written to', anomalyPath);
} else {
  console.log('No anomaly detected');
}
