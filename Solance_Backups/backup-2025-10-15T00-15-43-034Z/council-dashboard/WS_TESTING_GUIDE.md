## Schumann Simulator Toggle

The backend Schumann generator is controlled by the `SCHUMANN_SIM_ENABLED` environment variable:

- `SCHUMANN_SIM_ENABLED=true` (default in Compose/dev): Simulator runs and emits Schumann data.
- `SCHUMANN_SIM_ENABLED=false`: Simulator is disabled; no Schumann data is generated or streamed.

Set this variable in your environment or Compose file as needed for your use case (dev, CI, production).
# WebSocket Testing Guide (Council Dashboard)

This guide documents pragmatic, reliable practices for testing the Council Dashboard WebSocket telemetry in local dev and CI.

## Goals
- Validate a live WS server end-to-end (no mocks).
- Ensure connection stability, payload correctness, and resilience under reconnects.
- Provide simple CLI probe and formal Jest integration tests.

## Components
- WebSocket Server: `server/server.js` (port 4322), streams JSON messages with `type` and `payload` keys.
- Probe: `scripts/ws-probe.js` — quick health signal, configurable via env.
- Integration Test: `src/__tests__/wsIntegration.test.js` — structured, waits for messages and simulates reconnect.
 - Schumann Generator: `server/schumannGenerator.js` — simulates ~7.83 Hz fundamental + harmonics and writes snapshots to Redis.
 - Schumann Overlay: `src/components/SchumannOverlay.jsx` — visualizes real-time Schumann spectrum from WS stream.

## Local Run
1. Start services via Docker Compose:
   - Root compose builds the dashboard image.
   - Backend compose starts Redis + API/WS with health checks.
2. Run quick probe:
   - `npm run probe:ws --prefix council-dashboard`
3. Run integration tests:
   - `npm run test:node --prefix council-dashboard -- src/__tests__/wsIntegration.test.js`

## Probe Behavior
- Default URL: `ws://localhost:4322` (override via `WS_URL`).
- Attempts: `WS_ATTEMPTS` (default 5) with exponential backoff (`WS_BACKOFF_MS`).
- Readiness delay: `WS_READY_DELAY_MS` (default 500ms).
- Pass criteria: initial burst of ≥3 types OR full expected set.
- Payload shape checks: ensures `type` and `payload` keys; validates array payloads for `nodes` and `planetary`.

## Integration Test Essentials
- Use `ws` client; avoid HTTP wrappers.
- Set explicit timeouts; await messages via Promises.
- Validate payloads and reconnect flow.
- Clean up sockets to avoid resource leaks.

## CI Recommendations
- Build and start services (Redis + API) with health checks.
- Poll API (/metrics) and WS port (4322) readiness.
- Run probe first for fast fail, then jest integration test.
- Collect container logs on failure for diagnostics.

## Troubleshooting
- Socket hang up: ensure WS URL is `ws://localhost:4322`; wait for health before connecting.
- ECONNREFUSED: verify REDIS_URL inside container (`redis://council_redis:6379`) and health dependency.
- Stale data: add reconnect scenarios and stale/no-data assertions in tests.
 - Schumann not visible: confirm generator is running (server starts it) and WS stream includes `type: 'schumann'` payload.

## Maintenance Tips
- Keep payload contracts consistent (`type`, `payload`).
- Extend probe/test to new telemetry types minimally (array/object checks).
- Update CI workflow on port or env changes.

---
For questions or improvements, consider adding scenarios like burst throttling, client backpressure, and multi-client behavior.
