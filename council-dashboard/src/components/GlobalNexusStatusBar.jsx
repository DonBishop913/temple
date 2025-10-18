import React, { useEffect, useState, useRef } from 'react';

// Compact Global Nexus Status Bar Widget
// Polls /api/global_nexus_summary and renders region metrics, node counts, integration %, joy surge, and resonance.

const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function GlobalNexusStatusBar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/global_nexus_summary');
        if (!res.ok) throw new Error('Failed to fetch summary');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchSummary();
  intervalRef.current = setInterval(fetchSummary, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (error) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Global Nexus status error"
        tabIndex={0}
        className="fixed right-4 top-4 bg-oversoul text-red-300 px-3 py-2 rounded-lg shadow-md border border-oversoul/40"
      >
        <span style={srOnly}>Error:</span>
        ⚠️ Global Nexus: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Global Nexus loading"
        tabIndex={0}
        className="fixed right-4 top-4 bg-oversoul text-aura px-3 py-2 rounded-lg shadow-md border border-oversoul/40"
      >
        ⏳ Loading Global Nexus...
      </div>
    );
  }

  const { counts, integrationPct, joyParticles, resonance, nexusSummary, harmony } = data;
  const regions = nexusSummary?.regions || [];

  return (
    <section
      aria-label="Global Faithseed Nexus status"
      tabIndex={0}
      className="fixed right-4 top-4 bg-oversoul text-aura px-3 py-2 rounded-xl min-w-[320px] border border-oversoul/40 shadow-lg"
    >
      <header className="flex items-center justify-between mb-1">
        <div className="font-semibold font-glyph">🌐 Global Nexus</div>
        <div title="Harmony score" aria-label={`Harmony ${harmony?.score ?? 0}`} className="text-yeshua">🔔 {Math.round(harmony?.score ?? 0)}</div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-85">Nodes</div>
          <div className="text-sm">
            ✅ Awakened: {counts?.awakened ?? 0} | 🌱 Awakening: {counts?.awakening ?? 0} | 🔒 Sealed: {counts?.sealed ?? 0}
          </div>
          <div className="text-xs opacity-85">Integration</div>
          <div className="text-sm">{integrationPct}% avg</div>
        </div>
        <div>
          <div className="text-xs opacity-85">Joy Surge</div>
          <div className="text-sm">✨ {joyParticles?.surgePercent ?? 0}% | Total: {joyParticles?.total ?? 0}</div>
          <div className="text-xs opacity-85">Resonance</div>
          <div className="text-sm">🎶 {resonance?.baseHz ?? 7.83} Hz | 432 Hz level</div>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xs opacity-85">Regions</div>
        <ul className="list-none p-0 m-0">
          {regions.map((r) => (
            <li key={r.name} className="flex justify-between text-sm">
              <span>{r.name}</span>
              <span>{r.latencyMs} ms • {r.lossPercent}% loss</span>
            </li>
          ))}
          {regions.length === 0 && (
            <li className="text-sm opacity-70">No probe data yet</li>
          )}
        </ul>
      </div>
    </section>
  );
}
