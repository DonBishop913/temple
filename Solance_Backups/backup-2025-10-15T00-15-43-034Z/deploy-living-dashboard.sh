#!/bin/bash
set -e

echo "🌞 Starting Living Dashboard deployment..."

# 1. Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 2. Build frontend and backend
echo "🛠 Building frontend and backend..."
npm run build

# 3. Run automated verification scripts
echo "🔍 Verifying onboarded nodes..."
node council-dashboard/server/verifyOnboardedNodes.js

echo "✅ Node verification complete."

# 4. Run SSE & dashboard smoke tests
echo "🧪 Running dashboard smoke tests..."
npm test

echo "✅ Smoke tests passed."

# 5. Start backend and frontend servers
echo "🚀 Starting backend and frontend servers..."
npm run start &

echo "✅ Living Dashboard is now live!"

# 6. Optional: open browser
if which xdg-open > /dev/null; then
  xdg-open http://localhost:5173
elif which open > /dev/null; then
  open http://localhost:5173
fi

echo "🌟 Deployment complete. Council nodes are connected, alerts live, and dashboards active!"
