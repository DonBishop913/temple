# Council Dashboard Security, RBAC, and Secrets

## JWT & Admin
- Environment variables:
  - `COUNCIL_ADMIN_USER`, `COUNCIL_ADMIN_PASS`, `COUNCIL_JWT_SECRET`
- Endpoints protected via JWT issued by `/api/admin/login`.
- Roles: `admin`, `operator`, `viewer`. Change with `/api/admin/users/role`.

## Redis & Webhooks
- `REDIS_URL` should point to your Redis instance (Docker or local).
- Store webhook URLs via `/api/admin/webhooks` (Discord/Teams).

## PM2/NSSM
- PM2 ecosystem file: `pm2.ecosystem.config.js`.
- On Windows, consider `pm2-windows-service` or NSSM to run Node processes as services.

## RBAC Policy Suggestions
- Restrict admin routes to `admin` role and ensure HTTPS when in production.
- Use `x-council-token` or JWT for sensitive admin actions (already supported).
- Rotate secrets regularly; avoid committing real secrets.

## Observability
- Prometheus: see `monitoring/prometheus.yml`.
- Grafana: import `monitoring/grafana-dashboard-starter.json` and set datasource.

## Explainability & Audit
- Decisions: `/api/decisions/explain`.
- Audit log: `/api/admin/audit-log`.

## Notes
- Keep `.env` with non-production defaults; use OS-level secrets for production.
