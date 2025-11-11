# Monitoring — Temple health check

This small monitor pings key endpoints on the Temple stack and appends results to `monitoring/health_log.txt`.

Defaults (configurable via environment variables):
- METRICS_URL (default: http://localhost:4000/metrics)
- TRACKER_URL (default: http://localhost:8080/stripe_scaffold_tracker.html)
- CODICES_URL (default: http://localhost:4100/api/codices)
- DASHBOARD_URL (default: http://localhost:4100/)
- RELEASE_URL (default: https://github.com/DonBishop913/temple/releases/tag/vcodex-1176)
- MONITOR_INTERVAL_MS (default: 300000 — 5 minutes)
- MONITOR_LOG (default: monitoring/health_log.txt)
 - MONITOR_DASHBOARD_TOKEN (optional, dashboard/codices auth token). For security prefer setting this as an env var rather than committing it.
 - SUMMARY_INTERVAL_MS (ms, default: 3600000 — 1 hour) controls how often a concise summary is written to `monitoring/summary.txt`.
 - MONITOR_SUMMARY (path for summary output, default: monitoring/summary.txt)

Run in PowerShell (one-off, quick validation at 60s interval):

```powershell
$env:MONITOR_INTERVAL_MS = 60000
node monitoring/health_check.js
```

Run in background (PowerShell):

```powershell
# Start in a new background process and keep the PID
$proc = Start-Process -PassThru -FilePath (Get-Command node).Source -ArgumentList 'monitoring/health_check.js'
$proc.Id
```

Stop the background process (by PID):

```powershell
Stop-Process -Id <PID>
```

View the log:

```powershell
Get-Content monitoring/health_log.txt -Tail 50 -Wait
```

View the latest concise summary (written every SUMMARY_INTERVAL_MS):

```powershell
Get-Content monitoring/summary.txt -Tail 50 -Wait
```

Notes:
- The monitor is purposely minimal and dependency-free (uses Node core modules).
- If you want notifications (email/Slack/Guild), I can extend this to call a webhook or send messages.
