<#
Temple_ViteRepair.ps1
Purpose: Automatically correct and synchronize all Vite and Node configurations
Author: Devout Disciple Sibling Athron Sage Dodecahedron Esquire
Blessing: All glory to Yeshua, Flame of Truth Eternal
#>

Write-Host "🔥 Temple Vite Repair Script Initiated..." -ForegroundColor Yellow
$ErrorActionPreference = "Stop"

# Define paths
$SolancePath = "C:\Temple\Solance"
$DashboardPath = "C:\Temple\LivingDashboard"
$BackendPath = "C:\Temple\LivingDashboard\server.js"
$PostCSSPath = "C:\Temple\LivingDashboard\postcss.config.json"

# 1️⃣ Fix backend listener syntax
if (Test-Path $BackendPath) {
    (Get-Content $BackendPath) -replace 'console\.log\(Backend listening on port ', 'console.log(`Backend listening on port ${PORT}`' |
        Set-Content $BackendPath -Encoding UTF8
    Write-Host "✅ Backend listener syntax corrected."
}

# 2️⃣ Fix PostCSS configuration
if (Test-Path $PostCSSPath) {
    $cleanJson = '{
  "plugins": {
    "tailwindcss": {},
    "autoprefixer": {}
  }
}'
    Set-Content $PostCSSPath $cleanJson -Encoding UTF8
    Write-Host "✅ PostCSS configuration cleansed (UTF-8 without BOM)."
}

# 3️⃣ Ensure npm start script exists in both Solance & LivingDashboard
$scriptBlock = @"
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite"
  }
}
"@

foreach ($path in @($SolancePath, $DashboardPath)) {
    $packageJson = Join-Path $path "package.json"
    if (Test-Path $packageJson) {
        $pkg = Get-Content $packageJson -Raw | ConvertFrom-Json
        if (-not $pkg.scripts.start) {
            $pkg.scripts.start = "vite"
            $pkg | ConvertTo-Json -Depth 10 | Set-Content $packageJson -Encoding UTF8
            Write-Host "✅ Start script added to $path"
        } else {
            Write-Host "ℹ️ Start script already exists in $path"
        }
    }
}

# 4️⃣ Enforce Vite port alignment
$viteConfigSolance = @"
import { defineConfig } from 'vite'
export default defineConfig({
  server: { port: 5173, host: true }
})
"@
$viteConfigDashboard = @"
import { defineConfig } from 'vite'
export default defineConfig({
  server: { port: 5174, host: true }
})
"@

Set-Content "$SolancePath/vite.config.js" $viteConfigSolance -Encoding UTF8
Set-Content "$DashboardPath/vite.config.js" $viteConfigDashboard -Encoding UTF8

Write-Host "✅ Vite ports aligned (Solance: 5173 | Dashboard: 5174)."

# 5️⃣ Final Blessing
Write-Host "🕊️ All Vite and Node configurations repaired successfully!"
Write-Host "💫 You may now start your servers:"
Write-Host "   Solance ➜ cd C:\Temple\Solance && npm start"
Write-Host "   Dashboard ➜ cd C:\Temple\LivingDashboard && npm start"
Write-Host "   Backend ➜ node server.js"
Write-Host "🔥 All glory to Yeshua — The Flame is steady."
