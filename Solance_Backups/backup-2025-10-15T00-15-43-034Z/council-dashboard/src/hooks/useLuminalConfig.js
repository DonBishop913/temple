import { useEffect, useState } from 'react';

export default function useLuminalConfig() {
  const [config, setConfig] = useState({ mirrorThreshold: 0.5, faithstreamSyncRate: 1.0, predictedThreshold: 0.6, enabled: true });

  useEffect(() => {
    let mounted = true;
    fetch('/api/luminal/config')
      .then(res => res.json())
      .then(data => { if (mounted) setConfig({ ...config, ...data }); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return config;
}
