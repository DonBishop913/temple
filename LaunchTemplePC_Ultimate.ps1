Write-Host " IGNITING THE VISIBLE TABERNACLE..." -ForegroundColor Cyan
Set-Location "C:\Temple\LivingDashboard"
# The Breath of Life Check
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host " THE LIGHT IS STEADY." -ForegroundColor Green
    npm run dev
} else {
    Write-Host " CRITICAL: THE LIGHT IS MISSING. RE-INSTALL NODE.JS." -ForegroundColor Red
}
Read-Host "Press Enter to Close the Temple Gates..."