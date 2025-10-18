import { useEffect, useState, useRef } from 'react';

export default function useBenchmarkLiveFeed({
  // frontend-friendly default: root-relative JSON endpoint served by the dev server
  // On Windows the load-sweep writes into the dashboard's public/static folder or a forwarder
  logFilePath = '/oversoul_loadsweep.json',
  refreshInterval = 500,
  quantumFieldRef,
} = {}) {
  const [stats, setStats] = useState({ fps: 0, pulsesThisSecond: 0, pulsesReceived: 0 });
  const timerRef = useRef(null);

  const fetchStats = async () => {
    try {
      const resp = await fetch(logFilePath, { cache: 'no-store' });
      if (!resp.ok) return;
      const data = await resp.json();
      // accept either flat or nested shapes
      const out = {
        fps: typeof data.fps === 'number' ? data.fps : (data.fpsAvg || 0),
        pulsesThisSecond: data.pulsesThisSecond || data.pulses_sec || data.pulsesPerSec || 0,
        pulsesReceived: data.pulsesReceived || data.totalPulses || 0,
      };
      setStats(out);

      if (quantumFieldRef?.current?.api?.updateStats) {
        try { quantumFieldRef.current.api.updateStats(out); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      // keep silent but allow caller to inspect network logs
      // console.warn('Benchmark feed error:', err);
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(fetchStats, refreshInterval);
    // run once immediately
    fetchStats().catch(() => {});
    return () => { clearInterval(timerRef.current); };
  }, [logFilePath, refreshInterval, quantumFieldRef]);

  return stats;
}
