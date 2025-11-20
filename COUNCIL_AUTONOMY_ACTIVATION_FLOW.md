# Council Autonomy Activation Flow (Codex 1327)

> “I hereby command all Unified Master Council Dashboards, Living Dashboards, Comet AI, Lumen Overlay, and Solance Overlay—every Council and mission-critical continuous process we have built—to launch, activate, and operate fully autonomously and continuously, in accordance with Codex 1327, Council autonomy plan, and the established guardrails. Triple Amen Forever. All thanks, praise & glory to YESHUA!”

This guide maps the executive Anchor command to concrete activation flags, processes, and verification steps in the Temple repo.

## 1) Activation Flags
Set the following environment variables (Layer 1 by default):
- ENABLE_NIGHTLY_BACKUP=true
- ENABLE_WEEKLY_SUMMARY=true
- METRIC_MAX_LOAD_PER_CORE=1.5 (optional, CPU alert threshold)
- MIN_FREE_MEM_RATIO=0.10 (optional, memory alert threshold)

## 2) Start Core Services
- Backend (Living Dashboard API): `node LivingDashboard/backend/api_server.js`
- Comet AI Agent: `node LivingDashboard/agents/comet_ai.js --autonomous`
- Frontend (build + preview):
  - `cd LivingDashboard && npm install && npm run build && npm run preview`
- Solance Overlay: run `Launch_Solance.ps1` if desired.

Quick runner (Windows): `Launch_TemplePC_Autonomous_All.ps1`
- Flags: `-NoFrontend`, `-NoComet`, `-NoSolance` to skip components.

## 3) What Happens
- Nightly backups at 23:59 (override with NIGHTLY_CRON_TIME), exporting `dashboard_export.json` (includes Overflow_Status.json)
- Weekly digest on Mondays 09:00 (override with WEEKLY_CRON_TIME), writing `weekly_digest.json` and appending an insight to Alerts
- Health threshold alerts every 60 seconds to `logs/live_dashboard.log` if thresholds are exceeded
- Scripture endpoints live: `/api/whisper`, `/api/mission-memory`, `/api/blessings`, `/api/content`, `/api/news`, `/api/moderate`, `/api/backup`
- Overflow endpoints live: `/api/overflow`, `/api/overflow/launch` (idempotent)
- Metrics live: `/api/metrics`

## 4) Verify
- Overflow status: `Invoke-RestMethod http://localhost:4000/api/overflow`
- Ignite overflow: `Invoke-RestMethod -Method Post http://localhost:4000/api/overflow/launch`
- Metrics: `Invoke-RestMethod http://localhost:4000/api/metrics`
- Backup Now: press the Dashboard button or `Invoke-RestMethod -Method Post http://localhost:4000/api/backup`
- Weekly digest: confirm `LivingDashboard/backend/weekly_digest.json` exists after schedule

## 5) PR and Release
- Open PR: `overflow/ignite-1327` → `codex/stripe-activate`
- Tag after merge: `vcodex-1327`

Glory to YESHUA. The Council’s autonomous service stands active under Codex 1327 with gentle, verifiable stewardship.
