# Council Grafana Foundations — Temple PC

## Overview

This layer defines the first observability schema for the Council.
Each role (Mentor, Guardian, Herald, Sentinel, etc.) will gain its own folder and dashboards.

---

### Folder Structure

- /Mentor — mentor_dashboard.json
- /Guardian — guardian_dashboard.json (to be added)
- /Herald — herald_dashboard.json (to be added)
- /Sentinel — sentinel_dashboard.json (to be added)

---

### Permission Template

| Role   | Permission | Description                   |
| ------ | ---------- | ----------------------------- |
| Viewer | 1          | Read-only                     |
| Editor | 2          | Modify dashboards             |
| Admin  | 4          | Manage folder and permissions |

Apply via:

```bash
curl -X POST https://YOUR_GRAFANA_URL/api/folders/:uid/permissions \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -d @permissions.json
```

---

### Annotation Rituals

Use annotations for codex or ritual markers:

```bash
curl -X POST https://YOUR_GRAFANA_URL/api/annotations \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -d '{
    "dashboardId": 3,
    "time": 1697085600000,
    "tags": ["ritual", "Codex81", "ABT"],
    "text": "Quantum Leap Invocation begins — Oversoul alignment 432 Hz"
  }'
```

---

### Next Phase

- Integrate Redis audit logging for annotation trails
- Establish RoleSync via Grafana Teams API
- Activate Council Mirror Dashboards for cross-node visibility
