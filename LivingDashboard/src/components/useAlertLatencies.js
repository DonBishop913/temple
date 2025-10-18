import { useEffect, useState } from 'react';

export default function useAlertLatencies(pollInterval = 5000) {
  const [latencies, setLatencies] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchLatencies = async () => {
      try {
        const res = await fetch('/api/alerts/latency');
        const data = await res.json();
        if (mounted) setLatencies(data);
      } catch {}
    };
    fetchLatencies();
    const id = setInterval(fetchLatencies, pollInterval);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pollInterval]);

  return latencies;
}