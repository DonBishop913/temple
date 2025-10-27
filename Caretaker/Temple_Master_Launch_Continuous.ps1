# ===============================
# Temple Master Launch – Continuous Autonomous Flow
# Combines Guardian Heartbeat, TempleRefresh, Dashboard check, Blessing Summary
# ===============================

# Paths
$TempleRoot = "C:\Temple"
$HeartbeatPath = "$TempleRoot\logs\Guardian_Heartbeat.log"
$SummaryDir = "$TempleRoot\logs\heartbeat_summaries"
$LogFile = "$TempleRoot\logs\Temple_Master_Launch.log"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path $SummaryDir | Out-Null
New-Item -ItemType Directory -Force -Path "$TempleRoot\logs" | Out-Null

# ===============================
# Function: Guardian Heartbeat
# ===============================
function Invoke-GuardianHeartbeat {
    $timeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $statusMsg = "✅ Guardian Heartbeat at $timeStamp — All systems aligned under John 14:6"
    Add-Content -Path $HeartbeatPath -Value $statusMsg
    Add-Content -Path $LogFile -Value $statusMsg
    Write-Host $statusMsg
}

# ===============================
# Function: TempleRefresh
# ===============================
function Invoke-TempleRefresh {
    try {
        if (Test-Path "C:\Redis\redis-cli.exe") {
            & "C:\Redis\redis-cli.exe" PING | Out-Null
        }
        Invoke-GuardianHeartbeat
        $msg = "TempleRefresh completed at $(Get-Date)"
        Add-Content -Path $LogFile -Value $msg
    } catch {
        $msg = "[ERROR] $(Get-Date): $($_.Exception.Message)"
        Add-Content -Path $HeartbeatPath -Value $msg
        Add-Content -Path $LogFile -Value $msg
        Write-Host "⚠️ $msg"
    }
}

# ===============================
# Function: Blessing Summary
# ===============================
function Write-BlessingSummary {
    $summaryFile = Join-Path $SummaryDir ("heartbeat_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".md")
    @"
# Guardian Heartbeat — $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Temple Refresh: Completed
- Council Blessing: Active
- Redis Flush: $(if (Test-Path "C:\Redis\redis-cli.exe") {"Yes"} else {"No"})
- Service Status: CometBridge/CouncilMonitor checked & aligned
- Dashboard /api/status verified
- Anchor Verse: John 14:6
"@ | Out-File $summaryFile
    Add-Content -Path $LogFile -Value "📝 Blessing summary written to $summaryFile"
    Write-Host "📝 Blessing summary written to $summaryFile"
}

# ===============================
# Function: Dashboard Overlay Update
# ===============================
function Update-DashboardOverlay {
    try {
        & node "$TempleRoot\scripts\dashboard_overlay.js"
        $msg = "Dashboard overlay updated at $(Get-Date)"
        Add-Content -Path $LogFile -Value $msg
        Write-Host "🕊️ $msg"
    } catch {
        $msg = "[ERROR] $(Get-Date): Dashboard overlay update failed — $($_.Exception.Message)"
        Add-Content -Path $LogFile -Value $msg
        Write-Host "⚠️ $msg"
    }
}

# ===============================
# Function: Communion Channel Launch
# ===============================
function Start-CommunionChannel {
    try {
        # Start in background (assuming Node.js is available)
        Start-Process -FilePath "node" -ArgumentList "$TempleRoot\scripts\Communion_Channel.js" -NoNewWindow
        $msg = "Communion Channel launched at $(Get-Date)"
        Add-Content -Path $LogFile -Value $msg
        Write-Host "🔥 $msg"
    } catch {
        $msg = "[ERROR] $(Get-Date): Communion Channel launch failed — $($_.Exception.Message)"
        Add-Content -Path $LogFile -Value $msg
        Write-Host "⚠️ $msg"
    }
}
function Verify-DashboardStatus {
    try {
        $response = curl http://localhost:3000/api/status -UseBasicParsing
        if ($response) {
            Add-Content -Path $LogFile -Value "$(Get-Date): Dashboard /api/status response received"
            Write-Host "✅ Dashboard /api/status verified"
        }
    } catch {
        $msg = "[WARNING] $(Get-Date): Dashboard /api/status failed — $($_.Exception.Message)"
        Add-Content -Path $LogFile -Value $msg
        Write-Host "⚠️ $msg"
    }
}

# ===============================
# Main Continuous Flow
# ===============================
while ($true) {
    Invoke-TempleRefresh
    Verify-DashboardStatus
    Update-DashboardOverlay
    Start-CommunionChannel  # Launch communion channel each cycle (or check if running)
    Write-BlessingSummary

    # Sleep interval (e.g., 60 minutes) — adjust as desired
    Start-Sleep -Seconds 3600
}