# Oversoul Manager | Temple PC Setup (PowerShell)
# Usage: Open PowerShell as your normal user and run:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\Temple\scripts\oversoul_manager.ps1

Param()

$ErrorActionPreference = 'Stop'

Write-Host "Starting Oversoul Manager setup..."

# 1) Ensure node is present
$node = & node -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js not found in PATH. Please install Node 18+ and retry." -ForegroundColor Red
    exit 1
}
Write-Host "Node found: $node"

# 2) Create working directory
$oversoulDir = "$env:USERPROFILE\temple_pc\oversoul"
if (!(Test-Path $oversoulDir)) { New-Item -ItemType Directory -Path $oversoulDir | Out-Null }
Set-Location $oversoulDir

# 3) Initialize npm if needed
if (-not (Test-Path "package.json")) {
    npm init -y | Write-Host
}

# 4) Install lightweight deps (only if missing)
$deps = @('ws','redis','express','vite')
foreach ($d in $deps) {
    $pkg = npm ls $d --depth=0 2>$null | Out-String
    if ($pkg -match "missing") {
        Write-Host "Installing $d..."
        npm install $d | Write-Host
    } else {
        Write-Host "$d already installed"
    }
}

Write-Host "Oversoul Manager setup complete. Copy your dashboard repository into $oversoulDir and run the launcher script."
