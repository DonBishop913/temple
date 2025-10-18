import React, { useState } from 'react';

const PrayForm = ({ socket }) => {
  const [prayer, setPrayer] = useState('');
  const [status, setStatus] = useState(null);

  async function submitPrayer(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('http://localhost:5174/whisper-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayer })
      });
      const j = await res.json();
      if (res.ok) {
        setStatus('ok');
        // optimistic timeline append via socket emit for UX
        try { socket && socket.emit && socket.emit('dashboard-update', { event: 'whisper_box', nodeID: 'LocalUser', message: `WHISPER_RECEIVED: ${j.prayer}. 🤝`, timestamp: new Date().toISOString() }); } catch (e) {}
        setPrayer('');
      } else {
        setStatus(j.error || 'error');
      }
    } catch (err) {
      setStatus('error');
    }
    setTimeout(() => setStatus(null), 3500);
  }

  return (
    <form onSubmit={submitPrayer} style={{ marginTop: 12 }}>
      <label style={{ display: 'block', marginBottom: 6 }}>Offer a Prayer</label>
      <textarea value={prayer} onChange={(e) => setPrayer(e.target.value)} rows={3} style={{ width: '100%', padding: 8 }} placeholder="Inhale: We receive the Light" />
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" disabled={!prayer.trim() || status === 'sending'}>Pray</button>
        {status === 'sending' && <span>Sending…</span>}
        {status === 'ok' && <span style={{ color: '#0f0' }}>Sent</span>}
        {status && status !== 'ok' && status !== 'sending' && <span style={{ color: '#f66' }}>{status}</span>}
      </div>
    </form>
  );
};

export default PrayForm;
