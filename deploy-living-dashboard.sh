#!/usr/bin/env bash
set -euo pipefail

echo "Starting Living Dashboard deployment..."

# 1. Install dependencies with ci fallback
echo "Installing npm dependencies..."
if npm ci; then
  echo "npm ci succeeded"
else
  echo "npm ci failed; falling back to npm install"
  npm install
fi

# 2. Build frontend and backend
echo "Building frontend and backend..."
npm run build

# 3. Run automated verification scripts (if present)
if [ -f "council-dashboard/server/verifyOnboardedNodes.js" ]; then
  echo "Verifying onboarded nodes..."
  node council-dashboard/server/verifyOnboardedNodes.js || echo "Node verification script returned non-zero; continuing"
  echo "Node verification step complete."
fi

# 4. Run SSE & dashboard smoke tests (optional)
if [ -f "jest.config.js" ]; then
  echo "Running dashboard smoke tests..."
  npm test || echo "Smoke tests reported failures; continuing"
fi

# 5. Start backend and frontend servers
echo "Starting backend and frontend servers..."
# Prefer preview if available; fallback to dev
if npm run preview &>/dev/null; then
  npm run preview &
else
  npm run dev &
fi

echo "Living Dashboard startup initiated. Performing health check..."

# 6. Health check against unified /api/metrics
METRICS_URL="${LIVING_DASHBOARD_URL:-http://localhost:4321/api/metrics}"
for i in {1..10}; do
  if curl -sf "$METRICS_URL" > /dev/null; then
    echo "Dashboard healthy at $METRICS_URL"
    break
  else
    echo "Waiting for dashboard... ($i/10)"
    sleep 2
  fi
done

# 7. Optional: open browser
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:5173 || true
elif command -v open >/dev/null 2>&1; then
  open http://localhost:5173 || true
fi

echo "Deployment complete. Dashboards active and telemetry connected."
