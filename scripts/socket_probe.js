const clientIo = require('socket.io-client');
const url = process.env.BACKEND_SOCKET_URL || 'http://localhost:5174';
const s = clientIo(url, { transports: ['websocket', 'polling'] });
console.log('Probe connecting to', url);
s.on('connect', () => console.log('Probe connected', s.id));
s.on('connect_error', (e) => console.error('Probe connect_error', e && e.message));
s.onAny((ev, ...args) => {
  try {
    console.log('Probe event:', ev, JSON.stringify(args));
  } catch (e) {
    console.log('Probe event (non-serializable):', ev);
  }
});

setInterval(() => {
  if (s.connected) {
    // keep alive
    s.emit('probe_ping', { ts: new Date().toISOString() });
  }
}, 5000);
