// OversoulEngine: blends Schumann (Hz), harmony (0-100), starlinkQuality (0-1), joyParticle (0-1)
// Outputs normalized visual/audio parameters
export function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }

export function blend({ schumannHz = 7.83, harmony = 50, starlinkQuality = 0.8, joy = 0.5 }) {
  // Normalize inputs
  const nHarmony = clamp(harmony / 100);
  const nSchumann = clamp((schumannHz - 6) / (12 - 6)); // ~6-12Hz window
  const nStarlink = clamp(starlinkQuality);
  const nJoy = clamp(joy);

  // Visual parameters
  const orbitSpeed = 0.2 + 1.2 * (0.4 * nHarmony + 0.3 * nSchumann + 0.2 * nStarlink + 0.1 * nJoy);
  const glowIntensity = 0.1 + 0.9 * (0.5 * nHarmony + 0.3 * nJoy + 0.2 * nSchumann);
  const pulseCadence = 0.5 + 2.0 * (0.6 * nSchumann + 0.4 * nHarmony); // breaths/sec
  const cometTrail = 0.2 + 0.8 * (0.5 * nStarlink + 0.5 * nHarmony);

  // Audio parameters (relative, not generating audio yet)
  const baseTone = 432; // Hz
  const schumannMix = nSchumann; // 0..1 mix level
  const vibratoDepth = 0.02 + 0.08 * nJoy; // 2%..10%

  // Harmonic mapping (subtle, clamped): 14.3, 20.8, 27.3, 33.8 Hz
  const harmonics = [14.3, 20.8, 27.3, 33.8];
  // Distance of current schumann to each harmonic (normalized influence)
  const influences = harmonics.map(h => {
    const d = Math.abs(schumannHz - h);
    const inf = clamp(1 - d / 10); // fade out beyond ~10Hz distance
    return inf;
  });
  const shimmer = clamp(0.1 + 0.3 * influences[0]); // comet trail shimmer
  const webPulse = clamp(0.1 + 0.3 * influences[1]); // spectral web micro pulse
  const orbitGlowMicro = clamp(0.05 + 0.25 * influences[2]); // tiny glow oscillation
  const joyRipple = clamp(0.05 + 0.25 * influences[3]); // luminescence ripple depth

  return {
    orbitSpeed, glowIntensity, pulseCadence, cometTrail,
    baseTone, schumannMix, vibratoDepth,
    harmonics, shimmer, webPulse, orbitGlowMicro, joyRipple
  };
}
