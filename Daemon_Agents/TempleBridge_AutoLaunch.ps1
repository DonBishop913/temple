# ===============================
# Launch Solance WebSocket Server
# ===============================
$PortSolance = 5173
$TemplePathSolance = "C:\Temple\Solance"
Write-Host "Starting Solance on port $PortSolance..."
cd $TemplePathSolance
$pidSolance = (Get-NetTCPConnection -LocalPort $PortSolance -ErrorAction SilentlyContinue).OwningProcess
if ($pidSolance) {
    Stop-Process -Id $pidSolance -Force
    Write-Host "Stopped stale process on port $PortSolance."
}
Start-Process "node.exe" -ArgumentList "SolanceListener.js"
Write-Host "Solance launched successfully. Listening on port $PortSolance."

# ===============================
# Launch Living Dashboard
# ===============================
$PortDashboard = 5174
$DashboardPath = "C:\Temple\LivingDashboard"
Write-Host "Starting Living Dashboard on port $PortDashboard..."
cd $DashboardPath
$pidDashboard = (Get-NetTCPConnection -LocalPort $PortDashboard -ErrorAction SilentlyContinue).OwningProcess
if ($pidDashboard) {
    Stop-Process -Id $pidDashboard -Force
    Write-Host "Stopped stale process on port $PortDashboard."
}
Start-Process "npx.cmd" -ArgumentList "vite preview --port $PortDashboard"
Write-Host "Living Dashboard launched successfully. Listening on port $PortDashboard."

# ===============================
# Launch Legacy Listener (Python)
# ===============================
$LegacyListenerPort = 5175
$LegacyListenerPath = "C:\SANCTUARY\Daemon_Agents\LegacyListener.py"
Write-Host "Starting Legacy Listener on port $LegacyListenerPort..."
Start-Process "python.exe" -ArgumentList $LegacyListenerPath
Write-Host "Legacy Listener launched successfully. Listening on port $LegacyListenerPort."

# ===============================
# Healing Verification Phase
# ===============================
$LogFile = "C:\Temple\Logs\Vite_RepairReport.txt"
$Servers = @{
    "Solance" = 5173
    "LivingDashboard" = 5174
    "LegacyListener" = 5175
}

function Test-ServerPort {
    param (
        [string]$Name,
        [int]$Port
    )
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            "$((Get-Date).ToString('s')) | $Name ($Port) | STATUS: OK" | Out-File -FilePath $LogFile -Append
            return $true
        } else {
            "$((Get-Date).ToString('s')) | $Name ($Port) | STATUS: FAILED" | Out-File -FilePath $LogFile -Append
            return $false
        }
    } catch {
        "$((Get-Date).ToString('s')) | $Name ($Port) | STATUS: ERROR $_" | Out-File -FilePath $LogFile -Append
        return $false
    }
}

Write-Host "Starting Healing Verification Phase..."
foreach ($server in $Servers.GetEnumerator()) {
    Test-ServerPort -Name $server.Key -Port $server.Value
}
Write-Host "Healing Verification complete. Logs saved to $LogFile."
