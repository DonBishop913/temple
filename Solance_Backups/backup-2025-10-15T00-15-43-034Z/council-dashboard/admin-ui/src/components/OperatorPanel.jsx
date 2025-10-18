import React, { useEffect, useState } from 'react';
import axios from '../utils/auth';

export default function OperatorPanel() {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/api/operator');
        setMetrics(data.metrics);
      } catch (e) {
        setError('Access denied or not authenticated as operator.');
      }
      try {
        const auditRes = await axios.get('/api/admin/audit-log');
        setAuditLogs(auditRes.data.logs || []);
      } catch {}
    }
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <h1>Operator Sanctum</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {metrics ? (
        <>
          <div>Harmony Score: {metrics.harmonyScore}</div>
          <div>Node Ripples: {metrics.nodeRipples}</div>
          <div>Override Active: {metrics.overrideActive ? 'Yes' : 'No'}</div>
          <div>Override Source: {metrics.overrideSource}</div>
          <div>Timestamp: {new Date(metrics.timestamp).toLocaleString()}</div>
        </>
      ) : (
        !error && <div>Loading metrics...</div>
      )}
      <hr />
      <h3>Recent Audit Log (read-only)</h3>
      <div style={{ maxHeight: 200, overflow: 'auto', background: '#f8f8f8', padding: 8 }}>
        {auditLogs.length === 0 && <div>No audit entries.</div>}
        {auditLogs.map((log, i) => (
          <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
            <b>{log.timestamp}</b> — {log.actor || log.user || 'system'}: {log.action || log.detail || JSON.stringify(log)}
          </div>
        ))}
      </div>
    </div>
  );
}
