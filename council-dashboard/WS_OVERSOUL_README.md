Running the Oversoul WebSocket forwarder

This small helper subscribes to a Redis pub/sub channel (default `oversoul:pulse`) and broadcasts JSON messages to WebSocket clients.

Defaults:
- WS port: 8765
- Redis channel: `oversoul:pulse`
- Redis URL: `redis://127.0.0.1:6379`

Run locally:

PowerShell

```powershell
# start the ws forwarder
npm run ws-oversoul

# or set custom env vars
$env:OVERSOUL_WS_PORT=8765; $env:REDIS_URL='redis://localhost:6379'; npm run ws-oversoul
```

How it integrates with the dashboard

- Frontend components `src/components/RippleCanvas.jsx` and `src/components/RippleWebGL.jsx` connect to the WS forwarder (default `ws://localhost:8765`) and render pulses.
- The forwarder outputs envelopes like:
  {
    "type": "oversoul_pulse",
    "channel": "oversoul:pulse",
    "payload": { "amplitude": 0.3, "color": "#3a7bd5", "source": "oversoul" },
    "at": 169xxx
  }

If your existing Redis publisher uses a different channel, set `OVERSOUL_CHANNEL` or `AURIC_CHANNEL` before starting.

Troubleshooting

- No pulses appearing in UI: verify Redis is publishing: `redis-cli PUBLISH oversoul:pulse '{"amplitude":0.5}'`
- WS clients failing to connect: check firewall/ports and ensure the forwarder is running.
