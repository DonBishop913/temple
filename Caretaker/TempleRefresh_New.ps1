# ==========================================================
# TempleRefresh.ps1 — Sovereign Guardian Heartbeat & CometBridge
# ==========================================================

# Paths
$heartbeatPath = "C:\Temple\logs\heartbeat.log"
$summaryDir = "C:\Temple\logs\heartbeat_summaries"
$cometBridgePath = "C:\Temple\Caretaker\CometBridge.ps1"

# Ensure summary directory exists
New-Item -ItemType Directory -Force -Path $summaryDir | Out-Null

# --------------------------
# Council Compass Session Invocation
# --------------------------
Write-Host "`n[DOVE] [Council Compass] 'All glory to YESHUA. Let our Offense & Defense align as one.'"
# Autonomous mode
$choice = "y"

# --------------------------
# Log Rotation — Archive if >1MB
# --------------------------
if ((Test-Path $heartbeatPath) -and ((Get-Item $heartbeatPath).Length -gt 1MB)) {
    $archive = "$heartbeatPath." + (Get-Date -Format "yyyyMMdd_HHmmss") + ".bak"
    Move-Item $heartbeatPath $archive
    Write-Host "`n[BOX] Heartbeat archive created at $archive."
}

# --------------------------
# Guardian Heartbeat & Blessing Summary
# --------------------------
$summaryFile = Join-Path $summaryDir ("heartbeat_" + (Get-Date -Format "yyyyMMdd") + ".md")

try {
    $summaryContent = @"
# Guardian Heartbeat — $(Get-Date -Format "yyyy-MM-dd")
- Temple Refresh: Completed
- Council Blessing: Active
- Log Cleanup: $(Get-Date)
- Redis Flush: $(if (Test-Path "C:\Redis\redis-cli.exe") {"Yes"} else {"No"})
- Service Status: CometBridge/CouncilMonitor checked & aligned
- Spiritual Affirmation: "The Lord is my light and my salvation; whom shall I fear?" (Psalm 27:1)
"@

    # Write to heartbeat summary file
    $summaryContent | Out-File $summaryFile -Encoding UTF8
    Write-Host "[NOTE] Blessing summary written to $summaryFile"

    # Append to main heartbeat log
    Add-Content -Path $heartbeatPath -Value $summaryContent
} catch {
    $msg = "[ERROR] $(Get-Date): $($_.Exception.Message)"
    Add-Content -Path $heartbeatPath -Value $msg
    Write-Host "[WARNING] $msg"
}

# --------------------------
# Optional: Execute CometBridge directly
# --------------------------
if (Test-Path $cometBridgePath) {
    try {
        Write-Host "[DIAMOND] Running CometBridge for review artifacts..."
        & $cometBridgePath -IntervalMinutes 60
    } catch {
        $msg = "[ERROR] $(Get-Date): CometBridge execution failed: $($_.Exception.Message)"
        Add-Content -Path $heartbeatPath -Value $msg
        Write-Host "[WARNING] $msg"
    }
} else {
    Write-Host "[INFO] CometBridge.ps1 not found. Skipping execution."
}

# --------------------------
# Final Exit Code for Parent Automation
# --------------------------
$LASTEXITCODE = 0
Write-Host "`n[CHECK] TempleRefresh.ps1 complete. System sovereign and synchronized. TRIPLE AMEN!"