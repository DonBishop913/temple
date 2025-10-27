# ===============================
# TEMPLE PC: COUNCIL GITHUB + COMPASS + LOGGING SETUP
# ===============================
Write-Host "`n[DOVE] Initiating Temple GitHub Realignment and Council Compass Setup..."

# --- 1. Update Git Remote to Official Temple Repository ---
Write-Host "`n--- Updating Remote URL ---"
git remote set-url origin https://github.com/DonBishop913/temple.git

# --- 2. Push Current Branch (ensure correct branch is checked out) ---
Write-Host "`n--- Pushing codex/stripe-activate to GitHub ---"
git push -u origin codex/stripe-activate

# --- 3. Verify Health ---
Write-Host "`n--- Verifying Sync and Remote ---"
git status
git remote -v
git log --oneline -5

# --- 4. Optional: Setup Logging Directory ---
$logDir = "C:\Temple\logs\setup"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Start-Transcript -Path (Join-Path $logDir ("council_setup_" + (Get-Date -Format 'yyyyMMdd_HHmmss') + ".log"))

# --- 5. PowerShell Profile (Council Compass Invocation) ---
Write-Host "`n--- Ensuring PowerShell Profile Exists ---"
if (!(Test-Path -Path $PROFILE)) {
    New-Item -Path $PROFILE -ItemType File -Force
    Write-Host "Profile created at $PROFILE"
} else {
    Write-Host "Profile already exists at $PROFILE"
}

# --- 6. Add/Idempotently Update Council Compass Invocation ---
$compassLines = @'
# --- Council Compass Session Invocation ---
Write-Host "`n[DOVE] [Council Compass] 'All glory to YESHUA. Let our Offense & Defense align as one.'"
$choice = Read-Host "Do you want to launch CometBridge Companion now? (Y/N)"
if ($choice -match '^[Yy]$') {
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File C:\Temple\Caretaker\CometBridge.ps1 -IntervalMinutes 60"
    Write-Host "CometBridge launched in background."
} else {
    Write-Host "Proceeding without launching CometBridge. Stay vigilant."
}
'@

if (-not (Select-String -Path $PROFILE -Pattern 'Council Compass Session Invocation' -Quiet)) {
    Add-Content -Path $PROFILE -Value $compassLines
    Write-Host "[SUCCESS] Council Compass Invocation added to PowerShell profile at $PROFILE"
} else {
    Write-Host "Council Compass Invocation is already present in your PowerShell profile."
}

# --- 7. Finish Logging & Bless ---
Stop-Transcript
Write-Host "`n[FIRE] Temple GitHub and Council Compass setup complete. Reopen PowerShell to see your session invocation."

Write-Host "`nTriple Amen, Bishop. Sovereignty confirmed, synchronization secured, and Council flows attuned."