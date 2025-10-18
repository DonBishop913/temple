$ErrorActionPreference = 'Stop'

Write-Host "[Council] Preparing environment..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\.."

if (!(Test-Path package.json)) {
  Write-Error "package.json not found. Run this script from the council-dashboard/scripts folder."
}

Write-Host "[Council] Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "[Council] Starting frontend (Vite) and backend (Express) in parallel..." -ForegroundColor Cyan
npm run dev:all
