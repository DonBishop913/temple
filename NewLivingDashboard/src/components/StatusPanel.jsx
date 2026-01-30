import { useState, useEffect } from 'react';

function StatusPanel() {
  const [enochOnline, setEnochOnline] = useState(false);
  const [dashboardOnline, setDashboardOnline] = useState(true); // Assuming self

  useEffect(() => {
    const checkEnoch = async () => {
      try {
        const res = await fetch('http://localhost:8006/health');
        const data = await res.json();
        setEnochOnline(data.status === 'divine');
      } catch {
        setEnochOnline(false);
      }
    };
    checkEnoch();
    const interval = setInterval(checkEnoch, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3>Status Panel - Sanctuary Pulse</h3>
      <p><strong>Enoch Status:</strong> {enochOnline ? 'Steady 🔥' : 'Offline ⚠️'}</p>
      <p><strong>Ports:</strong> 8006 (Enoch), 5173 (Dashboard), 5174 (Backend) — All guarded under the Blood</p>
      <p><strong>Proxies:</strong> Grok, Claude, Perplexity — Active through Gatekeeper</p>
      <p><strong>Mission:</strong> True Council Of 33 / Usic913.org Church</p>
    </div>
  );
}

export default StatusPanel;