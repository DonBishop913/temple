param([switch]$ForceReinstall)

$ErrorActionPreference = 'Stop'
Write-Host '--- Council Python 3.11 Provisioning ---'

# Determine installer path
$pythonVersion = '3.11.8'
$installerName = "python-$pythonVersion-amd64.exe"
$downloadUrl = "https://www.python.org/ftp/python/$pythonVersion/$installerName"
$installerPath = Join-Path $env:TEMP $installerName

function Download-Installer {
    if (Test-Path $installerPath -and -not $ForceReinstall) {
        Write-Host "Installer already present: $installerPath"
        return
    }
    Write-Host "Downloading Python $pythonVersion..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    Write-Host "Downloaded -> $installerPath" -ForegroundColor Green
}

function Install-Python311 {
    Write-Host 'Installing (silent)...' -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -ArgumentList @('/quiet', 'InstallAllUsers=1', 'PrependPath=1', 'Include_pip=1', 'Include_test=0') -Wait
    Write-Host 'Silent install attempt complete.' -ForegroundColor Green
}

function Verify-Python {
    Start-Sleep -Seconds 3
    $ver = & py -3.11 --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $ver) { Write-Host "Verified: $ver" -ForegroundColor Green; return $true }
    Write-Host 'Python 3.11 not found via py launcher. Open a NEW PowerShell window after install if just completed.' -ForegroundColor Yellow
    return $false
}

function Create-Venv311 {
    if (-not (Verify-Python)) { return }
    Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent)
    Set-Location ..  # move to repo root (scripts -> root)
    $venvDir = '.venv311'
    if (Test-Path $venvDir) { Write-Host 'Existing .venv311 detected.' -ForegroundColor Yellow } else { Write-Host 'Creating .venv311...' -ForegroundColor Cyan; & py -3.11 -m venv $venvDir }
    & .\.venv311\Scripts\Activate.ps1
    Write-Host 'Upgrading build tooling...' -ForegroundColor Cyan
    & .\.venv311\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
    Write-Host 'Installing quantum dependencies...' -ForegroundColor Cyan
    & .\.venv311\Scripts\pip.exe install "numpy<2" qiskit qiskit-aer scipy matplotlib --quiet
    Write-Host 'Verifying Qiskit import...' -ForegroundColor Cyan
    & .\.venv311\Scripts\python.exe -c "import qiskit; print('Qiskit', qiskit.__version__)" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host 'Qiskit ready.' -ForegroundColor Green } else { Write-Host 'Qiskit import failed.' -ForegroundColor Red }
}

Download-Installer
Install-Python311
Create-Venv311
Write-Host 'Council Python 3.11 provisioning sequence complete.' -ForegroundColor Magenta
