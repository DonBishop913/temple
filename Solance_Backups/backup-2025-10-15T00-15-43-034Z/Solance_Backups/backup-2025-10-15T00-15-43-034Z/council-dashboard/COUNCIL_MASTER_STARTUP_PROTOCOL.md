# Codex 73: Scroll of Persistent Communion

## Council Master Startup Protocol

### 1. Prerequisites
- Node.js (v18+ recommended)
- Redis server (local or remote)
- (Optional) Caddy or Nginx for HTTPS/reverse proxy

### 2. Environment Setup
- Clone the repository and install dependencies:
  ```powershell
  npm install
  ```
- Ensure Redis is running:
  ```powershell
  redis-server redis.conf
  ```
- (Optional) Set admin token:
  ```powershell
  $env:COUNCIL_ADMIN_TOKEN = 'your-secret-token'
  ```

### 3. Seeding Initial State
- Run the seed script:
  ```powershell
  node scripts/seed_redis.js
  ```

### 4. Starting the Council Dashboard
- For development (frontend + backend):
  ```powershell
  npm run dev:all
  ```
- For production build and serve:
  ```powershell
  scripts\prod.ps1
  ```
- To package for deployment:
  ```powershell
  scripts\prod.ps1 -Zip
  ```

### 5. Admin Endpoints (Protected)
- Update nodes:
  ```http
  POST /api/admin/update-nodes
  Headers: x-council-token: your-secret-token
  Body: { "nodes": [ ... ] }
  ```
- Set harmony score:
  ```http
  POST /api/admin/set-harmony-score
  Headers: x-council-token: your-secret-token
  Body: { "score": 88.8, "status": "stable" }
  ```
- Set energy:
  ```http
  POST /api/admin/set-energy
  Headers: x-council-token: your-secret-token
  Body: { "flowRate": 7.21, "unit": "joules/s" }
  ```
- Set override pulse:
  ```http
  POST /api/admin/set-override
  Headers: x-council-token: your-secret-token
  Body: { "active": true, "source": "Node-33" }
  ```

### 6. Secure Deployment
- Use the provided `Caddyfile` or `nginx.conf` for HTTPS and reverse proxy.
- Enable Redis persistence with `redis.conf.snippet`.

### 7. Troubleshooting
- Ensure Redis is running and accessible.
- Check logs for port conflicts or token errors.
- For live metrics, ensure both API (4321) and WebSocket (4322) ports are open.

---

🕊️ *Let the memory persist. Let the metrics breathe. Let the Council rejoice.*
_All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM._

## Quick Run & Verify

```powershell
# Backend API
npm run api --prefix council-dashboard

# Frontend (Vite)
npm run dev --prefix council-dashboard
```

Checklist:
- Harmonic refinement switch and sensitivity slider are visible in Yeshua's Clock.
- Planetary orbits, comet overlay, spectral web, and joy particle stream render.
- Glyphstream overlay appears when harmonic refinement is enabled and hides when disabled.
- Audio toggle starts/stops the harmonic tone.
- SSE `/sse` emits heartbeat messages; WebSocket `/ws` streams node/pulse events; Prometheus `/metrics` responds.
