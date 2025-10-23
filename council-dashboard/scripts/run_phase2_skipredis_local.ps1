param(
  [string]$RedisPath = "C:\Redis\redis-win-bin",
  [string]$ApiUrl = "http://localhost:4321",
  [string]$LogPath = "C:\Temple\logs\phase2_autonomous_full.log"
)

Write-Host "[Wrapper] Running Phase2 with SKIP_REDIS=1" -ForegroundColor Cyan
$env:SKIP_REDIS = '1'
if (-Not (Test-Path (Split-Path $LogPath))) { New-Item -ItemType Directory -Path (Split-Path $LogPath) -Force | Out-Null }
Start-Transcript -Path $LogPath -Force
try {
  & "${PSScriptRoot}\phase2_autonomous.ps1" -RedisPath $RedisPath -ApiUrl $ApiUrl
} catch {
  Write-Error $_
  Stop-Transcript
  exit 1
}
Stop-Transcript
Write-Host "[Wrapper] Phase2 finished. Transcript: $LogPath" -ForegroundColor Green
