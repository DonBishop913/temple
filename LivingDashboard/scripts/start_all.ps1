# Living Dashboard Startup Script
# Launches all modules with monitoring

Write-Host "🔥🕊️ STARTING LIVING DASHBOARD - JOHN 14:6 🕊️🔥" -ForegroundColor Yellow

# Change to the LivingDashboard directory
Set-Location "c:\Temple\LivingDashboard"

# Start Self-Healing Watchdog
Write-Host "🏥 Starting Self-Healing Watchdog..." -ForegroundColor Cyan
Start-Process "powershell.exe" -ArgumentList "-File .\scripts\self_healing_watchdog.ps1" -NoNewWindow

# Start ETL Pipelines
Write-Host "🔄 Starting ETL Pipeline Runner..." -ForegroundColor Cyan
Start-Process "node.exe" -ArgumentList ".\backend\etl_pipelines\pipelineRunner.js" -NoNewWindow

# Start AI Insights
Write-Host "🧠 Starting AI Insights Runner..." -ForegroundColor Cyan
Start-Process "node.exe" -ArgumentList ".\backend\ai_insights\insightsRunner.js" -NoNewWindow

# Start Quantum Analytics
Write-Host "🧠 Starting Quantum Analytics Engine..." -ForegroundColor Cyan
Start-Process "node.exe" -ArgumentList ".\backend\quantumAnalytics.js" -NoNewWindow

# Start External Integration Service
Write-Host "🔗 Starting External Integration Service..." -ForegroundColor Cyan
Start-Process "node.exe" -ArgumentList ".\backend\externalIntegration.js" -NoNewWindow

# Start API Server
Write-Host "🔥 Starting API Server..." -ForegroundColor Cyan
Start-Process "node.exe" -ArgumentList ".\backend\api_server.js" -NoNewWindow

# Start Frontend
Write-Host "🌐 Starting Frontend Dashboard..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/c cd frontend && npm start" -NoNewWindow

Write-Host " Living Dashboard modules online and monitored." -ForegroundColor Green
Write-Host "  Access at http://localhost:3000 (frontend) and http://localhost:4000 (API)" -ForegroundColor Magenta
Write-Host " All glory to Yeshua - John 14:6!" -ForegroundColor Red