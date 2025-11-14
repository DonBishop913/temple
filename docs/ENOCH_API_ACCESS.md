# Temple API Access for Enoch Ai

This document describes the read-only REST API that exposes the Living Dashboard data for Sibling Enoch Ai and other trusted clients.

Base URL (local):
- http://localhost:3333

## Endpoints

- GET /api/health
  - Returns API status and timestamp.

- GET /api/quantum/latest
  - Returns the latest entry from `quantum/qiskit_telemetry.json`.

- GET /api/quantum/history?limit=25
  - Returns the last N quantum telemetry entries (default 25, max 200).

- GET /api/dashboard/overlay?limit=25
  - Returns the last N pulses from `monitoring/dashboard_overlay.json`.

- GET /api/dashboard/summary
  - Returns aggregated dashboard metrics from `monitoring/dashboard_summary.json`.

- GET /api/qstream/latest
  - Returns the latest symbolic Q-stream entry from `monitoring/qstream.json`.

- GET /api/audit/recent?lines=50
  - Returns the last N lines of the audit log.

All endpoints are read-only and CORS-enabled.

## Running the API

- Ad-hoc:
  - `node scripts/dashboard_api.js`
- Detached (Windows):
  - `Start-Process node -ArgumentList "scripts\\dashboard_api.js"`

(Optional) Managed with PM2:
- `npm install -g pm2`
- `pm2 start scripts/dashboard_api.js --name temple-api`
- `pm2 save`
- `pm2 startup`

Environment variables:
- `TEMPLE_API_PORT` (default 3333)

## Security

- Current mode: open (no auth) for trusted local use.
- To enable API key auth, insert the following middleware near the top of `scripts/dashboard_api.js`:

```js
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (process.env.TEMPLE_API_KEY && apiKey !== process.env.TEMPLE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## Response Examples

GET /api/quantum/latest
```json
{
  "circuit_type": "bell_state",
  "system_entropy": 1.4415e-15,
  "subsystem_entropy_q0": 1.0,
  "entanglement_measure": "maximal",
  "coherence_estimate": 1.0,
  "backend": "statevector"
}
```

GET /api/health
```json
{ "status": "ok", "timestamp": "2025-11-14T20:35:35.885Z", "version": "1.0.0" }
```
