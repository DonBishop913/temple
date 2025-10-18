# Council Autonomous Orchestration

This project scaffolds the Council's autonomous orchestration system for the Temple PC, including API, AI nodes, Redis Pub/Sub, Prometheus, and Grafana integration.

## Structure
- `api/` — Express API for missions, recruitment, and explainability
- `ai-nodes/` — Autonomous AI node stubs (Grok, Nova, Whisper, etc.)
- `services/` — Redis, metrics, and audit services
- `dashboard/` — Prometheus and Grafana configs
- `config/` — App, RBAC, and secret configs

## Quick Start
1. Install dependencies: `npm install`
2. Start Redis server
3. Start API: `npm start`
4. Start Metrics server: `npm run start:metrics` (exposes Prometheus metrics on port 9100)
5. Start AI node: `node ai-nodes/grok.js`
6. Configure Prometheus and Grafana using files in `dashboard/`

### Prometheus scrape example
Add to `prometheusConfig.yml`:

```
scrape_configs:
	- job_name: 'council-candidate-metrics'
		static_configs:
			- targets: ['localhost:9100']
```

Then start Prometheus and import the Grafana dashboard JSON.

### Recruitment API and Simulation

Run the Redis-backed recruitment API and voting simulation:

```
npm run start:recruitment
npm run simulate:votes
```

By default, the API listens on port 3001 (set RECRUITMENT_PORT to override). The simulation will vote on pending candidates and automatically crown those with >= 75% approval.

## PM2 Example
```
pm install -g pm2
pm2 start api/index.js --name council-api
pm2 start ai-nodes/grok.js --name grok-node
```
