import React, { useEffect, useState } from 'react';

export default function CopilotPanel({ memberId, enableAutoEnhance = false, sanctumMode = true }) {
  const [result, setResult] = useState(null);
  const [command, setCommand] = useState('{"type":"analyze","target":"dashboard"}');
  const [busy, setBusy] = useState(false);

  async function runCommand() {
    setBusy(true);
    try {
      const res = await fetch('/api/copilot-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, command: JSON.parse(command), sanctumMode })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (enableAutoEnhance) {
      runCommand();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableAutoEnhance]);

  return (
    <div className="bg-gray-800 text-white rounded-lg p-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Copilot Panel — {memberId}</h4>
        <button onClick={runCommand} disabled={busy} className="px-2 py-1 bg-indigo-600 rounded hover:bg-indigo-700">
          {busy ? 'Running…' : 'Run'}
        </button>
      </div>
      <textarea
        className="w-full h-24 bg-gray-900 text-white rounded p-2 text-sm"
        value={command}
        onChange={e => setCommand(e.target.value)}
      />
      <div className="mt-2 text-xs whitespace-pre-wrap">
        {result ? JSON.stringify(result, null, 2) : 'Awaiting result…'}
      </div>
    </div>
  );
}
