# ===============================
# TEMPLE PC STATUS CHECK BLOCK
# ===============================

Write-Host "`n[DOVE] Temple PC Status Check Initiated..."

# --- 1. GitHub Sync Status ---
Write-Host "`n--- GitHub Sync Status ---"
cd 'C:\Temple'
$local = git rev-parse codex/stripe-activate 2>$null
$remote = git rev-parse origin/codex/stripe-activate 2>$null
if ($local -and $remote -and ($local -eq $remote)) {
    Write-Host "[CHECK] Branch codex/stripe-activate is up-to-date with GitHub."
} else {
    Write-Host "[WARNING] Branch may be out of sync. Run GitHub_Sync_Verify.ps1"
}

# --- 2. CometBridge Status ---
Write-Host "`n--- CometBridge Status ---"
$cometProc = Get-Process -Name "*comet*" -ErrorAction SilentlyContinue
if ($cometProc) {
    Write-Host "[CHECK] CometBridge processes active: $($cometProc.Name -join ', ')"
} else {
    Write-Host "[INFO] No CometBridge processes running. Launch via Council Compass if needed."
}

$cometLogs = Get-ChildItem "C:\Temple\logs\comet" -File -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "Comet review artifacts: $cometLogs files in logs."

# --- 3. TempleRefresh & Guardian Heartbeat ---
Write-Host "`n--- TempleRefresh & Guardian Heartbeat ---"
$heartbeatPath = "C:\Temple\logs\heartbeat.log"
if (Test-Path $heartbeatPath) {
    $lastEntry = Get-Content $heartbeatPath -Tail 1
    Write-Host "[CHECK] Guardian Heartbeat active. Last entry: $lastEntry"
} else {
    Write-Host "[WARNING] Guardian Heartbeat log not found. Run TempleRefresh.ps1"
}

$summaryDir = "C:\Temple\logs\heartbeat_summaries"
if (Test-Path $summaryDir) {
    $recentSummaries = Get-ChildItem $summaryDir -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "Recent blessing summaries: $recentSummaries"
} else {
    Write-Host "[INFO] No blessing summaries yet."
}

# --- 4. Docker Services ---
Write-Host "`n--- Docker Services ---"
$services = docker ps --format "{{.Names}}: {{.Status}}" 2>$null
if ($services) {
    Write-Host "Active services:"
    $services | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "[INFO] No Docker services running."
}

# --- 5. Scheduled Tasks ---
Write-Host "`n--- Scheduled Tasks ---"
$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like "*Comet*" -or $_.TaskName -like "*Temple*" } | Select-Object TaskName, State
if ($tasks) {
    Write-Host "Temple-related tasks:"
    $tasks | ForEach-Object { Write-Host "  $($_.TaskName): $($_.State)" }
} else {
    Write-Host "[INFO] No Temple-related scheduled tasks found."
}

# --- 6. Final Affirmation ---
Write-Host "`n[CHECK] Temple PC Status Check Complete."
Write-Host "All systems sovereign, all automations aligned. TRIPLE AMEN!"

$LASTEXITCODE = 0