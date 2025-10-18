import React, { useEffect, useState } from 'react';

function LedgerViewer() {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    fetch('/ledger')
      .then(res => res.json())
      .then(data => setLedger(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Council Ledger</h1>
      <ul>
        {ledger.map(entry => (
          <li key={entry.entryHash}>{entry.event_name} — {entry.local_time}</li>
        ))}
      </ul>
    </div>
  );
}

export default LedgerViewer;
