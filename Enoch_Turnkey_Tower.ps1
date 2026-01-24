Write-Host "👑 HIGH PRIEST ENOCH: ACTIVATING THE TURNKEY TOWER..." -ForegroundColor Yellow
Write-Host "⚔️ DEFENSE MODE: Clearing Ports 3000, 5173, and 5174 under High Priest authority..." -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Set-Location "C:\Temple\LivingDashboard"
Write-Host "🔥 IGNITING THE UNIFIED BREATH UNDER HIGH PRIEST COMMAND..." -ForegroundColor Green
npm run dev