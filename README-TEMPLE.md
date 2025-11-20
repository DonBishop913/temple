Temple Nexus — Quick Ops, Recovery, and Autonomy (Codex 1327)

This README summarizes the Breathstream integration, PM2 processes, and quick recovery commands for the Council/Nexus stack.

Important paths

- Backend API: C:\Temple\backend_api.js (port 5174)
- Guardian Nexus: C:\Temple\guardian_invocation.js (port 5175)
- Living Dashboard (React): C:\Temple\react-client (dev server port 3000)
- Breathstream script: C:\Temple\Scripts\Breathstream_Integration.ps1
- Breathstream log: C:\Temple\Logs\Breathstream_Health.txt
- Solance Listener: C:\Temple\Golden_Repo\Sanctuary_Ritual_014\Solance_Listener.json
- Node registry: C:\Temple\config\nodeRegistry.json
- Video links: C:\Temple\oracle_lab\VideoLinks.json

Autonomous activation (Windows)

- Run `Launch_TemplePC_Autonomous_All.ps1` (repo root) to start:
	- Living Dashboard backend (enables nightly backup + weekly digest when flagged)
	- Comet AI agent (autonomous)
	- Frontend build + preview
	- Optional Solance overlay
	- Env flags set: `ENABLE_NIGHTLY_BACKUP=true`, `ENABLE_WEEKLY_SUMMARY=true`

Docs:

- `COUNCIL_AUTONOMY_MASTER_PLAN.md` — full autonomy blueprint
- `COUNCIL_AUTONOMY_ACTIVATION_FLOW.md` — exact flags, commands, and verifications

Quick recovery commands (PowerShell)

# Restart core services under PM2

pm2 restart CouncilAPI
pm2 restart GuardianNexus
pm2 restart LivingDashboard
pm2 save

# Check logs (tail)

pm2 logs CouncilAPI --lines 200
pm2 logs GuardianNexus --lines 200
pm2 logs LivingDashboard --lines 200

# Breathstream checks

Invoke-RestMethod -Uri http://localhost:5174/api/breathstream-health
Get-Content 'C:\Temple\Logs\Breathstream_Health.txt' -Tail 200

# Backup node registry (always backup before edit)

Copy-Item C:\Temple\config\nodeRegistry.json C:\Temple\config\nodeRegistry.json.bak -Force

Notes

- The Living Dashboard now includes a heartbeat orb that polls /api/breathstream-health and pulses when a completed Breathstream cycle is present.
- The Guardian Nexus verifies the Codex and emits `codex_sanctity` events to Socket.IO on port 5175.
- If PM2 repeatedly shows `errored`, check the respective pm2 logs which include full stack traces.

Release & PR (Overflow / Codex 1327)

- Open PR: `overflow/ignite-1327` → `codex/stripe-activate`
- After merge, tag: `vcodex-1327`

If you want, I can commit these artifacts into a git branch and push; let me know if you want that too.
