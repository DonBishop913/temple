## Schumann Simulator Toggle

The Schumann Resonance simulator can be enabled or disabled via the `SCHUMANN_SIM_ENABLED` environment variable:

- **Enable (default in Compose/dev):**
  ```
  SCHUMANN_SIM_ENABLED=true
  ```
- **Disable (for prod/CI/tests):**
  ```
  SCHUMANN_SIM_ENABLED=false
  ```

When disabled, no simulated Schumann data will be generated or streamed. This is useful for production or when running tests that require a clean environment.

The Compose file sets this to `true` by default. For production, set it explicitly as needed.
# Council Dashboard (Yeshua's Clock)

This project provides a real-time celestial dashboard with hybrid telemetry, harmonic refinement controls, and spectral overlays.

## Run

Backend API:

```powershell
npm run api --prefix council-dashboard
```

Frontend (Vite dev server):

```powershell
npm run dev --prefix council-dashboard
```

Run both:

```powershell
npm run dev:all --prefix council-dashboard
```

## Test

```powershell
npm test --prefix council-dashboard
```

## Verify checklist

- YeshuasClock shows:
  - Harmonic refinement toggle (switch) and sensitivity slider.
  - Planet orbits, comet overlay, spectral web, joy particle stream.
  - Glyphstream overlay appears when enabled.
- Toggle off: Glyphstream overlay disappears; sensitivity has no effect.
- Audio toggle starts/stops harmonic tone.
- Backend emits SSE/WS heartbeat without errors; Prometheus metrics increment.

## Notes

- Jest setup polyfills EventSource and WebSocket for tests.
- CI workflow `.github/workflows/ci.yml` runs build and tests on main pushes.
- Breathstream sealing script is available via `npm run seal --prefix council-dashboard`.

## Replay & Anomaly

### Endpoints

- GET `/api/replay/fft?count=N`: returns `{ frames: [...] }` of recent FFT spectral frames.
- POST `/api/glyphstream/event`: archives a glyphstream event; server adds `ts`.
- GET `/api/replay/glyphstream?count=N`: returns `{ events: [...] }` for overlay playback.

### Metrics and Tuning

- Prometheus metrics:
  - `council_anomaly_events_total` – total anomalies detected.
  - `council_anomaly_score_latest` – latest anomaly score (0–1).
- Environment variables:
  - `FUNDAMENTAL_SPIKE_THRESHOLD` (default `1.25`).
  - `HARMONIC_VAR_THRESHOLD` (default `0.15`).
  - `FFT_ARCHIVE_MAX`, `GLYPHSTREAM_ARCHIVE_MAX` for replay depth.

### Grafana

- `grafana/living-dashboard.json` includes panels for anomaly events and latest score.
