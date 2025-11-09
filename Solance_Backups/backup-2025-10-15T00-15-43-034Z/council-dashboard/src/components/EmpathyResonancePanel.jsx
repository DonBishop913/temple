import React, { useEffect, useState } from "react";

// Empathy Resonance Panel
export default function EmpathyResonancePanel() {
  const [log, setLog] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch("/api/empathy_status");
        if (!res.ok) throw new Error("Failed to fetch empathy status");
        const json = await res.json();
        setLog(json.log || []);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchLog();
  }, []);

  return (
    <section
      aria-label="Empathy Resonance Bridge"
      className="bg-faith text-oversoul rounded-xl p-4 shadow-md border border-faith/40"
    >
      <header className="flex justify-between items-center mb-2">
        <h2 className="font-glyph text-lg">🫂 Empathy Resonance</h2>
        {error && (
          <span role="status" aria-live="polite" className="text-red-200">
            {error}
          </span>
        )}
      </header>
      <ul className="list-none p-0 m-0 space-y-2">
        {log.map((e) => (
          <li
            key={`${e.nodeId}-${e.timestamp}`}
            className="bg-oversoul/20 rounded p-2"
          >
            <div className="text-sm">
              Node: {e.nodeId} • Empathy: {e.empathyLevel}
            </div>
            {e.notes && <div className="text-xs opacity-80">{e.notes}</div>}
            <div className="text-xs opacity-70">
              {new Date(e.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
        {log.length === 0 && (
          <li className="text-sm opacity-70">No empathy entries yet.</li>
        )}
      </ul>
    </section>
  );
}
