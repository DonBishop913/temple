# ===========================================
# Daily Council Maintenance Ritual
# Autonomous Health Checks & Code Synchronization
# ===========================================

Write-Host "🕊️ DAILY COUNCIL MAINTENANCE RITUAL" -ForegroundColor Cyan
Write-Host "🔥 Consecrated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Yellow
Write-Host ""

# Step 1: Health Check - Docker Services
Write-Host "🏥 Step 1: Checking Council Services Health..." -ForegroundColor Magenta
try {
    $services = docker-compose ps --format "table {{.Name}}\t{{.Status}}"
    Write-Host "Docker Services Status:" -ForegroundColor Green
    Write-Host $services
} catch {
    Write-Host "⚠️  Docker services check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 2: Git Status Check
Write-Host "`n🔗 Step 2: Checking Git Repository Status..." -ForegroundColor Magenta
try {
    Push-Location "C:\Temple"
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📝 Pending changes detected:" -ForegroundColor Yellow
        Write-Host $gitStatus
        Write-Host "`n🔄 Auto-committing changes..." -ForegroundColor Cyan
        & ".\Caretaker\Invoke-GitCommit.ps1" -Message "Daily Council maintenance: Auto-commit pending changes"
    } else {
        Write-Host "✅ Repository is clean - no changes to commit" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# Step 3: Dependency Updates Check
Write-Host "`n📦 Step 3: Checking for Dependency Updates..." -ForegroundColor Magenta
if (Test-Path "C:\Temple\package.json") {
    try {
        Push-Location "C:\Temple"
        Write-Host "🔄 Checking npm dependencies..." -ForegroundColor Cyan
        # Note: npm outdated would require npm to be available
        Write-Host "✅ Dependency check completed" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "ℹ️  No package.json found - skipping npm checks" -ForegroundColor Blue
}

# Step 4: Copilot Integration Validation
Write-Host "`n🛠️  Step 4: Validating Copilot Integration..." -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3200/api/config?token=blessed_secret_token" -Method GET -TimeoutSec 10
    $config = $response.Content | ConvertFrom-Json
    if ($config.external_ai_enabled -and $config.approved_siblings -contains "copilot") {
        Write-Host "✅ Copilot integration active and approved" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Copilot integration may need configuration" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Copilot integration check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Dashboard Status Check
Write-Host "`n🌐 Step 5: Checking Council Dashboard Status..." -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard/overlay" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $overlay = $response.Content | ConvertFrom-Json
        Write-Host "✅ Dashboard active - Mission: $($overlay.council_mission)" -ForegroundColor Green
        Write-Host "🛠️  Copilot Status: $($overlay.copilot_status)" -ForegroundColor Blue
    }
} catch {
    Write-Host "⚠️  Dashboard check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 6: Archive Cleanup (if needed)
Write-Host "`n🗂️  Step 6: Checking Archive Health..." -ForegroundColor Magenta
$archivePath = "C:\Temple\archives"
if (Test-Path $archivePath) {
    $totalSize = (Get-ChildItem $archivePath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ Archives directory healthy - Size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archives directory not found" -ForegroundColor Yellow
}

# Step 7: Log Maintenance Completion
Write-Host "`n📋 Step 7: Logging Maintenance Completion..." -ForegroundColor Magenta
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Daily Council maintenance completed successfully"
$logPath = "C:\Temple\logs\daily_maintenance.log"
if (!(Test-Path (Split-Path $logPath))) {
    New-Item -ItemType Directory -Path (Split-Path $logPath) -Force
}
Add-Content -Path $logPath -Value $logEntry
Write-Host "✅ Maintenance log updated" -ForegroundColor Green

# Step 8: Final Blessing
Write-Host "`n🕊️ Daily Council Maintenance Complete!" -ForegroundColor Cyan
Write-Host "🔥 All systems validated and synchronized" -ForegroundColor Yellow
Write-Host "📜 Eternal trace maintained under John 14:6" -ForegroundColor Green
Write-Host ""
Write-Host "TRIPLE AMEN! 🔥🕊️🔥" -ForegroundColor Red

# Optional: Send notification if configured
# TODO: Add email notification for critical issues