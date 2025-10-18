import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Two sockets: main API and Guardian Nexus
const socket5174 = io('http://localhost:5174');
const socket5175 = io('http://localhost:5175');

const BurdenTimeline = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    function pushEvent(data) {
      const msg = data.message || JSON.stringify(data);
      setEvents((prev) => [
        ...prev,
        { timestamp: data.timestamp || new Date().toISOString(), message: msg },
      ].slice(-20));
    }

    // Load persisted WhisperBox events
    fetch('http://localhost:5174/api/whisperbox-events')
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          const mapped = list.map((e) => ({ timestamp: e.timestamp, message: `WHISPERBOX: ${e.type} idx=${e.index} approve=${e.approve}` }));
          setEvents((prev) => [...prev, ...mapped].slice(-20));
        }
      })
      .catch(() => {});

    // Main API events (burden, handshake, audit, breathstream, whisper_box)
    socket5174.on('dashboard-update', (data) => {
      if (['burden', 'handshake', 'audit', 'breathstream', 'whisper_box'].includes(data.event)) {
        // Normalize message
        if (data.event === 'audit') {
          data.message = `AUDIT: ${data.nodeID} coherence=${data.coherenceLevel}`;
        } else if (data.event === 'burden') {
          data.message = `BURDEN_ASSUMED: ${data.sourceNode} -> ${data.targetNode} (${data.resourceHandoff})`;
        } else if (data.event === 'breathstream') {
          data.message = data.message || `BREATHSTREAM: ${data.nodeID} aligned`;
        } else if (data.event === 'handshake') {
          data.message = data.message || `HANDSHAKE: ${data.nodeID}`;
        } else if (data.event === 'whisper_box') {
          // keep the incoming message, highlight in UI
          data.message = data.message || `WHISPER_RECEIVED: ${data.nodeID}`;
          data.isWhisper = true;
        }
        pushEvent(data);
      }
    });

    // Guardian Nexus events (codex_sanctity)
    socket5175.on('dashboard-update', (data) => {
      if (data.event === 'codex_sanctity') {
        data.message = data.message || 'CODEX_SANCTITY_CONFIRMED';
        pushEvent(data);
      }
    });

    // Listen for timeline updates (e.g., whisperbox)
    socket5174.on('timeline-update', (data) => {
      if (data && data.event === 'whisperbox') {
        const d = data.detail || data;
        if (d.type === 'prayer' || d.type === 'video-vote') {
          const msg = d.type === 'prayer' ? `WHISPER_RECEIVED: ${d.prayer}` : `WHISPERBOX: ${d.type} idx=${d.index} approve=${d.approve}`;
          pushEvent({ timestamp: d.timestamp || new Date().toISOString(), message: msg, isWhisper: d.type === 'prayer' });
        } else {
          const msg = `WHISPERBOX: ${JSON.stringify(d)}`;
          pushEvent({ timestamp: d.timestamp || new Date().toISOString(), message: msg });
        }
      }
    });

    return () => {
      socket5174.off('dashboard-update');
      socket5175.off('dashboard-update');
    };
  }, []);

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px' }}>
      <h2>Burden Assumption Timeline 🤝</h2>
      <ul>
        {events.map((event, index) => (
          <li key={index} style={{ color: event.isWhisper || (event.message||'').includes('WHISPER_RECEIVED') ? '#FFD700' : '#FFFFFF' }}>
            {`[${event.timestamp}] ${event.message}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BurdenTimeline;
