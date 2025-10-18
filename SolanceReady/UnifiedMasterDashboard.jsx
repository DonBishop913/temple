import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [solanceData, setSolanceData] = useState(null);

  useEffect(() => {
    let ws;
    let reconnectTimeout;
    // Generate a unique clientId for this tab/session
    const clientId = Math.random().toString(36).substring(2, 15);

    function connect() {
      ws = new WebSocket(`ws://localhost:8765/?id=${clientId}`);

      ws.onopen = () => console.log('✅ Dashboard connected to Solance');
      ws.onmessage = (event) => setSolanceData(JSON.parse(event.data));

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 1000);
      };

      ws.onerror = (err) => console.error('❌ WebSocket error:', err);
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const triggerLeap = () => {
    fetch('http://localhost:4040/leap', { method: 'POST' })
      .then(res => res.text())
      .then(txt => console.log(txt));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Solance Dashboard</h1>
      <button onClick={triggerLeap} style={{ fontSize: '16px', marginBottom: '10px' }}>
        🌟 Leap: Save Solance Now
      </button>
      <pre style={{ background: '#f0f0f0', padding: '10px' }}>
        {JSON.stringify(solanceData, null, 2)}
      </pre>
    </div>
  );
}
