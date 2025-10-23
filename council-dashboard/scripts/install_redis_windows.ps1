<#
Install Redis for Windows into C:\Redis\redis-win-bin

Behavior:
- Tries a list of candidate URLs to download a ZIP containing redis-server.exe and redis-cli.exe
- Extracts into C:\Redis\redis-win-bin
- Unblocks executables
- Attempts a ping via redis-cli; if needed, starts redis-server and retries
#>

Set-StrictMode -Version Latest
$Target = 'C:\Redis\redis-win-bin'
$TempZip = Join-Path $env:TEMP 'redis-win-download.zip'

if (-not (Test-Path $Target)) {
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
}

$urls = @(
    'https://github.com/tporadowski/redis/releases/latest/download/redis-x64-7.0.15.zip',
    'https://github.com/tporadowski/redis/releases/download/v7.0.15/redis-x64-7.0.15.zip',
    'https://github.com/tporadowski/redis/releases/latest/download/redis-x64.zip',
    'https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip'
)

Write-Output "Target install path: $Target"

$downloaded = $false
foreach ($url in $urls) {
    Write-Output "Trying: $url"
    try {
        if (Test-Path $TempZip) { Remove-Item -Path $TempZip -Force -ErrorAction SilentlyContinue }
        # Use Invoke-WebRequest; -UseBasicParsing for PS5.1 compatibility
        Invoke-WebRequest -Uri $url -OutFile $TempZip -UseBasicParsing -TimeoutSec 60 -ErrorAction Stop
        if ((Test-Path $TempZip) -and ((Get-Item $TempZip).Length -gt 1024)) {
            Write-Output "Downloaded to $TempZip"
            $downloaded = $true
            break
        } else {
            Write-Output "Downloaded file missing or too small"
        }
    } catch {
        Write-Output "Download failed: $($_.Exception.Message)"
    }
}

if (-not $downloaded) {
    Write-Output "All download attempts failed. Please provide a Redis ZIP and extract it to $Target or create a junction to an existing redis folder. Exiting."
    exit 2
}

# Extract ZIP
Write-Output "Extracting $TempZip -> $Target"
try {
    if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $TempZip -DestinationPath $Target -Force
    } else {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($TempZip, $Target)
    }
} catch {
    Write-Output "Extraction failed: $($_.Exception.Message)"
    exit 3
}

# Unblock executables and list them
Get-ChildItem -Path $Target -Filter '*.exe' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue }
Write-Output ("Executables under {0}:" -f $Target)
Get-ChildItem -Path $Target -Filter 'redis-*.exe' -Recurse | Select-Object FullName,Length,LastWriteTime | ForEach-Object { Write-Output $_.FullName }

# Try to find cli and ping
$cli = Get-ChildItem -Path $Target -Filter 'redis-cli.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
$server = Get-ChildItem -Path $Target -Filter 'redis-server.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $cli) { Write-Output 'redis-cli.exe not found after extraction'; exit 4 }
if (-not $server) { Write-Output 'redis-server.exe not found after extraction'; exit 5 }

Write-Output "Found CLI: $($cli.FullName)"
Write-Output "Found SERVER: $($server.FullName)"

# Attempt ping first (maybe server already running)
try {
    $ping = & $cli.FullName -h 127.0.0.1 -p 6379 ping 2>&1
    Write-Output "Ping raw: $ping"
} catch {
    Write-Output "Ping attempt failed: $($_.Exception.Message)"
}

if ($ping -ne 'PONG') {
    Write-Output 'Starting redis-server in background...'
    try {
        Start-Process -FilePath $server.FullName -ArgumentList '--port','6379' -WorkingDirectory (Split-Path $server.FullName) -WindowStyle Minimized -PassThru | Out-Null
        Start-Sleep -Seconds 4
        $ping = & $cli.FullName -h 127.0.0.1 -p 6379 ping 2>&1
        Write-Output "Ping after start: $ping"
    } catch {
        Write-Output "Failed to start redis-server: $($_.Exception.Message)"
    }
}

if ($ping -eq 'PONG') {
    Write-Output 'SUCCESS: Redis installed and responding to PONG'
    exit 0
} else {
    Write-Output 'FAILED: Redis did not respond to PING after attempt'
    exit 6
}
