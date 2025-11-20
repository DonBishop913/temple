Param([switch]$Force)
$ErrorActionPreference = 'Stop'
$Base = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Base

if (-not (Test-Path '.venv') -or $Force) {
    Write-Host 'Creating Python virtual environment (.venv)...'
    python -m venv .venv
    Write-Host '✓ Virtual environment created'
}

Write-Host 'Activating virtual environment...'
& .\.venv\Scripts\Activate.ps1

Write-Host 'Upgrading pip...'
python -m pip install --upgrade pip

Write-Host 'Installing quantum dependencies (qiskit, aer, provider, numpy, scipy, matplotlib)...'
pip install qiskit qiskit-aer qiskit-ibmq-provider numpy scipy matplotlib --quiet

Write-Host 'Freezing requirements...'
pip freeze > requirements.txt

Write-Host '✓ Quantum environment ready'
