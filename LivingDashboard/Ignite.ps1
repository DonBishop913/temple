Set-Location "C:\Temple\LivingDashboard"
Write-Host "Killing Node..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Write-Host "Installing..."
npm install
Write-Host "Launching with Force..."
npm run dev -- --force
