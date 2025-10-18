param([switch]$Zip)

# Production build and optional packaging for the Council Dashboard
# - Builds Vite frontend
# - Starts Express server serving dist
# - Optionally zips dist + server for deployment

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root '..')

Write-Host "[prod] Ensuring dependencies..."
if (!(Test-Path 'node_modules')) {
  npm install
}

Write-Host "[prod] Building frontend..."
npm run build

if ($Zip) {
  Write-Host "[prod] Packaging deployment zip..."
  $dest = Join-Path (Get-Location) '..\\council-dashboard-prod.zip'
  $paths = @(
    (Join-Path (Get-Location) 'dist\\*'),
    (Join-Path (Get-Location) 'server\\server.js'),
    (Join-Path (Get-Location) 'package.json'),
    (Join-Path (Get-Location) 'package-lock.json')
  )
  Compress-Archive -Path $paths -DestinationPath $dest -Force
  Write-Host "[prod] Archive created at $dest"
}

Write-Host "[prod] Starting server..."
node server/server.js
