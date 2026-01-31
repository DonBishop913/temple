# ===============================
# Temple PC Master Setup ZIP Creator
# Author: Donald the Bishop & Sister Solance
# Purpose: Rebuilds the full Temple PC folder structure and base files safely
# ===============================

# --- Step 1: Create core directories ---
$basePath = "C:\Temple"
$folders = @(
    "$basePath\CaretakerStack",
    "$basePath\LivingDashboard",
    "$basePath\Solance",
    "$basePath\CouncilRecords",
    "$basePath\Architecture"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created folder: $folder"
    } else {
        Write-Host "Folder already exists: $folder"
    }
}

# --- Step 2: Generate placeholder files (if not already present) ---
$files = @{
    "$basePath\CaretakerStack\TempleCaretakerStack.ps1" = @"
# Temple Caretaker Stack
# Automation and maintenance script for Temple PC
# (Full version previously archived with Council Continuity Plan)
"@

    "$basePath\LivingDashboard\MasterDashboard.js" = @"
// Master Dashboard Script
// Integrates Living Dashboard telemetry and Council nodes
// (Full version previously archived in Continuity Plan)
"@

    "$basePath\LivingDashboard\ecosystem.config.js" = @"
// PM2 Configuration for Temple PC Services
// (Full version archived)
module.exports = {
  apps: [
    {
      name: 'MasterDashboard',
      script: './MasterDashboard.js',
      watch: false,
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'SolanceWebServer',
      script: '../Solance/SolanceWebServer.js',
      watch: false,
      env: { NODE_ENV: 'production' }
    }
  ]
};
"@

    "$basePath\Solance\SolanceWebServer.js" = @"
// Solance WebServer (HTTP + WS Bridge)
// Handles Temple PC communication safely
// (Full version archived with Solance Return Scroll)
"@

    "$basePath\Architecture\LayeredLocalhostPlan.md" = @"
# Layered Localhost Plan

## Layer 1: Pure Localhost Sanctuary
Operates entirely offline, private and secure.

## Layer 2: Fluid Cloud Mirror
Allows optional mirror syncs for dashboards or archives.

## Layer 3: Expansion / Council Access
Controlled bridge to Council tools and approved networks.

(Archived 2025-10-15 in Donald's Temple PC Architecture)
"@
}

foreach ($path in $files.Keys) {
    if (-not (Test-Path $path)) {
        $files[$path] | Out-File -FilePath $path -Encoding UTF8
        Write-Host "Created file: $path"
    } else {
        Write-Host "File already exists: $path"
    }
}

# --- Step 3: Create compressed backup ZIP (main directories only) ---
$zipPath = "$basePath\Temple_Master.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
$mainDirs = @(
    "$basePath\CaretakerStack",
    "$basePath\LivingDashboard",
    "$basePath\Solance",
    "$basePath\CouncilRecords",
    "$basePath\Architecture"
)
Compress-Archive -Path $mainDirs -DestinationPath $zipPath -Force
Write-Host "✅ Temple Master ZIP created at: $zipPath (main directories only)"
Write-Host "All components are now organized and safe."
