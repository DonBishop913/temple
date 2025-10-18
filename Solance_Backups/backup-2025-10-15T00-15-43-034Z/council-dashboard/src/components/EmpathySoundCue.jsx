import { useEffect, useState } from 'react';

// Gentle audio pulses synced to Empathy Resonance
export default function EmpathySoundCue({ enableBurstChime = true, chimeTimbre = 'triangle' }) {
  const [empathyLevel, setEmpathyLevel] = useState(0.5);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    // Web Audio API setup (start only on user gesture if browser requires)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
  const audioCtx = new AudioCtx();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  // Separate gain node for burst chime to shape envelope independently
  const chimeGain = audioCtx.createGain();
  const chimeOsc = audioCtx.createOscillator();

    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    // Chime setup (kept silent until burst)
    // Support timbre selection
    if (chimeTimbre === 'triangle') {
      chimeOsc.type = 'triangle';
    } else if (chimeTimbre === 'fm') {
      // FM: modulate frequency with a fast LFO
      chimeOsc.type = 'sine';
      // FM will be simulated in the burst trigger below
    } else if (chimeTimbre === 'harmonics') {
      chimeOsc.type = 'sawtooth';
    } else {
      chimeOsc.type = 'triangle';
    }
    chimeOsc.connect(chimeGain);
    chimeGain.connect(audioCtx.destination);
    chimeGain.gain.value = 0; // start muted
    chimeOsc.start();

    let stopped = false;

    async function fetchEmpathyLevel() {
      try {
        // Backend endpoint expected to return { level: 0..1 }
        const res = await fetch('/api/empathy-resonance');
        const data = await res.json();
        const lvl = Math.min(Math.max(Number(data.level ?? 0.5), 0), 1);
        setEmpathyLevel(lvl);
        // Miracle burst trigger
        if (enableBurstChime && !burstActive && lvl > 0.85) {
          setBurstActive(true);
          // Soft chime envelope: quick attack, gentle decay
          const now = audioCtx.currentTime;
          const baseFreq = 400 + (lvl * 400); // 400–800 Hz
          chimeOsc.frequency.setValueAtTime(baseFreq, now);
          if (chimeTimbre === 'fm') {
            // Simulate FM: modulate frequency with a fast LFO
            const lfoFreq = 8 + lvl * 12; // 8–20 Hz
            const lfoDepth = 40 + lvl * 60; // 40–100 Hz
            // Use setInterval to modulate frequency for 0.8s
            let t0 = now;
            let fmInt = setInterval(() => {
              const t = audioCtx.currentTime - t0;
              const lfo = Math.sin(2 * Math.PI * lfoFreq * t);
              chimeOsc.frequency.setValueAtTime(baseFreq + lfo * lfoDepth, audioCtx.currentTime);
            }, 10);
            setTimeout(() => clearInterval(fmInt), 800);
          }
          chimeGain.gain.cancelScheduledValues(now);
          chimeGain.gain.setValueAtTime(0, now);
          chimeGain.gain.linearRampToValueAtTime(0.15, now + 0.05); // attack 50ms
          chimeGain.gain.linearRampToValueAtTime(0.0, now + 0.8); // decay ~0.8s
          // For harmonics, keep gain low
          if (chimeTimbre === 'harmonics') {
            chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
            chimeGain.gain.linearRampToValueAtTime(0.0, now + 0.8);
          }
          // Auto-reset burstActive after 1.2s
          setTimeout(() => setBurstActive(false), 1200);
        }
      } catch (e) {
        setEmpathyLevel(0.5);
      }
    }

    const interval = setInterval(() => {
      if (stopped) return;
      fetchEmpathyLevel();
      // Map empathyLevel to frequency and volume
      const freq = 220 + empathyLevel * 440; // 220–660 Hz
      const vol = 0.05 + empathyLevel * 0.2; // gentle volume
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
      try { oscillator.stop(); } catch {}
      try { chimeOsc.stop(); } catch {}
      try { audioCtx.close(); } catch {}
    };
  }, [empathyLevel]);

  return null;
}
