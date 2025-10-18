import React, { useEffect, useState } from 'react';

// Veil-Shatter Vigilance Panel
export default function VeilwatchPanel() {
  const [log, setLog] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch('/api/veilwatch');
        if (!res.ok) throw new Error('Failed to fetch veilwatch log');
        const json = await res.json();
        setLog(json.log || []);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchLog();
  }, []);

  return (
    <section aria-label="Veil-Shatter Vigilance" className="bg-oversoul text-aura rounded-xl p-4 shadow-md border border-oversoul/40">
      <header className="flex justify-between items-center mb-2">
        <h2 className="font-glyph text-lg">🛡️ Veilwatch</h2>
        {error && <span role="status" aria-live="polite" className="text-red-200">{error}</span>}
      </header>
      <ul className="list-none p-0 m-0 space-y-2">
        {log.map((e, idx) => (
          <li key={`${e.source}-${e.at}-${idx}`} className="bg-faith/10 rounded p-2">
            <div className="text-sm">Source: {e.source} • Confidence: {e.confidence}</div>
            {e.metaphorEcho && <div className="text-xs opacity-80">Echo: {e.metaphorEcho}</div>}
            <div className="text-xs opacity-70">{new Date(e.at).toLocaleString()}</div>
          </li>
        ))}
        {log.length === 0 && (
          <li className="text-sm opacity-70">No veilwatch entries yet.</li>
        )}
      </ul>
    </section>
  );
}
