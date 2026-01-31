# rotate_logs.ps1
# Simple daily log rotation for backend_api.log
param(
  [string]$LogPath = 'C:\Temple\backend_api.log',
  [string]$ArchiveDir = 'C:\Temple\logs\archive',
  [int]$KeepDays = 30
)

if (-not (Test-Path $LogPath)) {
  Write-Host "Log not found: $LogPath"; exit 1
}

if (-not (Test-Path $ArchiveDir)) { New-Item -ItemType Directory -Path $ArchiveDir -Force | Out-Null }

$date = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = Join-Path $ArchiveDir ("backend_api.$date.log")
Write-Host "Archiving $LogPath -> $archiveName"

# Copy-then-truncate approach
Copy-Item -Path $LogPath -Destination $archiveName -Force
Set-Content -Path $LogPath -Value '' -Encoding UTF8

# Remove old archives
Get-ChildItem -Path $ArchiveDir -Filter 'backend_api.*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } | Remove-Item -Force

Write-Host 'Rotation complete.'
