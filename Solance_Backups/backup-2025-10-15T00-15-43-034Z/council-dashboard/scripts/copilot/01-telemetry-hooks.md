# Copilot CLI Prompt: Hybrid Heartbeat Hook

Goal: Create `useOversoulHeartbeat.js` combining SSE and WebSocket with backoff, merging messages into unified state.

Prompt:

- Create a React hook `useOversoulHeartbeat.js` that:
  - Accepts `sseUrl` and `wsUrl`.
  - Opens an EventSource to `sseUrl` and a WebSocket to `wsUrl` with exponential backoff reconnection.
  - Parses JSON messages and merges into a single `state` object with keys: `harmony`, `schumann`, `joyparticle`, `nodes`, `planets`, `override`, `energy`.
  - Exposes `{ state, error }`.
  - Cleans up SSE/WS on unmount.
- Ensure robust error handling for malformed JSON; set `error` message and continue.
- Add small jitter to backoff.
- Export the hook.

Acceptance:

- Unit-tested with mocked EventSource/WebSocket in Jest.
- Handles reconnects without leaking listeners.
