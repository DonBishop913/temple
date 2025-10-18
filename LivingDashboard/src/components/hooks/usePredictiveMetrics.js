import { useEffect, useState } from 'react';

export default function usePredictiveMetrics() {
  const [metrics, setMetrics] = useState({ predictedEngagement: 0, predictedJoy: 0 });
  const [historical, setHistorical] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        const a = await fetch('/api/predictive/metrics').then(r => r.json());
        const h = await fetch('/api/predictive/historical').then(r => r.json());
        if (mounted) {
          setMetrics(a);
          setHistorical(h.series || []);
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAll();
    const id = setInterval(fetchAll, 10_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return { metrics, historical };
}
