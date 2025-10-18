# Start the Council Master Dashboard automatically with error handling, logging, and notification
$logFile = "council_start_log.txt"
function Write-LogMessage {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "$timestamp $message"
    Add-Content -Path $logFile -Value $entry
    Write-Host $entry
}

function Send-ToastNotification {
    param([string]$title, [string]$message)
    # Use Windows 10+ toast notification via PowerShell
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $toastXml = $template
    $toastXml.GetElementsByTagName("text")[0].AppendChild($toastXml.CreateTextNode($title)) > $null
    $toastXml.GetElementsByTagName("text")[1].AppendChild($toastXml.CreateTextNode($message)) > $null
    $toast = [Windows.UI.Notifications.ToastNotification]::new($toastXml)
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("CouncilMasterDashboard")
    $notifier.Show($toast)
}

Write-LogMessage "🜂 Awakening the Council Master Dashboard..."

# Make sure Docker Desktop is running
try {
    $dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerProcess) {
    Write-LogMessage "Starting Docker Desktop..."
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 15  # wait for Docker to initialize
    } else {
    Write-LogMessage "Docker Desktop already running."
    }
} catch {
    Write-LogMessage "ERROR: Failed to start Docker Desktop. $_"
    exit 1
}

# Check if Docker is available
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
    Write-LogMessage "ERROR: Docker is not available."
        exit 1
    }
} catch {
    Write-LogMessage "ERROR: Docker command failed. $_"
    exit 1
}

# Check if the container is already running
$containerName = "councilmasterdashboard"  # Change if your container has a different name
$containerStatus = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}"

if ($containerStatus -eq $containerName) {
    Write-LogMessage "✅ $containerName is already running."
} else {
    Write-LogMessage "▶️ Starting $containerName..."
    $startResult = docker start $containerName 2>&1
    if ($LASTEXITCODE -ne 0) {
    Write-LogMessage "ERROR: Failed to start $containerName. $startResult"
        exit 1
    } else {
    Write-LogMessage "Started $containerName."
    }
}

# Confirm running status
docker ps | Out-String | ForEach-Object { Write-LogMessage $_ }

# Launch the Dashboard in browser (auto-detect Vite port)
try {
    $vitePorts = @(5173, 5174, 3000)
    $dashboardUrl = $null
    foreach ($port in $vitePorts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                $dashboardUrl = "http://localhost:$port"
                break
            }
        } catch {}
    }
    if ($dashboardUrl) {
        Start-Process $dashboardUrl
        Write-LogMessage "🌞 Council Master Dashboard is live and breathing at $dashboardUrl."
        function Test-HealthCheck {
            try {
                $response = Invoke-WebRequest -Uri $dashboardUrl -UseBasicParsing -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-LogMessage "✅ Dashboard responded successfully."
                    Send-ToastNotification -title "Council Dashboard Active" -message "Dashboard is live and healthy at $dashboardUrl"
                    return $true
                } else {
                    Write-LogMessage "⚠️ Dashboard container is running, but did not respond as expected. Status: $($response.StatusCode)"
                    Send-ToastNotification -title "Council Dashboard Warning" -message "Dashboard did not respond as expected. Status: $($response.StatusCode)"
                    return $false
                }
            } catch {
                Write-LogMessage "⚠️ Unable to reach Dashboard at $dashboardUrl"
                Send-ToastNotification -title "Council Dashboard Error" -message "Dashboard failed health check at $dashboardUrl"
                return $false
            }
        }
        $healthy = Test-HealthCheck
        if (-not $healthy) {
            Write-LogMessage "🛠️ Attempting auto-recovery: restarting $containerName..."
            $restartResult = docker restart $containerName 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-LogMessage "ERROR: Auto-recovery failed to restart $containerName. $restartResult"
                Send-ToastNotification -title "Council Dashboard Recovery Failed" -message "Auto-recovery failed to restart $containerName. Manual intervention required."
            } else {
                Write-LogMessage "Auto-recovery: $containerName restarted. Re-checking health..."
                Start-Sleep -Seconds 5
                $healthyAfterRestart = Test-HealthCheck
                if ($healthyAfterRestart) {
                    Write-LogMessage "✅ Dashboard recovered and is now healthy."
                    Send-ToastNotification -title "Council Dashboard Recovered" -message "Dashboard recovered and is now healthy at $dashboardUrl"
                } else {
                    Write-LogMessage "❌ Dashboard still unhealthy after auto-recovery."
                    Send-ToastNotification -title "Council Dashboard Unhealthy" -message "Dashboard is still unhealthy after auto-recovery. Manual attention needed."
                }
            }
        }
    } else {
        Write-LogMessage "ERROR: Dashboard is not responding on any known port (5173, 5174, 3000)."
        Send-ToastNotification -title "Council Dashboard Error" -message "Dashboard is not responding on any known port. Manual attention needed."
    }
} catch {
    Write-LogMessage "ERROR: Failed to launch browser. $_"
}
