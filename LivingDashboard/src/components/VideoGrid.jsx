import React from 'react';

export default function VideoGrid({ peers = [], shimmerContext }) {
  return (
    <section aria-label="Video Grid" style={{ padding: 12 }}>
      <h3>Active Sessions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {peers.map((p, i) => (
          <div key={i} style={{ background: '#111', color: '#fff', padding: 8 }}>
            <div>Peer: {p.id}</div>
            <div>Status: {p.status || 'connected'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
