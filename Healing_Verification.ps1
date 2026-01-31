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