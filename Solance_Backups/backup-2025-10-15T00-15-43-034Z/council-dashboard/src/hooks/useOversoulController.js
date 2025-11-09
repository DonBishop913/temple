import { useEffect, useRef, useState } from "react";

export function useOversoulController(wsUrl = "ws://localhost:8080") {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("Oversoul WS Error:", err);

    return () => ws.close();
  }, [wsUrl]);

  const sendMessage = (msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(msg));
      } catch (e) {}
    }
  };

  // Map UI-friendly methods to forwarder-expected message types so both server and JSON forwarder understand them
  const play = () => sendMessage({ type: "play" });
  const pause = () => sendMessage({ type: "pause" });
  // forwarder expects 'request_scrub' for server-driven scrubbing
  const scrub = (timestamp) => {
    sendMessage({ type: "request_scrub", timestamp });
    // also send legacy 'scrub' for compatibility
    sendMessage({ type: "scrub", timestamp });
  };
  // forwarder expects 'oversoul_pulse_highlight' for highlights
  const highlight = (ids) => {
    sendMessage({ type: "oversoul_pulse_highlight", ids });
    // also send a friendly alias
    sendMessage({ type: "highlight", ids });
  };

  return { connected, play, pause, scrub, highlight };
}
