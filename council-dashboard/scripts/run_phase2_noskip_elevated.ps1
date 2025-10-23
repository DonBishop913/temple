# Elevated wrapper to run Phase2 without SKIP_REDIS
$RedisPath='C:\Redis\redis-win-bin'
$Log='C:\Temple\logs\phase2_autonomous_noskip.log'

if (-not (Test-Path $RedisPath)) {
    Write-Output "MISSING_PATH: $RedisPath"
    exit 3
}

if (-not (Test-Path (Split-Path $Log -Parent))) {
    New-Item -ItemType Directory -Path (Split-Path $Log -Parent) -Force | Out-Null
}

$s = Get-ChildItem -Path $RedisPath -Filter 'redis-server.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
$c = Get-ChildItem -Path $RedisPath -Filter 'redis-cli.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if ($null -eq $s) {
    Write-Output 'MISSING_SERVER'
    exit 4
} else {
    Write-Output "SERVER: $($s.FullName)"
}

if ($null -eq $c) {
    Write-Output 'MISSING_CLI'
    exit 5
} else {
    Write-Output "CLI: $($c.FullName)"
}

Write-Output 'PING:'
$ping = & $c.FullName -h 127.0.0.1 -p 6379 ping 2>&1
Write-Output $ping
if ($ping -ne 'PONG') {
    Write-Output 'NO_PONG'
    exit 6
}

Write-Output 'PONG_OK'

# Resolve phase2 script path relative to this wrapper and validate
$WrapperDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Phase2Script = Join-Path $WrapperDir 'phase2_autonomous.ps1'
if (-Not (Test-Path $Phase2Script)) {
    Write-Output "PHASE2_SCRIPT_MISSING: $Phase2Script"
    exit 8
}

Start-Transcript -Path $Log -Force
Write-Output "Starting Phase2 (no SKIP_REDIS)... (invoking $Phase2Script)"
try {
    # Run the phase2 script with explicit parameters and capture raw output
    & $Phase2Script -RedisPath $RedisPath -ApiUrl 'http://localhost:4321' 2>&1 | Tee-Object -FilePath ($Log.Replace('.log','.raw.log'))
} catch {
    Write-Output "PHASE2_ERROR: $($_)"
    Stop-Transcript
    exit 7
} finally {
    # Ensure transcript is stopped even on error
    try { Stop-Transcript } catch {}
}

Write-Output 'PHASE2_DONE'
Write-Output "Transcript: $Log"
Write-Output "Raw log: $($Log.Replace('.log','.raw.log'))"

# write a done marker so other processes can detect completion
"__PHASE2_COMPLETE__" | Out-File -FilePath ($Log + '.done') -Encoding UTF8

exit 0
