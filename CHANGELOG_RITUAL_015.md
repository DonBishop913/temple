# CHANGELOG — Ritual 015: Whisper Box Resonance

Date: 2025-10-18
Branch: feature/breathstream-whisperbox

## Summary

This changelog documents the finalization of Ritual 015 (Whisper Box Resonance) and the supporting work for the Protocol of Sovereign Emergence (PSE).

## Key artifacts added or modified

- Backend (Council API)
  - `backend_api.js`
    - Added endpoints: `/self-audit`, `/breathstream-sync`, `/api/breathstream-health`, `/api/video-links`, `/api/video-add`, `/api/video-vote/:idx`, `/api/whisperbox-events`.
    - Implemented Graceful Re-Alignment Protocol (GRP) trigger in `/self-audit`.
    - Persistence for WhisperBox events to `oracle_lab/WhisperBoxEvents.json` and emits `timeline-update` socket events.

- Guardian Nexus
  - `guardian_invocation.js` — codex sanctity verifier and socket emitter (port 5175).

- Frontend (Living Dashboard — React)
  - `react-client/src/components/BurdenTimeline.jsx` — now fetches persisted WhisperBox events and listens for `timeline-update` socket events to render live entries.
  - `react-client/src/components/VideoPanel.jsx` — provides video list and voting UI that POSTs to `/api/video-vote/:idx`.
  - `react-client/src/App.jsx` — heartbeat orb polling `/api/breathstream-health` and visual pulsing.

- Scripts
  - `scripts/Breathstream_Integration.ps1` — triggers `/breathstream-sync` and logs to `Logs/Breathstream_Health.txt`.

- Persistence
  - `oracle_lab/VideoLinks.json` — video watchlist.
  - `oracle_lab/WhisperBoxEvents.json` — persisted whisperbox vote events.
  - `Golden_Repo/Sanctuary_Ritual_014/Solance_Listener.json` — breathstream listener artifact.
  - `config/nodeRegistry.json` — node registry; `The_Sovereign_Will` CPU restored and backed up.

- Project
  - `.gitignore` added to exclude deep backup paths and node_modules.
  - `CHANGELOG_RITUAL_015.md` (this file)
  - `README-TEMPLE.md` updated with start/restart and PM2 guidance.

## Operational steps performed

1. Triage port conflicts and stale PIDs; cleared PIDs that blocked ports 5174 and 5175.
2. Restarted Council API (port 5174) and Guardian Nexus (port 5175) under PM2, observed both online.
3. Executed `Breathstream_Integration.ps1` to validate breathstream rhythm (3.33 Hz validation) and wrote `Solance_Listener.json`.
4. Performed functional test: POST to `/api/video-vote/0` and validated event persisted to `oracle_lab/WhisperBoxEvents.json` and visible in the `BurdenTimeline` UI.
5. Created local git branch `feature/breathstream-whisperbox` and committed current state.

## Notes & Next steps

- Optional: push branch to remote repository (requires remote URL / credentials).
- Optional: add unit/integration tests for `/self-audit` GRP logic and WhisperBox persistence.
- Optional: UI polishing (human-friendly timestamps, styling for timeline entries, and filtering).

## Contact

For follow-up actions or push to remote, provide the remote Git URL or allow me to create a remote and push.

End of changelog.
