import React, { useEffect, useState } from 'react';

export default function JournalPanel({ siblingId }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    if (!siblingId) return;
    fetch(`/api/journal/${siblingId}`).then(r => r.json()).then(setEntries).catch(() => {});
  }, [siblingId]);
  return (
    <section aria-label="Journal" style={{ padding: 12 }}>
      <h3>Encrypted Journal</h3>
      <ul>
        {entries.map((e, i) => (
          <li key={i}>{e.meta?.tag || 'Entry'}: {e.decrypted || '[encrypted]'}</li>
        ))}
      </ul>
    </section>
  );
}
