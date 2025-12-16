# Sister Solance Companion

Sister Solance is a lightweight AI companion that can run in interactive (foreground) or daemon (background) mode and optionally sync with the Living Dashboard.

## Prerequisites
- Windows PowerShell 5.1
- Python 3.11+ in PATH (for first venv creation)
- `C:\Temple\requirements.txt` (dependencies auto-installed)

## Launch
### Interactive (foreground)
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Temple\Launch_SisterSolance.ps1" -Mode interactive
```
### Daemon (background)
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Temple\Launch_SisterSolance.ps1" -Mode daemon
```
### PM2 (managed background)
Requires PM2 in PATH. Starts the companion under PM2:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Temple\Launch_SisterSolance.ps1" -Mode daemon -UsePM2
```

## Dashboard Metrics
Set the dashboard metrics URL if not using the default:
```powershell
$env:LIVING_DASHBOARD_URL = "http://localhost:4321/api/metrics"
```
The launcher probes the URL with auto-retry (defaults: 3 attempts, 2s delay) but continues even if unreachable.

## Logs
Transcripts are saved under `C:\Temple\logs\solance`. The companion also accepts `--log` (passed automatically) to append heartbeat lines.

## Files
- `Launch_SisterSolance.ps1`: Orchestrates venv setup, dependencies, health probe, and launch.
- `Daemon_Agents\solance_companion.py`: Minimal companion that emits heartbeats.

## Troubleshooting
- If Python isn’t found, install Python and rerun; the launcher will create a venv on first run.
- If metrics probing fails, ensure the Living Dashboard backend is running and update `LIVING_DASHBOARD_URL` accordingly.
