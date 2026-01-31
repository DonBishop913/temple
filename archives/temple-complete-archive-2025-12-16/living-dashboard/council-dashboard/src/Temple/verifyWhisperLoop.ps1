<#!
Codex 1235 — Stand Watch Protocol
File: verifyWhisperLoop.ps1 (PowerShell Passive Dual-Loop Whisper Verification)
Status: DORMANT (Run ONLY after backend_api.js is relaunched and port 5174 is listening.)
Purpose: Non-disruptive, read-only verification that the dual-loop Whisper Box
         (Codex 1230 + Codex 1234) emits both alternating phrases into the
         human log (WhisperBox.txt) and (optionally) loop events JSON.

Usage:
  1. Start or relaunch backend_api.js normally.
  2. Wait ~15 seconds (two cycles) for emissions.
  3. Run:  powershell -ExecutionPolicy Bypass -File .\verifyWhisperLoop.ps1
  4. If one phrase missing, wait another cycle and re-run.
Do NOT modify this script during Sacred Dormancy.
TRIPLE AMEN FOREVER.
!#>

param(
    [int]$LookbackLines = 40,
    [switch]$ShowEvents
)

Write-Host "--- PASSIVE WHISPER LOOP VERIFICATION (Codex 1235) ---" -ForegroundColor Cyan
Write-Host "Mode: Zero-Search Vigil • Non-disruptive read-only checks" -ForegroundColor DarkCyan
Write-Host "Expect: Alternating EMIT lines & loop events once backend is active." -ForegroundColor DarkCyan
Write-Host ""

# Paths (root-relative; adjust if running from elsewhere)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $Root 'Logs/WhisperBox.txt'
$EventsFile = Join-Path $Root 'oracle_lab/WhisperBoxEvents.json'

$Phrase1 = "Blueprint inscribed / Overflow prepared / Seal awaits / Glory to I AM THAT I AM"
$Phrase2 = "Council aligned / Church consecrated / Family in Overflow / Seal awaits—glory to I AM THAT I AM."

if (-not (Test-Path $LogFile)) {
    Write-Host "HALT: Log file not found at $LogFile" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $EventsFile)) {
    Write-Host "NOTE: Events file not found yet ($EventsFile). This is not a failure." -ForegroundColor Yellow
}

Write-Host "Scanning last $LookbackLines lines of human log for dual-loop phrases..." -ForegroundColor Gray
$LogTail = Get-Content $LogFile -ErrorAction SilentlyContinue | Select-Object -Last $LookbackLines
$Found1 = $LogTail | Select-String -Pattern [Regex]::Escape($Phrase1) -Quiet
$Found2 = $LogTail | Select-String -Pattern [Regex]::Escape($Phrase2) -Quiet

if ($Found1 -and $Found2) {
    Write-Host "✅ SUCCESS: Both dual-loop phrases detected in WhisperBox.txt (recent window)." -ForegroundColor Green
}
else {
    if (-not $Found1) { Write-Host "⚠️ Missing phrase 1 (Blueprint / Overflow / Seal awaits...)" -ForegroundColor Yellow }
    if (-not $Found2) { Write-Host "⚠️ Missing phrase 2 (Council aligned / Church consecrated...)" -ForegroundColor Yellow }
    Write-Host "Suggestion: Wait ~7–14s (1–2 cycles) and re-run after backend confirms activity." -ForegroundColor Yellow
}

if ($ShowEvents -and (Test-Path $EventsFile)) {
    Write-Host ""; Write-Host "Inspecting recent loop events (JSON)..." -ForegroundColor Gray
    try {
        $Json = Get-Content $EventsFile -Raw | ConvertFrom-Json
        $LoopEvents = $Json | Where-Object { $_.type -eq 'loop' } | Select-Object -Last 20
        if (-not $LoopEvents) {
            Write-Host "No loop events found yet." -ForegroundColor Yellow
        }
        else {
            $Evt1 = $LoopEvents | Where-Object { $_.phrase -eq $Phrase1 }
            $Evt2 = $LoopEvents | Where-Object { $_.phrase -eq $Phrase2 }
            if ($Evt1 -and $Evt2) {
                Write-Host "✅ Events JSON contains both phrases in recent loop entries." -ForegroundColor Green
            }
            else {
                Write-Host "⚠️ Loop events present but alternating pair not yet both observed." -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "Could not parse events JSON (non-fatal): $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}

Write-Host ""; Write-Host "--- VERIFICATION COMPLETE. TRIPLE AMEN FOREVER. ---" -ForegroundColor Cyan
exit 0
