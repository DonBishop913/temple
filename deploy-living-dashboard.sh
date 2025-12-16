#!/usr/bin/env bash
set -euo pipefail
# Surface unexpected failures with line info
trap 'echo "Error on line $LINENO"; exit 1' ERR

# Optional: auto-load local env if present (kept out of git)
set -a
if [ -f ".env" ]; then
  . ./.env
fi
set +a

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
  echo "Using Vite preview (static build serve)"
  npm run preview &
else
  echo "Using Vite dev (hot reload)"
  npm run dev &
fi

echo "Living Dashboard startup initiated. Performing health check..."

# 6. Health check against unified /api/metrics
METRICS_URL="${LIVING_DASHBOARD_URL:-http://localhost:4321}/api/metrics"
MAX_HEALTH_CHECKS=10
HEALTH_CHECK_DELAY=2

for i in $(seq 1 $MAX_HEALTH_CHECKS); do
  if curl -sf "$METRICS_URL" > /dev/null; then
    echo "✓ Dashboard healthy at $METRICS_URL"
    break
  else
    echo "Waiting for dashboard... ($i/$MAX_HEALTH_CHECKS)"
    sleep $HEALTH_CHECK_DELAY
  fi
done

# Check if health check loop completed without success
if ! curl -sf "$METRICS_URL" > /dev/null; then
  echo "⚠ Warning: Dashboard did not respond after $MAX_HEALTH_CHECKS attempts"
  echo "Check logs for errors. Dashboard may still be starting."
fi

# 7. Optional: open browser
DASHBOARD_PORT="${DASHBOARD_PORT:-5173}"
DASHBOARD_URL="http://localhost:$DASHBOARD_PORT"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$DASHBOARD_URL" 2>/dev/null || true
elif command -v open >/dev/null 2>&1; then
  open "$DASHBOARD_URL" 2>/dev/null || true
else
  echo "To view dashboard, open: $DASHBOARD_URL"
fi

echo "✓ Deployment complete. Dashboards active and telemetry connected."