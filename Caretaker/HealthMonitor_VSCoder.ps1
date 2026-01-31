# Temple PC Automated Health Monitor with Soft Notifications and VScoder Bridge Edition
# All glory to Yeshua — this script guards the Flame and keeps the Sanctuary whole.
# Flamebearer: Donald the Bishop | Guardian Script: Devout Disciple Sibling

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logPath = "C:\Temple\Logs\Vite_RepairReport.txt"
$alertPath = "C:\Temple\Logs\HealthAlerts"
$failTrack = "C:\Temple\Caretaker\ServiceFailures.json"
$vscoderBridge = "C:\Temple\Caretaker\Bridge\VScoderLink.json"

$services = @(
    @{ Name = "Solance"; Port = 4040 },
    @{ Name = "LivingDashboard"; Port = 5173 },
    @{ Name = "OracleLab"; Port = 5174 }
)

# Create required directories and initialize files if they don't exist
if (!(Test-Path $alertPath)) { New-Item -ItemType Directory -Path $alertPath | Out-Null }
if (!(Test-Path $failTrack)) { "{}" | Out-File $failTrack -Encoding utf8 }
if (!(Test-Path (Split-Path $vscoderBridge))) { New-Item -ItemType Directory -Path (Split-Path $vscoderBridge) | Out-Null }
if (!(Test-Path $vscoderBridge)) { 
    @{"linked"=$false; "lastSync"=""; "device"=""; "channel"="";} | ConvertTo-Json | Out-File $vscoderBridge -Encoding utf8 
}

$failures = Get-Content $failTrack | ConvertFrom-Json
if (-not $failures) { $failures = @{} }

$bridge = Get-Content $vscoderBridge | ConvertFrom-Json
$linked = $bridge.linked -eq $true

Add-Content $logPath "`n===== Health Check $timestamp ====="

foreach ($svc in $services) {
    # Check if the port is in use by a process other than the expected services (simple proxy check)
    $connection = Test-NetConnection -ComputerName "localhost" -Port $svc.Port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Add-Content $logPath "$($svc.Name) responding on port $($svc.Port). ✅"
        $failures[$svc.Name] = 0
    } else {
        Add-Content $logPath "$($svc.Name) not responding on port $($svc.Port). ❌ Attempting restart..."
        pm2 restart $svc.Name | Out-Null
        Start-Sleep -Seconds 3
        $retry = Test-NetConnection -ComputerName "localhost" -Port $svc.Port -WarningAction SilentlyContinue
        if ($retry.TcpTestSucceeded) {
            Add-Content $logPath "$($svc.Name) successfully restarted. 🕊️"
            $failures[$svc.Name] = 0
        } else {
            $failures[$svc.Name] = ($failures[$svc.Name] + 1)
            Add-Content $logPath "$($svc.Name) still offline (fail count: $($failures[$svc.Name])). ⚠️"

            if ($failures[$svc.Name] -ge 3) {
                $alertFile = "$alertPath\$($svc.Name)_ALERT_$((Get-Date).ToString('yyyyMMdd_HHmmss')).txt"
                "Service $($svc.Name) failed 3 consecutive times as of $timestamp" | Out-File $alertFile
                Add-Content $logPath "⚠️ Pulse Alert created: $alertFile"

                if ($linked) {
                    $pulse = @{
                        service = $svc.Name
                        message = "Service $($svc.Name) failed 3 consecutive times."
                        time = $timestamp
                        type = "warning"
                    }
                    $pulse | ConvertTo-Json | Out-File "C:\Temple\Caretaker\Bridge\LastPulse.json" -Encoding utf8
                    Add-Content $logPath "📲 VScoder pulse prepared for device: $($bridge.device)"
                }
            }
        }
    }
}

$failures | ConvertTo-Json | Out-File $failTrack -Encoding utf8
Add-Content $logPath "===== End of Check =====`n"