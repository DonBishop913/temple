import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import axios from '../utils/auth';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [harmony, setHarmony] = useState({ score: 0, status: '' });
  const [energy, setEnergy] = useState({ flowRate: 0, unit: '' });
  const [override, setOverride] = useState({ active: false, source: '' });
  const [message, setMessage] = useState('');
  const [alertMsg, setAlertMsg] = useState('Sacred ritual preview message');

  // Fetch and update logic omitted for brevity

  return (
    <div>
      <h2>Welcome, {user?.username}</h2>
      <button onClick={logout}>Logout</button>
      {/* Node, Harmony, Energy, Override management UIs here */}
      <div>{message}</div>
      <hr />
      <h3>Ritual Alert Test</h3>
      <input value={alertMsg} onChange={e => setAlertMsg(e.target.value)} style={{ width: '100%' }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={async () => {
          await axios.post('/api/admin/alert/test', { category: 'ritual', message: alertMsg });
          setMessage('Alert preview dispatched.');
        }}>Send Ritual Preview</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <Link to="/onboard">Open Onboarding Wizard</Link>
      </div>
    </div>
  );
}
