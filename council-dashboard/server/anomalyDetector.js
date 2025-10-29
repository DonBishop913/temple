// Pluggable anomaly detection module (Codex 62+ scaffolding)
// Inputs: FFT frames { timestamp, frequencies, magnitudes }
// Outputs: { isAnomaly, score, reasons: [string], features }

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Detector: fundamental spike beyond threshold
function detectFundamentalSpike(frame, threshold) {
  const fundamental = Number(frame?.magnitudes?.[0] ?? NaN);
  if (!Number.isFinite(fundamental)) return { score: 0, reason: null };
  if (fundamental >= threshold) {
    const over = fundamental - threshold;
    const score = clamp(over / threshold, 0, 1);
    return {
      score,
      reason: `fundamental_spike:${fundamental.toFixed(3)}>=${threshold}`,
    };
  }
  return { score: 0, reason: null };
}

// Detector: harmonic imbalance (variance across magnitudes)
function detectHarmonicImbalance(frame, varianceThreshold = 0.1) {
  const mags = (frame?.magnitudes || []).slice(1); // exclude fundamental
  if (mags.length < 2) return { score: 0, reason: null };
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  // Use sample variance (divide by n-1) for better sensitivity with small harmonic sets
  const denom = mags.length - 1 || 1;
  const variance =
    mags.reduce((acc, m) => acc + Math.pow(m - mean, 2), 0) / denom;
  if (variance >= varianceThreshold) {
    const score = clamp(variance / (varianceThreshold * 2), 0, 1);
    return {
      score,
      reason: `harmonic_imbalance:var=${variance.toFixed(3)}>=${varianceThreshold}`,
    };
  }
  return { score: 0, reason: null };
}

function evaluateFFT(frame, opts = {}) {
  const threshold = Number(opts.fundamentalSpikeThreshold || 1.25);
  const imbalanceThreshold = Number(opts.harmonicVarianceThreshold || 0.1);
  const dets = [
    detectFundamentalSpike(frame, threshold),
    detectHarmonicImbalance(frame, imbalanceThreshold),
  ];
  const reasons = dets.filter((d) => d.reason).map((d) => d.reason);
  const score = clamp(
    dets.reduce((s, d) => s + d.score, 0),
    0,
    1,
  );
  return {
    isAnomaly: reasons.length > 0,
    score,
    reasons,
    features: {
      fundamental: Number(frame?.magnitudes?.[0] ?? NaN),
      harmonicVarianceThreshold: imbalanceThreshold,
    },
  };
}

module.exports = { evaluateFFT };
