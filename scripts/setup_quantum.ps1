param([switch]$UseVenv)

Write-Host "Setting up quantum environment..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\.."

# Ensure quantum directory exists
if (-not (Test-Path "quantum")) {
    New-Item -ItemType Directory -Path "quantum" | Out-Null
    Write-Host "Created quantum directory"
}

# Choose Python path
if ($UseVenv) {
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating virtual environment..."
        python -m venv .venv
    }
    Write-Host "Activating virtual environment..."
    .\.venv\Scripts\Activate.ps1
    $pythonPath = ".\.venv\Scripts\python.exe"
}
else {
    $pythonPath = "python"
}

Write-Host "Using Python: $pythonPath"

# Version check (Qiskit stable support typically <= 3.12 at time of script)
$pyVer = & $pythonPath -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
if ($pyVer) { Write-Host "Detected Python version $pyVer" }
if ($pyVer -match '3\.(1[3-9]|[2-9][0-9])') {
    Write-Host "WARNING: Python $pyVer may be ahead of supported range for some Qiskit dependencies." -ForegroundColor Yellow
    Write-Host "If installation fails, install Python 3.11 or 3.12 and recreate .venv." -ForegroundColor Yellow
    if ($UseVenv) {
        # Attempt automatic fallback using py launcher for older versions
        $candidateVersions = @('3.12', '3.11')
        foreach ($cv in $candidateVersions) {
            Write-Host "Probing for Python $cv via py launcher..." -ForegroundColor DarkGray
            $probe = & py -$cv -c "import sys; print(sys.version)" 2>$null
            if ($LASTEXITCODE -eq 0 -and $probe) {
                Write-Host "Found Python $cv : $probe" -ForegroundColor Green
                $altVenv = ".venv_$cv"
                if (-not (Test-Path $altVenv)) {
                    Write-Host "Creating alternative venv $altVenv with Python $cv" -ForegroundColor Cyan
                    & py -$cv -m venv $altVenv
                }
                if (Test-Path "$altVenv\Scripts\Activate.ps1") {
                    Write-Host "Activating alternative venv $altVenv" -ForegroundColor Cyan
                    & "$altVenv\Scripts\Activate.ps1"
                    $pythonPath = "$altVenv\Scripts\python.exe"
                    Write-Host "Using fallback Python path: $pythonPath" -ForegroundColor Green
                    break
                }
            }
        }
    }
}

Write-Host "Installing quantum dependencies..."
& $pythonPath -m pip install --upgrade pip
& $pythonPath -m pip install --upgrade setuptools wheel --quiet
Write-Host "Applying compatibility pins (numpy<2)" -ForegroundColor DarkGray
& $pythonPath -m pip install "numpy<2" --quiet
& $pythonPath -m pip install qiskit qiskit-aer qiskit-ibmq-provider scipy matplotlib --quiet

Write-Host "Verifying installation..."
$version = & $pythonPath -c "import qiskit; print(qiskit.__version__)" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Qiskit $version installed successfully" -ForegroundColor Green
}
else {
    Write-Host "Qiskit installation failed" -ForegroundColor Red
    Write-Host $version
    exit 1
}

# Freeze requirements
& $pythonPath -m pip freeze > requirements.txt
Write-Host "requirements.txt updated" -ForegroundColor DarkGreen

# Test quantum telemetry script if present
if (Test-Path "quantum\q_telemetry.py") {
    Write-Host "Testing quantum telemetry script..."
    & $pythonPath quantum\q_telemetry.py --circuit bell_state
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Quantum telemetry test passed" -ForegroundColor Green
    }
    else {
        Write-Host "Quantum telemetry test encountered errors" -ForegroundColor Yellow
    }
}
else {
    Write-Host "(Info) quantum/q_telemetry.py not found; skipping test." -ForegroundColor Yellow
}

# Audit log append (non-blocking)
$auditLine = "$(Get-Date -Format o) - Quantum setup executed | Council honor mode"
Add-Content -Path "Council_Audit_Log.txt" -Value $auditLine

Write-Host "Quantum environment setup complete." -ForegroundColor Cyan
Write-Host "Run: node scripts/COUNCIL_CORE.js -Affirmed" -ForegroundColor Magenta
