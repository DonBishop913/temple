[![Compose WS Probe and Integration Tests](https://github.com/TempleAI/Temple/actions/workflows/compose-ws-probe-and-tests.yml/badge.svg?branch=main)](https://github.com/TempleAI/Temple/actions/workflows/compose-ws-probe-and-tests.yml)
[![Scheduled WS Health Probe](https://github.com/TempleAI/Temple/actions/workflows/scheduled-ws-health.yml/badge.svg?branch=main)](https://github.com/TempleAI/Temple/actions/workflows/scheduled-ws-health.yml)

## Council Notification System
## Observability: Prometheus & Grafana

The Council API exposes Prometheus metrics at `/metrics` (default port 4321). Custom metrics include:
- `ai_vote_total{candidate, ai_member}`
- `candidate_health_score{candidate}`

Quick start:
1. Install Prometheus and Grafana.
2. Use `council-dashboard/prometheus.yml`:

```
global:
	scrape_interval: 5s

scrape_configs:
	- job_name: 'council-api'
		static_configs:
			- targets: ['localhost:4321']
```

3. Add Prometheus in Grafana (`http://localhost:9090`) and create panels:
	 - Candidate votes: `sum(ai_vote_total) by (candidate)`
	 - AI member activity: `sum(ai_vote_total) by (ai_member)`
	 - Candidate health: `candidate_health_score`
	 - Votes over time: `sum(increase(ai_vote_total[1m]))`

Optional embed in the React app: set `window.__GRAFANA_PANEL_SRC` to a Grafana panel URL to render an iframe panel.

## Bishop-only Crowning Flow

All AI proposal/evaluation/voting runs autonomously. Crowning requires your explicit approval:
- Set your Bishop key in the environment before starting the API:
	- PowerShell: `$env:BISHOP_KEY = "your-secret-key"`
- Crown via POST `/api/recruitment/crown` with JSON `{ candidateId, bishopKey }`.
- The system sets `crownedAt` timestamp; access gates unlock for the candidate.

The `CouncilDashboard` panel in the app lists candidates and provides a Crown button that prompts for your key.

This repo includes a unified multi-channel notification system used by the Council Master Dashboard to send alerts for health checks, self-healing events, anomalies, and ritual triggers.

### Installation

- Requires Python 3.10+
- Install packages:

```powershell
pip install requests twilio
```

If using a virtual environment:

```powershell
./venv/Scripts/activate
pip install requests twilio
```

### Configuration

Edit `c:\Temple\notification_config.json` with your real credentials. Example fields:

- `dry_run`: global test mode (true = simulate, false = live)
- `slack.webhook_url`: Slack Incoming Webhook URL
- `email`: SMTP credentials and addresses
- `sms`: Twilio SID/token and phone numbers
- `ui.api_url`: Dashboard API endpoint for in-app alerts

Sample:

```json
{
	"dry_run": true,
	"slack": { "enabled": true, "webhook_url": "https://hooks.slack.com/services/XXX/YYY/ZZZ", "dry_run": true },
	"email": { "enabled": true, "from": "no-reply@example.com", "to": "ops@example.com", "smtp_server": "smtp.example.com", "smtp_port": 465, "user": "smtp-user", "pw": "smtp-pass", "dry_run": true },
	"sms": { "enabled": true, "sid": "TWILIO_SID", "token": "TWILIO_TOKEN", "from": "+15551234567", "to": "+15557654321", "dry_run": true },
	"ui": { "enabled": true, "api_url": "https://dashboard.local/api/notify", "api_key": "API_KEY", "dry_run": true }
}
```

### Dry-Run vs Live

- Dry-Run prints where each notification would go without sending.
- Set `dry_run` (global or per-channel) to `false` to enable live sends.

### Smoke Test

Validate the pipeline safely:

```powershell
python c:\Temple\scripts\notify_smoke_test.py
```

Then go live:

```powershell
# Edit notification_config.json and set dry_run to false; fill real creds
python c:\Temple\startup_selfheal.py
```

### Severity Mapping

Structured payloads include:

- `severity`: one of `info`, `warning`, `error`, `critical`
- `container`: affected service/container name
- `timestamp`: ISO-8601 UTC
- `message` and `subject`

Example usage from code:

```python
from council_notification import council_notify
council_notify("Dashboard recovered", subject="Council Status", severity="info", container="council_dashboard")
```

### Retry/Backoff

All channels use exponential backoff on transient failures (default 3 attempts, 1s base delay, 2x factor). Errors are surfaced after max attempts.

### Optional Escalation

You can implement escalation by routing `critical` severity to SMS in addition to Slack/email/UI. For example, call `council_notify` with `severity="critical"` and configure `sms.enabled=true`. Fine-grained routing can be added in `council_notification.py` if desired.

### Severity-Based Routing

You can control which channels receive which severities via the `routing` block in `notification_config.json`:

```json
"routing": {
	"slack": { "min_severity": "info" },
	"email": { "min_severity": "warning" },
	"sms":   { "min_severity": "critical" },
	"ui":    { "min_severity": "error" }
}
```

With this setup, only `critical` alerts go to SMS, while Slack receives all, email receives `warning+`, and UI receives `error+`.

