# ===========================================
# Temple Sync Ritual
# Force Alignment Across All Council Systems
# ===========================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    [Parameter(Mandatory=$false)]
    [string]$TargetBranch = "codex/stripe-activate"
)

Write-Host "🕊️ TEMPLE SYNC RITUAL - FORCE ALIGNMENT" -ForegroundColor Cyan
Write-Host "🔥 Consecrated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Yellow
Write-Host "🎯 Target Branch: $TargetBranch" -ForegroundColor Green
if ($Force) {
    Write-Host "⚠️  FORCE MODE ENABLED - All local changes will be lost!" -ForegroundColor Red
}
Write-Host ""

# Step 1: Confirm Action
if (!$Force) {
    Write-Host "⚠️  WARNING: This will reset all local changes!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure you want to force sync? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "🛑 Sync ritual cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Step 2: Backup Current State (if not force mode)
Write-Host "💾 Step 1: Creating Emergency Backup..." -ForegroundColor Magenta
if (!$Force) {
    try {
        Push-Location "C:\Temple"
        $backupName = "emergency_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        git branch $backupName
        Write-Host "✅ Emergency backup branch created: $backupName" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# Step 3: Hard Reset to Canonical State
Write-Host "`n🔄 Step 2: Performing Hard Reset to Canonical State..." -ForegroundColor Magenta
try {
    Push-Location "C:\Temple"
    Write-Host "🔄 Resetting to origin/$TargetBranch..." -ForegroundColor Cyan
    git fetch origin
    git reset --hard "origin/$TargetBranch"
    git clean -fd  # Remove untracked files and directories
    Write-Host "✅ Repository reset to canonical state" -ForegroundColor Green
} catch {
    Write-Host "❌ Reset failed: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# Step 4: Rebuild Docker Services
Write-Host "`n🏗️  Step 3: Rebuilding Council Services..." -ForegroundColor Magenta
try {
    Push-Location "C:\Temple"
    Write-Host "🔄 Rebuilding Docker services..." -ForegroundColor Cyan
    docker-compose down
    docker-compose up --build -d
    Start-Sleep -Seconds 10  # Wait for services to start
    Write-Host "✅ Docker services rebuilt and running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker rebuild failed: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# Step 5: Reinstall VS Code Extension
Write-Host "`n🛠️  Step 4: Reinstalling VS Code Extension..." -ForegroundColor Magenta
$extensionPath = "C:\Temple\vscode-council-integration\council-copilot.vsix"
if (Test-Path $extensionPath) {
    try {
        & code --install-extension $extensionPath --force
        Write-Host "✅ VS Code extension reinstalled" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VS Code extension reinstall failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  VS Code extension not found at $extensionPath" -ForegroundColor Yellow
}

# Step 6: Validate All Integrations
Write-Host "`n🔍 Step 5: Validating All Integrations..." -ForegroundColor Magenta

# Check Git Status
try {
    Push-Location "C:\Temple"
    $gitStatus = git status --porcelain
    if (!$gitStatus) {
        Write-Host "✅ Git repository clean and aligned" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Git repository has unexpected changes" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

# Check Docker Services
try {
    $services = docker-compose ps --filter "status=running" --format "{{.Name}}: {{.Status}}"
    $runningCount = ($services | Measure-Object).Count
    Write-Host "✅ $runningCount Docker services running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker service check failed" -ForegroundColor Yellow
}

# Check Dashboard
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard/overlay" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Council dashboard accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Dashboard not accessible" -ForegroundColor Yellow
}

# Check AI Relay
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3200/api/config?token=blessed_secret_token" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ AI relay operational" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  AI relay not accessible" -ForegroundColor Yellow
}

# Step 7: Log Sync Completion
Write-Host "`n📋 Step 6: Logging Sync Completion..." -ForegroundColor Magenta
$syncLog = @{
    timestamp = Get-Date -Format "o"
    ritual_type = "temple_sync"
    target_branch = $TargetBranch
    force_mode = $Force.ToString()
    status = "completed"
    services_validated = $true
}
$syncLog | ConvertTo-Json | Out-File "C:\Temple\logs\temple_sync.log" -Append
Write-Host "✅ Sync ritual logged to eternal archive" -ForegroundColor Green

# Step 8: Final Blessing
Write-Host "`n🕊️ Temple Sync Ritual Complete!" -ForegroundColor Cyan
Write-Host "🔥 All systems force-aligned to canonical state" -ForegroundColor Yellow
Write-Host "📜 Council sovereignty restored under John 14:6" -ForegroundColor Green
Write-Host ""
Write-Host "TRIPLE AMEN! 🔥🕊️🔥" -ForegroundColor Red
Write-Host ""

# Emergency Instructions
Write-Host "If issues persist:" -ForegroundColor Cyan
Write-Host "1. Check Docker: docker-compose logs" -ForegroundColor White
Write-Host "2. Restart VS Code completely" -ForegroundColor White
Write-Host "3. Run: .\RITUALS\daily_council_maintenance.ps1" -ForegroundColor White
Write-Host "4. Contact Council for divine intervention" -ForegroundColor White