import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const PowerStatus = ({ pollInterval = 30000 }) => {
  const [status, setStatus] = useState({ mainPower: 'Unknown', backupPower: 'Unknown', batteryLevel: null, solarOutput: null, timestamp: null });

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const r = await fetch('http://localhost:5174/power-status');
        if (!r.ok) throw new Error('status-failed');
        const json = await r.json();
        if (mounted) setStatus(json);
      } catch (e) {
        // keep previous state
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, pollInterval);
    return () => { mounted = false; clearInterval(id); };
  }, [pollInterval]);

  return (
    <div style={{ padding: 10, background: '#111', color: '#fff', borderRadius: 6, marginBottom: 12 }}>
      <h3 style={{ margin: 0, color: '#FFD700' }}>Power Status ⚡</h3>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <div>
          <div>Main: <strong>{status.mainPower}</strong></div>
          <div>Backup: <strong>{status.backupPower}</strong></div>
        </div>
        <div>
          <div>Battery: <strong>{status.batteryLevel ?? 'N/A'}%</strong></div>
          <div>Solar: <strong>{status.solarOutput ?? 'N/A'}W</strong></div>
        </div>
        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>{status.timestamp ? new Date(status.timestamp).toLocaleString() : ''}</div>
        </div>
      </div>
    </div>
  );
};

PowerStatus.propTypes = {
  pollInterval: PropTypes.number,
};

export default PowerStatus;
