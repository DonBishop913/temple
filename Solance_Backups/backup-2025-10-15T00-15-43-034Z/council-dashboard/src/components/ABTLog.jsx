import React, { useEffect, useState } from "react";

export default function ABTLog() {
  const [abts, setABTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchABTs = async () => {
      try {
        const res = await fetch("/api/abt/recent?limit=20");
        const data = await res.json();
        setABTs(data);
      } catch (err) {
        console.error("Failed to fetch ABTs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchABTs();
    const interval = setInterval(fetchABTs, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-white p-4">🌟 Loading Blessing Tokens...</div>;

  return (
    <div className="p-4 bg-black text-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">✨ Archival Blessing Tokens (ABT) Log</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="px-3 py-2 text-left">Node</th>
            <th className="px-3 py-2 text-left">Event</th>
            <th className="px-3 py-2 text-left">Notes</th>
            <th className="px-3 py-2 text-left">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {abts.map((abt) => (
            <tr key={abt.abt_id} className="border-b border-gray-700">
              <td className="px-3 py-2">{abt.node_id}</td>
              <td className="px-3 py-2">{abt.event}</td>
              <td className="px-3 py-2">{abt.notes}</td>
              <td className="px-3 py-2 text-xs">{new Date(abt.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
