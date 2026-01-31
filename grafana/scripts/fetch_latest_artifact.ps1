<#
Fetch the latest `phasevplus-diagrams` artifact produced by the `render-dot.yml` workflow
and extract its contents into `grafana/diagrams`.

Usage examples (PowerShell):
    # interactive prompt for owner/repo
    .\fetch_latest_artifact.ps1

    # pass owner/repo explicitly
    .\fetch_latest_artifact.ps1 -OwnerRepo "yourorg/yourrepo"

Requirements:
- gh (GitHub CLI) installed and authenticated (gh auth login)
- PowerShell 5+ (Windows)

Behavior:
- finds the most recent run of the given workflow
- downloads the named artifact (defaults to phasevplus-diagrams)
- extracts files into grafana/diagrams/<runId>/
- prints a summary and exits non-zero on error
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$OwnerRepo,

    [Parameter(Mandatory=$false)]
    [string]$Workflow = "render-dot.yml",

    [Parameter(Mandatory=$false)]
    [string]$ArtifactName = "phasevplus-diagrams",

    [Parameter(Mandatory=$false)]
    [string]$DestRoot = "$PSScriptRoot\..\downloads"
)

function Fail([string]$msg, [int]$code=1) {
    Write-Error $msg
    exit $code
}

# Ensure gh is available
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Fail "gh (GitHub CLI) is not installed or not in PATH. Install from https://cli.github.com/ and run 'gh auth login'."
}

# Prompt for owner/repo if not provided
if (-not $OwnerRepo) {
    $OwnerRepo = Read-Host "Enter GitHub repo (owner/repo), e.g. yourorg/temple"
}

# Verify authentication
gh auth status > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub CLI not authenticated. Running 'gh auth login' to help you authenticate..." -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) { Fail "Failed to authenticate gh." }
}

# Normalize paths
$DestRoot = Resolve-Path -Path $DestRoot -ErrorAction SilentlyContinue | ForEach-Object { $_.ProviderPath }
if (-not $DestRoot) {
    New-Item -ItemType Directory -Path $PSScriptRoot\..\downloads -Force | Out-Null
    $DestRoot = Resolve-Path -Path $PSScriptRoot\..\downloads | ForEach-Object { $_.ProviderPath }
}

Write-Host "Fetching latest run for workflow '$Workflow' in repo '$OwnerRepo'..."
# get most recent run id
$runJson = gh run list --repo $OwnerRepo --workflow $Workflow --limit 1 --json databaseId 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "Failed to list workflow runs. Output: $runJson"
}

try {
    $runObj = $runJson | ConvertFrom-Json
} catch {
    Fail "Failed to parse gh output. Ensure the workflow name is correct and the repo has runs. Raw output: $runJson"
}

if (-not $runObj -or $runObj.Count -eq 0) {
    Fail "No runs found for workflow '$Workflow' in $OwnerRepo"
}

$runId = $runObj[0].databaseId
if (-not $runId) { Fail "Could not extract run id from gh run list output." }

Write-Host "Latest run id: $runId"

# prepare destination directories
$extractDir = Join-Path $DestRoot "extracted_$runId"
$targetDir = Resolve-Path -Path (Join-Path $PSScriptRoot "..\diagrams") -ErrorAction SilentlyContinue | ForEach-Object { $_.ProviderPath }
if (-not $targetDir) {
    New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot "..\diagrams") -Force | Out-Null
    $targetDir = Resolve-Path -Path (Join-Path $PSScriptRoot "..\diagrams") | ForEach-Object { $_.ProviderPath }
}

Write-Host "Downloading artifact '$ArtifactName' to '$DestRoot'..."
$downloadOutput = gh run download $runId --repo $OwnerRepo --name $ArtifactName --dir $DestRoot 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "gh run download failed. Output: $downloadOutput"
}

# gh run download will extract to a folder named after the artifact in DestRoot OR download zip depending on version
# attempt to locate any zip or folder
$artifactFolder = Join-Path $DestRoot $ArtifactName
$found = $false
if (Test-Path $artifactFolder) {
    # artifact downloaded/extracted to folder
    Write-Host "Artifact extracted into folder: $artifactFolder"
    Copy-Item -Path (Join-Path $artifactFolder '*') -Destination $extractDir -Recurse -Force
    $found = $true
}

# look for zip files in DestRoot
$zips = Get-ChildItem -Path $DestRoot -Filter '*.zip' -File -ErrorAction SilentlyContinue
if (-not $found -and $zips.Count -gt 0) {
    Write-Host "Found zip(s) in $DestRoot; extracting..."
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
    foreach ($z in $zips) {
        try {
            Expand-Archive -Path $z.FullName -DestinationPath $extractDir -Force
            Remove-Item -Path $z.FullName -Force -ErrorAction SilentlyContinue
            $found = $true
        } catch {
            Write-Warning "Failed to extract $($z.FullName): $_"
        }
    }
}

if (-not $found) {
    # maybe gh already extracted to a nested folder structure; search for png/dot files
    $possible = Get-ChildItem -Path $DestRoot -Recurse -Include *.png,*.dot -File -ErrorAction SilentlyContinue
    if ($possible.Count -gt 0) {
        New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
        foreach ($p in $possible) {
            Copy-Item -Path $p.FullName -Destination $extractDir -Force
        }
        $found = $true
    }
}

if (-not $found) { Fail "No artifact contents found after download. Check workflow run for upload step and artifact name." }

# Move PNG and DOT files into targetDir/<runId>/
$finalDir = Join-Path $targetDir $runId
New-Item -ItemType Directory -Path $finalDir -Force | Out-Null
Get-ChildItem -Path $extractDir -Include *.png,*.dot -File -Recurse | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $finalDir -Force
}

Write-Host "Files moved to: $finalDir"
Write-Host "Cleaning up temporary extraction folder: $extractDir"
Remove-Item -Path $extractDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Done. Artifact '$ArtifactName' from run $runId downloaded and extracted to $finalDir"
exit 0
