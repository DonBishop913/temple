<#
CometBridge.ps1
Purpose: Safe, non-autonomous bridge for Comet AI -> Living Dashboard / Council review.
Runs as Standard User only. Never commits, never elevates. Produces review artifacts and optionally publishes a short summary to Redis if redis-cli is available.

Usage examples:
# Run once (foreground)
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Temple\Caretaker\CometBridge.ps1" -IntervalMinutes 60 -DryRun:$true

# Run continuously (simple loop)
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Temple\Caretaker\CometBridge.ps1" -IntervalMinutes 60
#>
param(
    [int]$IntervalMinutes = 60,
    [switch]$DryRun
)

# -------------------------
# Paths & Constants (safe)
# -------------------------
$Base = "C:\Temple"
$CometAppData = Join-Path $Base "Comet_AI"
$CometLogs = Join-Path $Base "logs\comet"
$BridgeDir = Join-Path $Base "Caretaker\CometBridge"
$OutForReview = Join-Path $BridgeDir "for_review"
$RedisCli = "C:\Redis\redis-win-bin\redis-cli.exe"
$RedisChannel = "comet:bridge"
$Log = Join-Path $BridgeDir ("bridge_run_" + (Get-Date -Format 'yyyyMMdd_HHmmss') + ".log")

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $CometAppData, $CometLogs, $BridgeDir, $OutForReview | Out-Null

function Write-Log {
    param($txt)
    $time = (Get-Date).ToString("u")
    $line = "$time`t$txt"
    $line | Tee-Object -FilePath $Log -Append | Out-Null
}

# -------------------------
# Safety gate: ensure non-admin
# -------------------------
if ([bool]([System.Security.Principal.WindowsIdentity]::GetCurrent().Groups -match "S-1-5-32-544")) {
    # current user member of Administrators group; warn but proceed only if user accepts
    Write-Host "⚠️ Warning: This script is best run as a Standard User. Running as admin may bypass intended safety boundaries." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

Write-Log "CometBridge started. Interval: $IntervalMinutes minutes. DryRun: $($DryRun.IsPresent)"

# -------------------------
# Helper: build safe summary from latest logs
# -------------------------
function Build-Summary {
    # collect last N lines from each Comet log and produce a JSON summary
    $summary = [ordered]@{}
    $summary["generated_at"] = (Get-Date).ToString("o")
    $summary["host"] = $env:COMPUTERNAME
    $summary["comet_log_files"] = @()

    $latestLogs = Get-ChildItem -Path $CometLogs -File -Filter "*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    foreach ($f in $latestLogs) {
        $entry = [ordered]@{}
        $entry["name"] = $f.Name
        $entry["last_write"] = $f.LastWriteTime.ToString("o")
        try {
            # take last 120 lines to avoid huge payloads
            $tail = Get-Content -Path $f.FullName -Tail 120 -ErrorAction Stop
            $entry["tail"] = ($tail -join "`n")
        } catch {
            $entry["tail"] = "[unable to read]"
        }
        $summary["comet_log_files"] += $entry
    }

    # simple system sanity
    $summary["disk_free_mb"] = [math]::Round((Get-PSDrive -Name C).Free/1MB,2)
    $summary["recent_activity_count"] = ($summary["comet_log_files"] | Measure-Object).Count
    return $summary
}

# -------------------------
# Helper: write for-review artifact and optional redis publish
# -------------------------
function Publish-Summary {
    param($summary)

    $safeName = "comet_summary_" + (Get-Date -Format 'yyyyMMdd_HHmmss')
    $json = $summary | ConvertTo-Json -Depth 6

    # write JSON artifact ready for human review
    $jsonPath = Join-Path $OutForReview ($safeName + ".json")
    $json | Out-File -FilePath $jsonPath -Encoding UTF8
    Write-Log "Wrote review artifact: $jsonPath"

    # create a short plain-text summary for quick viewing
    $txtPath = Join-Path $OutForReview ($safeName + ".txt")
    $txt = @()
    $txt += "Comet Bridge Summary: $($summary.generated_at)"
    $txt += "Host: $($summary.host)"
    $txt += "Disk free (MB): $($summary.disk_free_mb)"
    $txt += "Recent log files: $($summary.recent_activity_count)"
    $txt += "`nFiles included:"
    foreach ($f in $summary.comet_log_files) {
        $txt += " - $($f.name) (last: $($f.last_write))"
    }
    $txt | Out-File -FilePath $txtPath -Encoding UTF8
    Write-Log "Wrote quick summary: $txtPath"

    # Optional: publish to local Redis channel if redis-cli exists
    if (Test-Path $RedisCli) {
        try {
            # publish a short payload (single-line) to Redis channel for dashboard listeners
            $payload = (@{host=$summary.host;generated=$summary.generated_at;count=$summary.recent_activity_count} | ConvertTo-Json -Compress)
            & $RedisCli PUBLISH $RedisChannel $payload | Out-Null
            Write-Log "Published summary to Redis channel '$RedisChannel' (payload length: $($payload.Length))."
        } catch {
            Write-Log "Failed to publish to Redis: $($_.Exception.Message)"
        }
    } else {
        Write-Log "redis-cli not found at $RedisCli; skipping Redis publish."
    }
}

# -------------------------
# Main one-shot run (and loop)
# -------------------------
do {
    try {
        Write-Log "Building summary..."
        $summary = Build-Summary
        Write-Log "Summary built; writing artifacts..."
        if ($DryRun) {
            Write-Log "DryRun mode: would write artifacts and optionally publish to Redis."
        } else {
            Publish-Summary -summary $summary
        }
    } catch {
        Write-Log "ERROR during run: $($_.Exception.Message)"
    }

    # if running in non-loop mode (IntervalMinutes <= 0), break
    if ($IntervalMinutes -le 0) { break }

    Write-Log "Sleeping for $IntervalMinutes minutes..."
    Start-Sleep -Seconds ($IntervalMinutes * 60)
} while ($true)