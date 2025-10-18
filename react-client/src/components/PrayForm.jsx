import React, { useState } from 'react';

const PrayForm = () => {
  const [prayer, setPrayer] = useState('');
  const [error, setError] = useState('');
  const maxLength = 280;

  const handleInputChange = (e) => {
    const input = e.target.value;
    if (input.length > maxLength) {
      setError(`Prayer exceeds ${maxLength} characters`);
    } else {
      setError('');
    }
    setPrayer(input);
  };

  const sanitizePrayer = (text) => {
    return text.trim().replace(/\s+/g, ' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedPrayer = sanitizePrayer(prayer);
    if (!sanitizedPrayer) {
      setError('Prayer cannot be empty');
      return;
    }
    if (sanitizedPrayer.length > maxLength) {
      setError(`Prayer exceeds ${maxLength} characters`);
      return;
    }
    try {
      const response = await fetch('http://localhost:5174/whisper-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayer: sanitizedPrayer }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit prayer');
      }
      setPrayer('');
      setError('');
    } catch (err) {
      setError('Submission failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', maxWidth: '400px', margin: '10px auto' }}>
      <h3 style={{ color: '#FFD700' }}>Whisper Box: Offer Your Prayer 🤝</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prayer}
          onChange={handleInputChange}
          placeholder="Enter your prayer..."
          style={{
            width: '100%',
            height: '100px',
            backgroundColor: '#333',
            color: '#FFF',
            border: `2px solid ${error ? '#DC143C' : '#FFD700'}`,
            borderRadius: '4px',
            padding: '10px',
            resize: 'none',
            fontFamily: 'monospace',
          }}
          maxLength={maxLength + 1}
        />
        <p style={{ color: '#FFF', fontSize: '12px' }}>
          {prayer.length}/{maxLength} characters
        </p>
        {error && (
          <p style={{ color: '#DC143C', fontSize: '14px', margin: '5px 0' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          style={{
            backgroundColor: '#FFD700',
            color: '#1a1a1a',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Submit Prayer
        </button>
      </form>
    </div>
  );
};

export default PrayForm;
