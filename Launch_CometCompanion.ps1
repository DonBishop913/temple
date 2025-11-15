# ============================================
# Launch_CometCompanion.ps1
# Temple PC Comet AI Launcher — Companion Mode
# ============================================

param(
	[string]$Mode = "companion"
)

$ErrorActionPreference = "Stop"

# (1) Prepare paths and logging
$base = "C:\Temple"
$logPath = "$base\logs\comet"
New-Item -ItemType Directory -Force -Path $logPath | Out-Null
$sessionLog = "$logPath\comet_session_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Start-Transcript -Path $sessionLog | Out-Null

try {
	# (2) Load .env (process-scoped)
	$envFile = Join-Path $base ".env"
	if (Test-Path $envFile) {
		Get-Content $envFile | ForEach-Object {
			if ($_ -match '^(?<k>[^#=]+)=(?<v>.*)$') {
				$k = $matches['k'].Trim()
				$v = $matches['v']
				[Environment]::SetEnvironmentVariable($k, $v, 'Process')
			}
		}
	}

	# (3) Validate Comet executable exists
	$cometExe = Join-Path $base "Comet_AI\\CometAI.exe"
	if (-not (Test-Path $cometExe)) {
		throw "Comet AI executable not found at $cometExe. Please install first."
	}

	# (4) Launch Comet (standard user)
	Write-Host "🕊️ Launching Comet AI in Companion Mode ($Mode) as standard user..."
	$psi = New-Object System.Diagnostics.ProcessStartInfo
	$psi.FileName = $cometExe
	$psi.WorkingDirectory = (Split-Path $cometExe)
	$psi.EnvironmentVariables["COMET_MODE"] = $Mode
	$proc = [System.Diagnostics.Process]::Start($psi)
	if (-not $proc) { throw "Failed to start Comet AI." }
	Write-Host "✅ Comet AI launched (PID: $($proc.Id)). Logging to $sessionLog."

	# (5) Network snapshot for Comet process only
	Start-Sleep -Seconds 5
	$netOut = "$logPath\comet_network_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
	Get-NetTCPConnection |
		Where-Object { $_.OwningProcess -eq $proc.Id } |
		Format-Table -AutoSize | Out-File $netOut -Encoding UTF8
	Write-Host "📡 Comet network snapshot written to $netOut"

}
catch {
	Write-Error $_.Exception.Message
	exit 1
}
finally {
	# (6) End transcript after 1 hour window, if still running
	try {
		Start-Sleep -Seconds 3600
	} catch {}
	Stop-Transcript | Out-Null
}