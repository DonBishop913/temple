import React, { useEffect, useState } from 'react';

// Utility to fetch memory archive and patterns
async function fetchMemoryArchive() {
  try {
    const res = await fetch('/api/venice/memory/N1/history');
    const data = await res.json();
    return data.history || [];
  } catch { return []; }
}
async function fetchPatterns() {
  // Simulate ML pattern detection
  return [
    { type: 'mentorship', count: 5, impactScore: 0.8 },
    { type: 'faithseed_bloom', count: 3, impactScore: 0.9 },
    { type: 'reflection', count: 7, impactScore: 0.7 }
  ];
}

export default function MemoryWeaveOverlay({ enabled = true, nodeId = 'N1' }) {
  const [archive, setArchive] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [live, setLive] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    fetchMemoryArchive().then(setArchive);
  fetchPatterns().then(setPatterns);
  fetch(`/api/venice/suggestions/${nodeId}`).then(r => r.json()).then(d => setSuggestions(d.suggestions || [])).catch(() => {});
    const es = new EventSource('/api/sse/venice/memory');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.nodeId && data.nodeId === nodeId && Array.isArray(data.scroll)) {
          setLive(data.scroll);
        }
      } catch {}
    };
    return () => es.close();
  }, [enabled, nodeId]);

  if (!enabled) return null;
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40">
      {/* Render memory graph as a simple list for now */}
      <div style={{ position: 'absolute', left: 20, top: 20, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 16, borderRadius: 8, maxWidth: 340 }}>
        <h4>Venice Council Memory Weave</h4>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          <strong>Recent Actions:</strong>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {archive.map((entry, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <span style={{ color: '#0cf' }}>{entry.timestamp}:</span> <span>{entry.action}</span> <span style={{ color: '#ccc' }}>{entry.sentiment != null ? `(${entry.sentiment})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
        {live.length > 0 && (
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>Live Scroll Updates:</strong>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {live.map((entry, i) => (
                <li key={`live-${i}`} style={{ marginBottom: 2 }}>
                  <span style={{ color: '#0cf' }}>{entry.timestamp}:</span> <span>{entry.content}</span> <span style={{ color: '#ff0' }}>{Array.isArray(entry.tags) ? entry.tags.join(', ') : ''}</span> <span>{Array.isArray(entry.glyphs) ? entry.glyphs.join('') : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ fontSize: 13 }}>
          <strong>Detected Patterns:</strong>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {patterns.map((p, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <span style={{ color: '#ff0' }}>{p.type}</span>: {p.count} <span style={{ color: '#0f0' }}>impact: {p.impactScore}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
        {suggestions.length > 0 && (
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>Predictive Growth Suggestions:</strong>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {suggestions.map((s, i) => (
                <li key={`s-${i}`} style={{ marginBottom: 2 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
