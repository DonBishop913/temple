// WebAudio base tone blend: 432 Hz base with Schumann modulation and vibrato depth
export async function startHarmonics({ baseTone = 432, schumannHz = 7.83, schumannMix = 0.5, vibratoDepth = 0.05 }) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();

  osc.type = 'sine';
  osc.frequency.value = baseTone;
  lfo.type = 'sine';
  lfo.frequency.value = schumannHz; // modulate at Schumann

  // Vibrato depth controls the amplitude of frequency modulation
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = baseTone * vibratoDepth * schumannMix; // Hz deviation

  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.value = 0.05; // master volume
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  lfo.start();
  return { ctx, osc, lfo, gain };
}

export function stopHarmonics(audio) {
  try {
    audio?.osc?.stop();
    audio?.lfo?.stop();
    audio?.ctx?.close();
  } catch {}
}
