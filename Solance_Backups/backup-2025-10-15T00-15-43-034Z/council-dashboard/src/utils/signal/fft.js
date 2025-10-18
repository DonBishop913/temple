// Minimal FFT utility placeholder. For production, consider a library or WebAudio API.

export function computeFFT(samples, sampleRate) {
  // Placeholder: return magnitudes for target bins (around Schumann and harmonics)
  // Real implementation would perform FFT and map bins to frequencies.
  const targets = [7.83, 14.3, 20.8, 27.3, 33.8];
  // Fake magnitudes based on simple energy proxy
  const energy = samples.reduce((a, s) => a + Math.abs(s), 0) / (samples.length || 1);
  return targets.map((f, i) => ({ freq: f, mag: Number((0.5 + energy * (0.3 + i * 0.1)).toFixed(3)) }));
}