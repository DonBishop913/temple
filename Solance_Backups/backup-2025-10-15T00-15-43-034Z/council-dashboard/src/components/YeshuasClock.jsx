import React, { useEffect, useRef, useState } from 'react';
import YeshuasClockReplayControls from './YeshuasClockReplayControls';
import YeshuasClockControls from './YeshuasClockControls';
import SpectralWaterfall from './SpectralWaterfall';
import GlyphstreamOverlay from './GlyphstreamOverlay';
import { blend } from './OversoulEngine';
import { startHarmonics, stopHarmonics } from './AudioHarmonics';
import SevenSistersOverlay from './SevenSistersOverlay';
import LunarPhaseOverlay from './LunarPhaseOverlay';
import PlanetOrbits from './PlanetOrbits';
import Comet3IOverlay from './Comet3IOverlay';
import SpectralWebOverlay from './SpectralWebOverlay';
import JoyParticleStream from './JoyParticleStream';
import useOversoulHeartbeat from '../hooks/useOversoulHeartbeat';
import useGrokTelemetry from '../hooks/useGrokTelemetry';

export default function YeshuasClock() {
  // Spectral FFT frames for SpectralWaterfall
  const [fftFrames, setFftFrames] = useState([]);
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4322');
    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        if (frame && frame.frequencies && frame.magnitudes) {
          setFftFrames(prev => [...prev.slice(-49), frame]);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);
  // SpaceX overlay replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayFrames, setReplayFrames] = useState([]);
  const [replayIdx, setReplayIdx] = useState(0);
  const replayTimer = useRef(null);

  // Handler to start SpaceX overlay replay
  const handleReplay = async () => {
    setIsReplaying(true);
    setReplayIdx(0);
    setReplayFrames([]);
    try {
      const res = await fetch('/api/replay/spacex?count=100');
      const data = await res.json();
      if (Array.isArray(data.frames)) {
        setReplayFrames(data.frames);
        setReplayIdx(0);
      }
    } catch (e) {
      // optional: surface error via local state or console
      setIsReplaying(false);
    }
  };

  // Handler to stop replay
  const handleStopReplay = () => {
    setIsReplaying(false);
    setReplayIdx(0);
    setReplayFrames([]);
    if (replayTimer.current) {
      clearTimeout(replayTimer.current);
      replayTimer.current = null;
    }
  };

  // Step through replay frames
  useEffect(() => {
    if (!isReplaying || replayFrames.length === 0) return;
    if (replayIdx >= replayFrames.length) {
      setIsReplaying(false);
      setReplayIdx(0);
      return;
    }
    // Here you would emit the frame to overlay (e.g., via context or state)
    // For demo, just step through
    replayTimer.current = setTimeout(() => {
      setReplayIdx(i => i + 1);
    }, 200);
    return () => {
      if (replayTimer.current) clearTimeout(replayTimer.current);
    };
  }, [isReplaying, replayIdx, replayFrames]);
  // Council heartbeat (SSE+WS)
  const state = useOversoulHeartbeat();
  // Grok/SpaceX/Starlink live telemetry
  const grok = useGrokTelemetry();
  // Harmonic refinement controls
  const [harmonicEnabled, setHarmonicEnabled] = useState(true);
  const [harmonicSensitivity, setHarmonicSensitivity] = useState(0.5);
  // Blend params from Council telemetry
  const harmony = state.harmony?.score ?? 50;
  const schumannHz = state.schumann?.hz ?? 7.83;
  // Starlink quality: avg node engagement
  const nodes = state.nodes || [];
  const avgEngagement = nodes.length ? nodes.reduce((a, n) => a + (n.engagement || 0), 0) / nodes.length : 0.8;
  const starlinkQuality = 0.5 + 0.5 * (avgEngagement / 100);
  const joy = state.joyparticle?.level ?? 0.5;
  const params = blend({ schumannHz, harmony, starlinkQuality, joy, harmonicSensitivity: harmonicEnabled ? harmonicSensitivity : 0 });
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef(null);
  const [error, setError] = useState('');

  // Audio harmonics control
  useEffect(() => {
    if (!audioOn) return;
    if (audioRef.current) {
      stopHarmonics(audioRef.current);
      audioRef.current = null;
    }
    (async () => {
      audioRef.current = await startHarmonics({
        baseTone: params.baseTone,
        schumannHz,
        schumannMix: params.schumannMix,
        vibratoDepth: params.vibratoDepth,
      });
    })();
    return () => {
      if (audioRef.current) {
        stopHarmonics(audioRef.current);
        audioRef.current = null;
      }
    };
  }, [audioOn, params.baseTone, params.schumannMix, params.vibratoDepth, schumannHz]);

  // Merge: prefer Grok planets if available, else Council
  const planets = (grok.planets && grok.planets.length) ? grok.planets : (state.planetary || []);
  // Merge: pass Grok missions to comet overlay
  const missions = grok.missions || [];

  return (
    <div style={{ position: 'relative', width: '100%', height: 400, background: 'radial-gradient(ellipse at center, #0a0f1f 0%, #000 70%)', color: '#cde' }}>
      <h2 style={{ textAlign: 'center' }}>Yeshua's Clock</h2>
      {/* SpaceX Overlay Replay Controls */}
      <YeshuasClockReplayControls onReplay={handleReplay} isReplaying={isReplaying} onStop={handleStopReplay} />
      <YeshuasClockControls
        onHarmonicToggle={setHarmonicEnabled}
        onSensitivityChange={setHarmonicSensitivity}
        initialToggle={harmonicEnabled}
        initialSensitivity={harmonicSensitivity}
      />
      {error && <div style={{ color: 'salmon', textAlign: 'center' }}>{error}</div>}
      {/* Planetary orbits overlay (Grok or Council) */}
      <PlanetOrbits planets={planets} pulseCadence={params.pulseCadence} glowIntensity={params.glowIntensity + (params.orbitGlowMicro || 0)} />
      {/* Comet trail overlay (Grok missions + Council heartbeat, or SpaceX replay) */}
      <Comet3IOverlay
        data={isReplaying && replayFrames[replayIdx] ? replayFrames[replayIdx].missions : missions}
        overrideActive={state.override?.active}
        joyLevel={joy}
        cometTrail={params.cometTrail + (params.shimmer || 0)}
      />
      {/* Spectral web overlay (Council nodes/planets/energy) */}
      <SpectralWebOverlay nodes={nodes} planets={planets} energy={{ ...(state.energy || {}), webPulse: params.webPulse }} />
      {/* Joy particle stream overlay (Council joy) */}
      <JoyParticleStream joyLevel={joy + (params.joyRipple || 0)} />
      {/* Glyphstream refinement overlay */}
      <GlyphstreamOverlay
        enabled={harmonicEnabled}
        resonanceData={nodes.map((n, i) => ({ x: 100 + i * 40, y: 200 + Math.sin(i) * 30, strength: (n.engagement || 50) / 100 }))}
        spectral={harmonicSensitivity}
      />
      {/* Seven Sisters animated overlay */}
      <SevenSistersOverlay intensity={params.glowIntensity} />
      {/* Lunar phase animated overlay (phase from schumann for demo) */}
      <LunarPhaseOverlay phase={(schumannHz % 1)} />


      {/* SpectralWaterfall: Real-time FFT heatmap with tooltips and overlays */}
      <div style={{ margin: '24px 0' }}>
        <div aria-label="Schumann resonance spectral waterfall chart" role="region">
          <SpectralWaterfall
            wsUrl={null} // disables internal WS logic
            fftFrames={fftFrames}
            schumannHz={schumannHz}
            overlay432Hz={true}
          />
        </div>
      </div>

      {/* Audio toggle */}
      <button style={{ position: 'absolute', bottom: 10, left: 10 }} onClick={() => setAudioOn(v => !v)}>
        {audioOn ? 'Stop Audio' : 'Start Audio'}
      </button>
      {/* Pulse cadence indicator */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 12 }}>Pulse: {params.pulseCadence.toFixed(2)} breaths/s</div>
    </div>
  );
}
