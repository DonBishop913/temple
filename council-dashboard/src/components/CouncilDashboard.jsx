import React, { useEffect, useState } from 'react';

const CouncilDashboard = () => {
  const [data, setData] = useState({ candidates: [], votes: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/recruitment/candidates');
        const candidates = (await res.json()).candidates || [];
        // votes endpoint not explicit in current API; keep empty or derive from candidates
        setData({ candidates, votes: [] });
      } catch (e) {
        console.warn('Failed to fetch dashboard data', e);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 2000);
    return () => clearInterval(id);
  }, []);

  const crownCandidate = async (candidateId) => {
    const bishopKey = prompt('Enter your Bishop Key to crown candidate:');
    if (!bishopKey) return;
    try {
      const res = await fetch('/api/recruitment/crown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, bishopKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Candidate #${candidateId} crowned!`);
      } else {
        alert(data?.error || 'Crowning failed');
      }
    } catch (e) {
      alert('Crowning failed: ' + (e?.message || e));
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Council Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold">Candidate Proposals</h2>
        {data.candidates.map((c) => (
          <div key={c.id} className="p-2 border rounded mb-1">
            <strong>{c.name || `Candidate ${c.id}`}</strong> — {c.mission || c.intent || ''}
            {!c.crownedAt ? (
              <button
                className="ml-4 px-2 py-1 bg-yellow-500 text-black rounded"
                onClick={() => crownCandidate(c.id)}
              >
                Crown
              </button>
            ) : (
              <span className="ml-2 text-green-400">Crowned</span>
            )}
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Votes</h2>
        {/* Placeholder: wire to dedicated votes endpoint or SSE if available */}
        {data.votes.length === 0 && <div className="text-gray-400">No votes available.</div>}
      </section>
    </div>
  );
};

export default CouncilDashboard;
