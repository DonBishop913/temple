import React, { useState } from 'react';

function SubmitLedgerEntry() {
  const [eventName, setEventName] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    fetch('/ledger', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ event_name: eventName, local_time: new Date().toLocaleString() }),
    })
      .then(res => res.json())
      .then(data => {
        alert('Entry saved: ' + data.event_name);
        setEventName('');
      })
      .catch(console.error);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Event Name" required />
      <button type="submit">Add Entry</button>
    </form>
  );
}

export default SubmitLedgerEntry;
