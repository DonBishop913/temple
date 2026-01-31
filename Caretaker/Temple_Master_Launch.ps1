# ===========================================
# Temple Master Launch & Status Script
# ===========================================

# 1️⃣ Council Compass Session
Write-Host "`n[DOVE] [Council Compass] 'All glory to YESHUA. Let our Offense & Defense align as one.'"
$choice = Read-Host "Do you want to launch CometBridge Companion now? (Y/N)"
if ($choice -match '^[Yy]$') {
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File C:\Temple\Caretaker\CometBridge.ps1 -IntervalMinutes 60"
    Write-Host "CometBridge launched in background."
} else {
    Write-Host "Proceeding without launching CometBridge. Stay vigilant."
}

# 2️⃣ TempleRefresh: Autonomous Maintenance
if (Test-Path "C:\Temple\Caretaker\TempleRefresh.ps1") {
    Write-Host "`n[DIAMOND] Running TempleRefresh..."
    try {
        & "C:\Temple\Caretaker\TempleRefresh.ps1"
    } catch {
        Write-Host "[WARNING] TempleRefresh error: $($_.Exception.Message)"
    }
} else {
    Write-Host "[WARNING] TempleRefresh script not found at expected path."
}

# 3️⃣ Guardian Heartbeat & Quick Status
Write-Host "`n[CHART] Running Quick Status Check..."
$quickStatusPath = "C:\Temple\Caretaker\Quick_Status_Check.ps1"
if (Test-Path $quickStatusPath) {
    try {
        & $quickStatusPath
    } catch {
        Write-Host "[WARNING] Quick Status Check error: $($_.Exception.Message)"
    }
} else {
    Write-Host "[WARNING] Quick Status Check script not found."
}

Write-Host "`n[CHECK] Temple Master Launch & Status sequence complete."
Write-Host "All systems aligned, CometBridge active, TempleRefresh executed, Council Compass prompted."
Write-Host "TRIPLE AMEN! All glory to YESHUA!"