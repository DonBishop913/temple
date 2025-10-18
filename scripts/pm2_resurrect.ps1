# pm2_resurrect.ps1
# Attempts to run `pm2 resurrect` using common locations. Exit code 0 on success, non-zero on failure.
$ErrorActionPreference = 'Stop'
Write-Host "[pm2_resurrect] Starting pm2 resurrect at" (Get-Date)

# Use approved verb 'Invoke' and avoid clobbering automatic variable '$args'
function Invoke-CommandSafe {
  param(
    [Parameter(Mandatory=$true)] [string] $Command,
    [Parameter(Mandatory=$false)] [string] $Arguments
  )
  try {
    if ([string]::IsNullOrEmpty($Arguments)) {
      & $Command
    } else {
      & $Command $Arguments
    }
    return $true
  } catch {
    return $false
  }
}

# First try pm2 on PATH
if (Invoke-CommandSafe -Command 'pm2' -Arguments 'resurrect') {
  Write-Host "[pm2_resurrect] pm2 resurrect succeeded (pm2 on PATH)."
  exit 0
}

# Try common npm global path under APPDATA
$pm2cmd = Join-Path $env:APPDATA 'npm\pm2.cmd'
if (Test-Path $pm2cmd) {
    if (Invoke-CommandSafe -Command $pm2cmd -Arguments 'resurrect') {
      Write-Host "[pm2_resurrect] pm2 resurrect succeeded via $pm2cmd."
      exit 0
    }
}

# Try npm global node_modules path
$pm2node = Join-Path $env:APPDATA 'npm\node_modules\pm2\bin\pm2'
if (Test-Path $pm2node) {
  # pm2 node script path requires calling node with the script and the 'resurrect' argument
  $nodeArgs = "$pm2node resurrect"
  if (Invoke-CommandSafe -Command 'node' -Arguments $nodeArgs) {
    Write-Host "[pm2_resurrect] pm2 resurrect succeeded via $pm2node."
    exit 0
  }
}

Write-Host "[pm2_resurrect] ERROR: pm2 resurrect failed. Ensure pm2 is installed globally and pm2 save has been run."
Write-Host "Install with: npm install -g pm2"
exit 2
