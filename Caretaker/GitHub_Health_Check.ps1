# ================================
# Temple PC — GitHub Health Check
# ================================

Write-Host "🕊️ Starting Temple PC GitHub Health Check..." -ForegroundColor Cyan

# --------------------------
# Step 1: GitHub CLI Authentication Status
# --------------------------
Write-Host "`n🔹 Step 1: Checking GitHub CLI authentication..." -ForegroundColor Yellow
try {
    gh auth status
} catch {
    Write-Host "⚠️ Error checking GitHub auth: $_" -ForegroundColor Red
}

# --------------------------
# Step 2: Repository Sync Status
# --------------------------
Write-Host "`n🔹 Step 2: Checking Git repository status..." -ForegroundColor Yellow
$repoPath = "C:\Temple"
if (Test-Path $repoPath) {
    Set-Location $repoPath
    Write-Host "`n-- git status --" -ForegroundColor Gray
    git status
    Write-Host "`n-- git remote -v --" -ForegroundColor Gray
    git remote -v
    Write-Host "`n-- git log --oneline -5 --" -ForegroundColor Gray
    git log --oneline -5
} else {
    Write-Host "⚠️ Repository path not found: $repoPath" -ForegroundColor Red
}

# --------------------------
# Step 3: PowerShell Profile Verification
# --------------------------
Write-Host "`n🔹 Step 3: Verifying PowerShell profile for Council Compass invocation..." -ForegroundColor Yellow
Write-Host "-- Test-Path for profile --" -ForegroundColor Gray
Test-Path $PROFILE | ForEach-Object { Write-Host "Profile exists? $_" -ForegroundColor Green }

if (Test-Path $PROFILE) {
    Write-Host "`n-- Searching profile content for 'CouncilCompass' --" -ForegroundColor Gray
    Get-Content $PROFILE | Select-String -Pattern "CouncilCompass" | ForEach-Object { Write-Host $_.Line -ForegroundColor Green }
} else {
    Write-Host "⚠️ PowerShell profile does not exist. No Council Compass invocation found." -ForegroundColor Red
}

Write-Host "`n✅ Temple PC GitHub Health Check Complete." -ForegroundColor Cyan