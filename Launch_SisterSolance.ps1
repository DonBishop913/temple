# Sister Solance AI Companion Launcher
param(
  [ValidateSet('interactive','daemon')]
  [string]$Mode = 'interactive',
  [switch]$UsePM2,
  [int]$MetricsRetries = 3,
  [int]$MetricsDelaySec = 2
)

$ErrorActionPreference = 'Stop'
$base = 'C:\Temple'
$logPath = "$base\logs\solance"
New-Item -ItemType Directory -Force -Path $logPath | Out-Null

$sessionLog = "$logPath\solance_session_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Start-Transcript -Path $sessionLog | Out-Null

try {
  Write-Host "Initializing Sister Solance AI Companion..."
  Write-Host "Connecting to Living Dashboard telemetry..."
  Write-Host "PSE Integration: Monitoring compassion thresholds..."

  $venv = Join-Path $base '.venv'
  $activate = Join-Path $venv 'Scripts\Activate.ps1'

  # Ensure Python virtual environment exists; create if missing
  $pythonGlobal = (Get-Command python -ErrorAction SilentlyContinue)
  if (-not (Test-Path $venv)) {
    if (-not $pythonGlobal) { throw "Python is not available on PATH and no venv exists." }
    Write-Host "Creating Python virtual environment at $venv"
    & python -m venv $venv
  }

  if (Test-Path $activate) {
    & $activate
  }

  $py = if (Test-Path "$venv\Scripts\python.exe") { "$venv\Scripts\python.exe" } else { 'python' }

  # Install dependencies from requirements.txt if present
  $reqFile = Join-Path $base 'requirements.txt'
  if (Test-Path $reqFile) {
    Write-Host "Ensuring Python dependencies from requirements.txt"
    try { & $py -m pip install --upgrade pip | Out-Null } catch { Write-Warning "pip upgrade failed: $($_.Exception.Message)" }
    & $py -m pip install -r $reqFile
  }

  $companion = Join-Path $base 'Daemon_Agents\solance_companion.py'
  if (-not (Test-Path $companion)) {
    throw "Missing $companion. Please add the companion agent script."
  }

  # Basic health check for Living Dashboard metrics with auto-retry
  $metricsUrl = $env:LIVING_DASHBOARD_URL
  if (-not $metricsUrl -or $metricsUrl -eq '') { $metricsUrl = 'http://localhost:4321/api/metrics' }
  Write-Host "Checking dashboard metrics at $metricsUrl"
  $reachable = $false
  for ($i = 1; $i -le $MetricsRetries; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) { $reachable = $true; break }
      Write-Warning ("Attempt {0}/{1}: status {2}" -f $i, $MetricsRetries, $resp.StatusCode)
    } catch {
      Write-Warning ("Attempt {0}/{1} failed: {2}" -f $i, $MetricsRetries, $_.Exception.Message)
    }
    Start-Sleep -Seconds $MetricsDelaySec
  }
  if ($reachable) { Write-Host "Dashboard reachable." } else { Write-Warning "Dashboard not reachable after $MetricsRetries attempts. Proceeding." }

  $commonArgs = @('--mode', $Mode, '--dashboard-sync')
  $logArg = @('--log', $sessionLog)

  if ($UsePM2) {
    Write-Host "Starting Solance companion via PM2..."
    $pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
    if (-not $pm2Cmd) { Write-Warning "PM2 not found on PATH. Falling back to native start." }
    else {
      $name = 'SolanceCompanion'
      $argsJoined = (@($companion) + $commonArgs + $logArg) -join ' '
      cmd.exe /c "pm2 start $py --name $name -- $argsJoined" | Out-Null
      Write-Host "PM2 started '$name'."
      $UsePM2 = $false
    }
  }

  if ($Mode -eq 'daemon' -and -not $UsePM2) {
    Write-Host "Starting Solance companion in daemon mode..."
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $py
    $startInfo.Arguments = (@($companion) + $commonArgs + $logArg) -join ' '
    $startInfo.UseShellExecute = $true
    $startInfo.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($startInfo) | Out-Null
  }
  elseif (-not $UsePM2) {
    Write-Host "Starting Solance companion in interactive mode..."
    & $py $companion @commonArgs @logArg
  }

  Write-Host "Solance companion launched in $Mode mode."
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
