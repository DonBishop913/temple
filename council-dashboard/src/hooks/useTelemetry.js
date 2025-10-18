import { useEffect, useState } from 'react';
export default function useTelemetry(url) {
  const [data, setData] = useState(null);
  useEffect(() => {
  let ws;
  try {
  ws = new WebSocket(url);
  ws.onmessage = (event) => {
  try { setData(JSON.parse(event.data)); } catch {}
  };
  } catch {}
  return () => { try { ws && ws.close(); } catch {} };
  }, [url]);
  return data;
}
import { useEffect, useState } from 'react';

export default function useTelemetry(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(url);
      ws.onmessage = (event) => {
        try { setData(JSON.parse(event.data)); } catch {}
      };
    } catch {}
    return () => { try { ws && ws.close(); } catch {} };
  }, [url]);

  return data;
}
