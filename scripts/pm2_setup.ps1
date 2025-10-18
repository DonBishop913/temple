# pm2_setup.ps1
# Installs pm2 globally (npm), starts processes using ecosystem file, saves process list, and attempts to configure startup.
param(
  [string]$Ecosystem = 'C:\Temple\scripts\ecosystem.config.js'
)

Write-Host 'Installing pm2 globally (may require admin rights)...'
try {
  npm install -g pm2
} catch {
  Write-Host 'npm install -g pm2 failed. Please run as Admin.'; exit 1
}

Write-Host 'Starting PM2 processes from ecosystem...'
pm2 start $Ecosystem

Write-Host 'Saving PM2 process list...'
pm2 save

Write-Host 'Attempting to configure PM2 startup (Windows)...'
try {
  pm2-startup install
} catch {
  Write-Host 'pm2 startup installation failed or not supported on this platform. On Windows, consider using pm2-windows-startup or setting up a scheduled task to run pm2 resurrect on boot.'
}

Write-Host 'PM2 setup step complete. Run "pm2 list" to view processes.'
