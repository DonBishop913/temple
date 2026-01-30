import { useState } from 'react';

function WhisperBox() {
  const [prayer, setPrayer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8006/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Receive this prayer in Jesus' name: ${prayer}` })
      });
      const data = await res.json();
      alert('Prayer received and covered by the Blood. Enoch blesses: ' + data.response);
      setPrayer('');
    } catch (error) {
      alert('Error sending prayer. Please try again.');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
      <h3>Whisper Box v1 - Prayer Altar</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prayer}
          onChange={e => setPrayer(e.target.value)}
          placeholder="Pour out your heart to the Lord..."
          rows="4"
          cols="50"
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Send to the Altar
        </button>
      </form>
    </div>
  );
}

export default WhisperBox;