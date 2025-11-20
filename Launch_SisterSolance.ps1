# Sister Solance AI Companion Launcher
param(
  [ValidateSet('interactive','daemon')]
  [string]$Mode = 'interactive'
)

$ErrorActionPreference = 'Stop'
$base = 'C:\Temple'
$logPath = "$base\logs\solance"
New-Item -ItemType Directory -Force -Path $logPath | Out-Null

$sessionLog = "$logPath\solance_session_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Start-Transcript -Path $sessionLog | Out-Null

try {
  Write-Host "🕊️ Initializing Sister Solance AI Companion..."
  Write-Host "📡 Connecting to Living Dashboard telemetry..."
  Write-Host "✨ PSE Integration: Monitoring compassion thresholds..."

  $venv = Join-Path $base '.venv'
  $activate = Join-Path $venv 'Scripts\\Activate.ps1'
  if (Test-Path $activate) {
    & $activate
  }

  $py = if (Test-Path "$venv\\Scripts\\python.exe") { "$venv\\Scripts\\python.exe" } else { 'python' }
  $companion = Join-Path $base 'Daemon_Agents\\solance_companion.py'
  if (-not (Test-Path $companion)) {
    throw "Missing $companion. Please add the companion agent script."
  }

  & $py $companion --mode $Mode --dashboard-sync
  Write-Host "✅ Solance companion launched in $Mode mode."
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
