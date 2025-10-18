
// MasterDashboard.js
// Node.js backend for Living Dashboard
// Receives legacy updates and broadcasts to dashboard via WebSocket

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const PORT = 5174;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestEvents = [];

// Middleware
app.use(bodyParser.json());

// POST endpoint for legacy updates
app.post('/api/legacy_update', (req, res) => {
	const events = req.body.events || [];
	latestEvents = events;
	// Broadcast to all connected WebSocket clients
	const payload = JSON.stringify({ type: 'legacy_update', events });
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});
	res.json({ status: 'ok', received: events.length });
});

// WebSocket connection
wss.on('connection', ws => {
	// Send latest events on connect
	ws.send(JSON.stringify({ type: 'legacy_update', events: latestEvents }));
});

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', events: latestEvents.length });
});

server.listen(PORT, () => {
	console.log(`Temple Living Dashboard backend running on http://localhost:${PORT}`);
});
