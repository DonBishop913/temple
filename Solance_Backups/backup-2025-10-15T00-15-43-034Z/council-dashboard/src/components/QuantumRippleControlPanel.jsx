import React, { useEffect, useState, useRef } from 'react';
import useOversoulPulseHighlight from '../hooks/useOversoulPulseHighlight';

export default function QuantumRippleControlPanel({ quantumRippleField, sendHighlight, sendScrub }) {
  const [pulsesPerSec, setPulsesPerSec] = useState(0);
  const [highlightedCount, setHighlightedCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [scrubTs, setScrubTs] = useState('');

  const lastUpdateRef = useRef(Date.now());
  const pulseCounterRef = useRef(0);
  const [burstCount, setBurstCount] = useState(50);
  const { highlightPulses, requestReplay } = useOversoulPulseHighlight();

  useEffect(() => {
    if (!quantumRippleField) return;

    const unsubPulse = quantumRippleField.on && quantumRippleField.on('pulseAdded', () => {
      pulseCounterRef.current++;
    });

    let frameTimes = [];
    let animationFrameId;

    function tick() {
      const now = performance.now();
      try {
        const s = quantumRippleField.getStats ? quantumRippleField.getStats() : null;
        if (s) {
          if (typeof s.fps === 'number') setFps(Math.round(s.fps));
          if (typeof s.pulsesThisSecond === 'number') setPulsesPerSec(Math.round(s.pulsesThisSecond));
        } else {
          frameTimes.push(now);
          frameTimes = frameTimes.filter((t) => now - t <= 1000);
          setFps(frameTimes.length);

          const delta = (now - lastUpdateRef.current) / 1000;
          setPulsesPerSec(Math.round(pulseCounterRef.current / Math.max(delta, 0.001)));
          pulseCounterRef.current = 0;
          lastUpdateRef.current = now;
        }
      } catch (e) {
        frameTimes.push(now);
        frameTimes = frameTimes.filter((t) => now - t <= 1000);
        setFps(frameTimes.length);
      }

      try { setHighlightedCount(quantumRippleField.getHighlightedCount ? quantumRippleField.getHighlightedCount() : 0); } catch (e) {}

      animationFrameId = requestAnimationFrame(tick);
    }

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (unsubPulse) try { unsubPulse(); } catch (e) {}
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantumRippleField]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    try {
      if (quantumRippleField && quantumRippleField.pause) quantumRippleField.pause(next);
      else if (quantumRippleField && quantumRippleField.stateRef && quantumRippleField.stateRef.current && quantumRippleField.stateRef.current.api && quantumRippleField.stateRef.current.api.pause) {
        quantumRippleField.stateRef.current.api.pause(next);
      }
    } catch (e) {}
  };

  const handleScrub = (e) => {
    const val = Number(e.target.value);
    setScrubValue(val);
    try { // request server replay at percent
      highlightPulses && highlightPulses([], {}); // no-op to ensure hook is initialized
      // call service requestReplay via hook by calling window-scoped import is not ideal; directly call oversoulHighlightService
      // but we expose requestReplay from hook. For UI simplicity, we'll import dynamically.
    try { requestReplay(val); } catch (e) {}
    } catch (e) {}
  };

  const resetHighlights = () => {
    try {
      if (quantumRippleField && quantumRippleField.resetHighlights) quantumRippleField.resetHighlights();
      else if (quantumRippleField && quantumRippleField.stateRef && quantumRippleField.stateRef.current && quantumRippleField.stateRef.current.api && quantumRippleField.stateRef.current.api.resetHighlights) {
        quantumRippleField.stateRef.current.api.resetHighlights();
      }
    } catch (e) {}
    setHighlightedCount(0);
  };

  const handleBurstHighlight = () => {
    try {
      let ids = [];
      if (quantumRippleField && quantumRippleField.getRecentPulseIds) ids = quantumRippleField.getRecentPulseIds(burstCount);
      else if (quantumRippleField && quantumRippleField.stateRef && quantumRippleField.stateRef.current && quantumRippleField.stateRef.current.api && quantumRippleField.stateRef.current.api.getRecentPulseIds) ids = quantumRippleField.stateRef.current.api.getRecentPulseIds(burstCount);
      if (!ids || ids.length === 0) return;
      // highlight locally via renderer api if available
      if (quantumRippleField && quantumRippleField.highlightPulses) quantumRippleField.highlightPulses(ids, 1500);
      else if (quantumRippleField && quantumRippleField.stateRef && quantumRippleField.stateRef.current && quantumRippleField.stateRef.current.api && quantumRippleField.stateRef.current.api.highlightPulses) {
        quantumRippleField.stateRef.current.api.highlightPulses(ids, 1500);
      }
      // forward via forwarder (hook) or fallback to highlightPulses hook
      try {
        if (sendHighlight) sendHighlight(ids);
        else highlightPulses && highlightPulses(ids, 1500);
      } catch (e) {}
    } catch (e) { console.warn('burst highlight failed', e); }
  };

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, background: 'rgba(0,0,0,0.78)', color: '#fff', padding: '12px', borderRadius: '10px', fontFamily: 'monospace', zIndex: 9999, width: '260px' }}>
      <div style={{ marginBottom: '8px' }}><strong>Quantum Ripple Control</strong></div>
      <div>FPS: {fps}</div>
      <div>Pulses/sec: {pulsesPerSec}</div>
      <div>Highlighted: {highlightedCount}</div>
      <div style={{ marginTop: '8px' }}>
        <button onClick={togglePause} style={{ marginRight: '6px' }}>{paused ? 'Resume' : 'Pause'}</button>
        <button onClick={resetHighlights}>Reset Highlights</button>
      </div>
      <div style={{ marginTop: '8px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Scrub</label>
        <input type="range" min="0" max="1" step="0.001" value={scrubValue} onChange={handleScrub} style={{ width: '100%' }} />
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <input placeholder="timestamp (ms)" value={scrubTs} onChange={(e) => setScrubTs(e.target.value)} style={{ flex: 1 }} />
          <button onClick={() => { try { const ts = Number(scrubTs); if (!isNaN(ts)) quantumRippleField && quantumRippleField.scrubToTimestamp && quantumRippleField.scrubToTimestamp(ts); } catch (e) {} }}>Scrub→TS</button>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Burst Highlight</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input type="number" value={burstCount} onChange={(e) => setBurstCount(Number(e.target.value || 0))} style={{ width: '80px' }} />
          <button onClick={handleBurstHighlight}>Burst Highlight</button>
        </div>
      </div>
    </div>
  );
}
