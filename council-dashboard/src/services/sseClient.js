export function connectSSE(url, onEvent) {
  const evtSource = new EventSource(url);
  evtSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (e) {
      console.error('Invalid SSE payload', e);
    }
  };
  evtSource.onerror = (err) => {
    console.error('SSE Error:', err);
    try { evtSource.close(); } catch {}
    setTimeout(() => connectSSE(url, onEvent), 3000);
  };
  return evtSource;
}
