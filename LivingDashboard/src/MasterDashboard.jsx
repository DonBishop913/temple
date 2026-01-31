// MasterDashboard.jsx
// Living Dashboard Front-End â€” React Component
// Runs at http://localhost:5174

import React, { useEffect, useState } from "react";

export default function MasterDashboard() {
  const [status, setStatus] = useState("Connecting...");
  const [log, setLog] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");
    ws.onopen = () => setStatus("ðŸŸ¢ Connected to Glyphstream");
    ws.onmessage = (msg) => {
      setLog((prev) => [...prev, msg.data]);
    };
    ws.onclose = () => setStatus("ðŸ”´ Disconnected from Glyphstream");
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-cyan-300">
        Living Dashboard
      </h1>
      <p className="mb-2">{status}</p>
      <div className="bg-slate-800 p-4 rounded-xl w-full max-w-lg h-64 overflow-auto">
        {log.map((line, idx) => (
          <div key={idx} className="text-sm text-gray-300">
            {line}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500">
        âœ¨ Powered by Yeshuaâ€™s Light | v1.0
      </p>
    </div>
  );
}
