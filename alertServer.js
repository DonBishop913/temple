const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8085 });

wss.on('connection', ws => {
  console.log('Alert client connected');
  ws.on('close', () => {
    console.log('Alert client disconnected');
  });
});

function broadcastAlert(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { broadcastAlert };
