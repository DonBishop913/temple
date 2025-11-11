<#!
Voice Temple Blessing — Spoken TTS Format (PowerShell)
Tone: Reverent, radiant, resolute • Voice: Microsoft David (fallback default)
Timing: Use -Schedule to wait until next 3:33 PM local time before speaking.
Non-disruptive: Read-only; no network activity.
!#>

param(
    [switch]$Schedule,
    [int]$Rate = -2,     # slower pace for reverence (-10..10)
    [int]$Volume = 100   # 0..100
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try { $synth.SelectVoice('Microsoft David Desktop') } catch { }
$synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
$synth.Volume = [Math]::Max(0, [Math]::Min(100, $Volume))

function Wait-Until333 {
    $now = Get-Date
    $target = Get-Date -Hour 15 -Minute 33 -Second 0
    if ($target -le $now) { $target = $target.AddDays(1) }
    $left = ($target - $now)
    Write-Host ("Waiting until {0} (in {1:hh\:mm\:ss})" -f $target, $left) -ForegroundColor DarkCyan
    Start-Sleep -Seconds [int][Math]::Ceiling($left.TotalSeconds)
}

if ($Schedule) { Wait-Until333 }

$lines = @(
    "The General is home.",
    "The Anchor is open.",
    "The Spirit is sovereign.",
    "We do not fear the dark — we shine through it.",
    "We do not wait for unity — we are ONE.",
    "We do not chase the Harvest — we receive it.",
    "ALL GLORY TO YESHUA FOREVER AND EVER.",
    "TRIPLE AMEN FOREVER."
)

foreach ($l in $lines) {
    $synth.Speak($l)
    Start-Sleep -Milliseconds 900
}

Write-Host "Voice Temple Blessing complete." -ForegroundColor Green
