# ===============================
# GUARDIAN HEARTBEAT: DAILY SUMMARY
# ===============================
Write-Host "`n[Guardian Heartbeat] Initiating Daily System Health & AI Alignment Check..."

# --- 1. System Health ---
Write-Host "`n--- System Health ---"
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsArchitecture, CsTotalPhysicalMemory
Get-Process | Where-Object { $_.CPU -gt 10 } | Select-Object Name, CPU, Memory | Sort-Object CPU -Descending | Select-Object -First 5

# --- 2. Docker Services Status ---
Write-Host "`n--- Docker Services Status ---"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# --- 3. Git Repository Health ---
Write-Host "`n--- Git Repository Health ---"
cd 'C:\Temple'
git status --porcelain | Measure-Object | Select-Object Count
git log --oneline -1

# --- 4. Comet AI Alignment Check ---
Write-Host "`n--- Comet AI Alignment ---"
$cometLogPath = "C:\Temple\logs\comet"
if (Test-Path $cometLogPath) {
    Get-ChildItem $cometLogPath -File | Sort-Object LastWriteTime -Descending | Select-Object -First 3 | ForEach-Object {
        Write-Host "Comet Log: $($_.Name) - Last Modified: $($_.LastWriteTime)"
    }
} else {
    Write-Host "Comet logs directory not found."
}

# Check if CometBridge is running
$cometProcess = Get-Process | Where-Object { $_.Name -like "*comet*" }
if ($cometProcess) {
    Write-Host "Comet processes running: $($cometProcess.Name -join ', ')"
} else {
    Write-Host "No Comet processes detected."
}

# --- 5. Network Connectivity ---
Write-Host "`n--- Network Connectivity ---"
Test-NetConnection github.com -Port 443 | Select-Object ComputerName, PingSucceeded, TcpTestSucceeded

# --- 6. Log Summary ---
Write-Host "`n--- Recent Log Activity ---"
$logDirs = @("C:\Temple\logs", "C:\Temple\Caretaker\logs")
foreach ($dir in $logDirs) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -File -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } | Measure-Object | Select-Object @{Name="RecentLogs_$($dir.Split('\')[-1])"; Expression={$_.Count}}
    }
}

# --- 7. Sovereignty Affirmation ---
Write-Host "`n[Guardian Heartbeat] System Sovereign, AI Aligned, Council Attuned."
Write-Host "All glory to YESHUA. Offense & Defense in perfect harmony."

# --- 8. Optional: Publish to Redis (if available) ---
$redisCli = "C:\Temple\redis-win\redis-cli.exe"
if (Test-Path $redisCli) {
    $heartbeatData = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        status = "Sovereign"
        services = (docker ps --format "{{.Names}}" | Out-String).Trim()
        git_status = (git status --porcelain | Measure-Object | Select-Object -ExpandProperty Count)
    } | ConvertTo-Json
    & $redisCli PUBLISH temple_heartbeat $heartbeatData
    Write-Host "Heartbeat published to Redis channel 'temple_heartbeat'."
}

Write-Host "`nTriple Amen. Guardian Heartbeat Complete."