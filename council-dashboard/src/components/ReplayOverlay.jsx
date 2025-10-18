import React, { useEffect, useState } from 'react';

// Small overlay that connects to the forwarder WS and shows recent replay/control messages
export default function ReplayOverlay({ wsUrl = (process.env.OVERSOUL_WS_URL || 'ws://localhost:8080'), maxEntries = 20 }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    let ws = null;

    const add = (text, kind = 'info', meta = {}) => {
      if (!mounted) return;
      setEntries(prev => {
        const next = [{ id: Date.now() + Math.random(), text, kind, ts: new Date().toLocaleTimeString(), meta }, ...prev];
        return next.slice(0, maxEntries);
      });
    };

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('[ReplayOverlay] ws ctor failed', e);
      add(`ws ctor failed: ${e?.message || String(e)}`, 'error');
      return () => { mounted = false; };
    }

    ws.onopen = () => add('WS open', 'meta');
    ws.onclose = () => add('WS closed', 'meta');
    ws.onerror = (e) => add(`WS error: ${e?.message || String(e)}`, 'error');

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const t = msg && msg.type ? msg.type : 'unknown';
        if (/request_replay|replay|request_scrub|oversoul_pulse_highlight|oversoul_pulse_scrub|oversoul_pulse_batch/.test(t)) {
          let short = '';
          try {
            short = JSON.stringify(msg.payload ? (typeof msg.payload === 'object' ? msg.payload : { v: msg.payload }) : msg).slice(0, 240);
          } catch (e) { short = String(msg); }

          // extract common replay metadata if present
          const meta = {};
          if (msg && typeof msg === 'object') {
            const p = msg.payload || {};
            if (typeof p.sliceIndex !== 'undefined') meta.sliceIndex = p.sliceIndex;
            if (typeof p.chunkIndex !== 'undefined') meta.chunkIndex = p.chunkIndex;
            if (typeof p.batchSize !== 'undefined') meta.batchSize = p.batchSize;
            if (typeof p.startTs !== 'undefined') meta.startTs = p.startTs;
            if (typeof p.endTs !== 'undefined') meta.endTs = p.endTs;
            if (typeof msg.sliceIndex !== 'undefined') meta.sliceIndex = msg.sliceIndex;
            if (typeof msg.chunkIndex !== 'undefined') meta.chunkIndex = msg.chunkIndex;
            if (typeof msg.batchSize !== 'undefined') meta.batchSize = msg.batchSize;
          }

          const kind = t === 'request_replay' ? 'request' : t === 'replay' ? 'replay' : 'control';
          add(`${t} ${short}`, kind, meta);
        }
      } catch (e) {
        const s = typeof ev.data === 'string' ? ev.data.slice(0, 200) : String(ev.data);
        add(`raw: ${s}`, 'info');
      }
    };

    return () => { mounted = false; try { ws?.close(); } catch (e) {} };
  }, [wsUrl, maxEntries]);

  const colorFor = (k) => {
    if (k === 'request') return '#00b7ff';
    if (k === 'replay') return '#22c55e';
    if (k === 'error') return '#ff6b6b';
    if (k === 'meta') return '#9ca3af';
    return '#ffffff';
  };

  return (
    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 6, width: 360, maxHeight: '60vh', overflow: 'auto', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 8, borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>Replay / Control Overlay</strong>
        <button onClick={() => window.location.reload()} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}>Reload</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ padding: '2px 6px', borderRadius: 4, background: '#071133' }}>WS: {wsUrl.replace(/^ws:\/\//, '')}</div>
        <div style={{ padding: '2px 6px', borderRadius: 4, background: '#071133' }}>Entries: {entries.length}</div>
      </div>
      <div>
        {entries.map((e) => (
          <div key={e.id} style={{ borderLeft: `4px solid ${colorFor(e.kind)}`, paddingLeft: 8, marginBottom: 6, opacity: 0.95 }}>
            <div style={{ fontSize: 11, color: '#cbd5e1' }}>[{e.ts}] <span style={{ color: '#fff' }}>{e.text}</span></div>
            {e.meta && Object.keys(e.meta).length > 0 && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop:4 }}>
                {Object.entries(e.meta).map(([k,v]) => (
                  <span key={k} style={{ marginRight: 8 }}>{k}: <strong style={{ color:'#fff' }}>{String(v)}</strong></span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
