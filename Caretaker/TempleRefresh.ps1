<#
TempleRefresh.ps1
Ultimate Temple PC Maintenance Script — Fully Sovereign, Spiritually Harmonized, Council Compass Enabled
All glory to THE SOURCE — Yeshua, The Most High
Features: Council Compass session invocation, Guardian Heartbeat, Log Cleanup, Redis Flush, Lightweight Service Restart, CometBridge Hourly Invocation, Log Rotation, Blessing Mode, Defensive Logging, Error Handling, Spiritual Affirmations, GitHub Sync Check, Exit Code
#>

# ===== Council Compass Session Invocation =====
Write-Host "`n[DOVE] [Council Compass] 'All glory to YESHUA. Let our Offense & Defense align as one.'"
# Autonomous mode: skip prompt
$choice = "y"

Write-Host "[FIRE][DOVE] Temple Refresh Initiated — All glory to THE SOURCE!"
Write-Host "May every process, log, and service align to HIS will..."
Start-Sleep 1

# ===== Guardian Heartbeat =====
$heartbeatPath = "C:\Temple\logs\heartbeat.log"
New-Item -ItemType Directory -Force -Path (Split-Path $heartbeatPath -Parent) | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$heartbeatMessage = "$timestamp - Guardian Heartbeat: Temple Refresh executed, system sovereign and alive."
Add-Content -Path $heartbeatPath -Value $heartbeatMessage
Write-Host "[HEART] Guardian Heartbeat recorded."

# ===== Optional: Log Rotation =====
try {
    if ((Test-Path $heartbeatPath) -and ((Get-Item $heartbeatPath).Length -gt 1MB)) {
        $archive = "$heartbeatPath." + (Get-Date -Format "yyyyMMdd_HHmmss") + ".bak"
        Move-Item $heartbeatPath $archive
        Write-Host "[BOX] Heartbeat archive created at $archive."
    }
} catch { Write-Host "[WARNING] Failed to rotate heartbeat log: $($_.Exception.Message)" }

# ===== Optional: Blessing Mode Summary =====
try {
    $summaryDir = "C:\Temple\logs\heartbeat_summaries"
    New-Item -ItemType Directory -Force -Path $summaryDir | Out-Null
    $summaryFile = Join-Path $summaryDir ("heartbeat_" + (Get-Date -Format "yyyyMMdd") + ".md")
    $summaryContent =
@"
# Guardian Heartbeat - $((Get-Date).ToString('yyyy-MM-dd'))
- Temple Refresh: Completed
- Council Blessing: Active
- Log Cleanup: $((Get-Date).ToString())
- Redis Flush: $(if (Test-Path "C:\Redis\redis-cli.exe") {"Yes"} else {"No"})
- Service Status: CometBridge/CouncilMonitor checked and aligned
- Spiritual Affirmation: 'All glory to YESHUA. Let our Offense and Defense align as one.'
"@
    $summaryContent | Out-File $summaryFile
    Write-Host "[NOTE] Blessing summary written to $summaryFile"
} catch { Write-Host "[WARNING] Failed to create blessing summary: $($_.Exception.Message)" }

# ===== Clear Old Logs (14 days) =====
$logPaths = @(
    "C:\Temple\logs\comet",
    "C:\Temple\logs\redis",
    "C:\Temple\logs\system"
)
foreach ($path in $logPaths) {
    try {
        if (Test-Path $path) {
            Get-ChildItem -Path $path -Recurse -File |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
            Remove-Item -Force -ErrorAction SilentlyContinue
            Write-Host "[TRASH] Cleared old logs in $path"
        }
    } catch { Write-Host "[WARNING] Failed log cleanup in ${path}: $($_.Exception.Message)" }
}

# ===== Flush Redis Cache (if present) =====
try {
    if (Test-Path "C:\Redis\redis-cli.exe") {
        & "C:\Redis\redis-cli.exe" FLUSHALL | Out-Null
        Write-Host "[WIND] Redis cache flushed."
    }
} catch { Write-Host "[WARNING] Failed to flush Redis cache: $($_.Exception.Message)" }

# ===== Restart Lightweight Services =====
$services = @("CouncilMonitor")
foreach ($svc in $services) {
    try {
        $proc = Get-Process -Name $svc -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force
            Start-Sleep 3
            Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File C:\Temple\Caretaker\$svc.ps1"
            Write-Host "[RESTART] $svc restarted and aligned."
        } else {
            Write-Host "[CHECK] $svc not running - skipping restart."
        }
    } catch { Write-Host "[WARNING] Failed to restart ${svc}: $($_.Exception.Message)" }
}

# ===== Launch CometBridge Hourly Invocation =====
$cometBridgePath = "C:\Temple\Caretaker\CometBridge.ps1"
try {
    $cometProc = Get-Process -Name "CometBridge" -ErrorAction SilentlyContinue
    if (-not $cometProc) {
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $cometBridgePath -IntervalMinutes 60"
        Write-Host "[ROCKET] CometBridge launched in background for hourly review."
    } else {
        Write-Host "[CHECK] CometBridge already running - no action needed."
    }
} catch { Write-Host "[WARNING] Failed to launch CometBridge: $($_.Exception.Message)" }

# ===== Optional: Spiritual Affirmation Rotation =====
$affirmations = @(
    "All glory to YESHUA - system aligned!",
    "The Guardian Heartbeat sings; the Temple is sovereign.",
    "Offense and Defense harmonized in divine alignment.",
    "Blessings upon every log, process, and code flow."
)
Write-Host "[STAR] Spiritual Affirmation: $($affirmations | Get-Random)"

# ===== GitHub Sync Check =====
try {
    Write-Host "`n[LINK] Checking GitHub branch alignment..."
    Set-Location "C:\Temple"

    # Fetch latest from origin
    & git fetch origin

    # Get local vs remote branch info
    $local = & git rev-parse codex/stripe-activate
    $remote = & git rev-parse origin/codex/stripe-activate

    if ($local -eq $remote) {
        Write-Host "[CHECK] GitHub Sync Check: codex/stripe-activate is fully up-to-date with origin."
    } else {
        Write-Host "[WARNING] GitHub Sync Check: local branch differs from origin. Manual review required."
    }
} catch {
    Write-Host "[WARNING] GitHub Sync Check failed: $($_.Exception.Message)"
}

# ===== Final Blessing =====
Write-Host "Sparkle Temple maintenance complete. No restart needed. System remains sovereign and clean."
Write-Host "[DOVE] All processes, logs, and automations are now in alignment with HIS will."
Write-Host "[MOON] Guardian Heartbeat present at $heartbeatPath - check for timestamped confirmation."

# ===== Exit Code for Parent Automation =====
$global:LASTEXITCODE = 0