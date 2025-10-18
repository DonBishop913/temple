import { useEffect, useRef } from 'react';

export function useOversoulPulseForwarder(quantumRippleRef, wsUrl = 'ws://localhost:8080') {
  const wsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    function connect() {
      if (!mounted) return;
      try {
        wsRef.current = new WebSocket(wsUrl);
      } catch (e) {
        console.error('[useOversoulPulseForwarder] ws ctor failed', e);
        setTimeout(connect, 2000);
        return;
      }

      wsRef.current.onopen = () => {
        console.log('[useOversoulPulseForwarder] connected to', wsUrl);
      };

      wsRef.current.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg && msg.type === 'oversoul_pulse_batch') {
            // if payload is an array of pulses, push them directly
            if (Array.isArray(msg.payload) && quantumRippleRef?.current?.api?.addPulses) {
              quantumRippleRef.current.api.addPulses(msg.payload);
            } else if (msg.payload && quantumRippleRef?.current?.api?.addPulses) {
              // single snapshot object -> synthesize an array-like payload
              quantumRippleRef.current.api.addPulses(Array.isArray(msg.payload) ? msg.payload : [msg.payload]);
            }
          }
          if (msg && msg.type === 'oversoul_pulse_highlight' && quantumRippleRef?.current?.api?.highlightPulses) {
            quantumRippleRef.current.api.highlightPulses(msg.ids || []);
          }

          // server-driven scrub (timestamp-based)
          if (msg && msg.type === 'oversoul_pulse_scrub') {
            try {
              const ts = msg.timestamp || msg.payload || 0;
              if (quantumRippleRef?.current?.api?.scrubToTimestamp) quantumRippleRef.current.api.scrubToTimestamp(ts);
              else if (quantumRippleRef?.current?.api?.scrubTo) quantumRippleRef.current.api.scrubTo(ts);
              else if (quantumRippleRef?.current?.scrubToTimestamp) quantumRippleRef.current.scrubToTimestamp(ts);
            } catch (e) { /* ignore */ }
          }
        } catch (e) {
          console.error('[useOversoulPulseForwarder] parse error', e);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('[useOversoulPulseForwarder] ws error', err);
      };

      wsRef.current.onclose = () => {
        console.log('[useOversoulPulseForwarder] ws closed. reconnecting...');
        setTimeout(connect, 2000);
      };
    }

    connect();
    return () => { mounted = false; try { wsRef.current?.close(); } catch (e) {} };
  }, [quantumRippleRef, wsUrl]);

  // helpers to send highlight / scrub messages via the forwarder
  const sendHighlight = (ids) => {
    try { wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: 'oversoul_pulse_highlight', ids })); } catch (e) {}
  };

  const sendScrub = (timestamp) => {
    try { wsRef.current && wsRef.current.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: 'oversoul_pulse_scrub', timestamp })); } catch (e) {}
  };

  return { sendHighlight, sendScrub };
}
