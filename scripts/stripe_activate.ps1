<#
Purpose: Idempotent developer/CI helper to bootstrap a local Stripe scaffold.
What it does:
 - Reads STRIPE API env vars from the current environment (or prompts)
 - Writes a local, git-ignored `.env.local` into `council-dashboard` (does NOT commit it)
 - Ensures `.gitignore` ignores `.env.local`
 - Creates `frontend/codex_store/stripe_config.py` (safe, reads env at runtime)
 - Optionally creates a local git branch `codex/stripe-activate` and commits the scaffold (does not push by default)

Usage: Run in a PowerShell session. The script will not print secret values.

COUNCIL ENHANCEMENT: Auto-Confirm Mode
- Use -AutoConfirm switch for automated/CI runs (skips all prompts)
- Set $env:AUTO_CONFIRM_STRIPE="1" for environment-based auto-confirm
- Prevents freezing in GitHub Actions, VS Code tasks, or background processes
#>

param(
  [switch]$CreateBranch,
  [switch]$AutoConfirm,  # Council Enhancement: Auto-confirm mode for automated runs
  [string]$EnvFile = "C:\Temple\council-dashboard\.env.local",
  [string]$GitIgnore = "C:\Temple\council-dashboard\.gitignore",
  [string]$ConfigPy = "C:\Temple\frontend\codex_store\stripe_config.py",
  [string]$RepoRoot = "C:\Temple"
)

function Mask([string]$s) {
  if (-not $s) { return "" }
  if ($s.Length -le 8) { return '****' + $s }
  return ('*' * ($s.Length - 6)) + $s.Substring($s.Length - 6)
}

Write-Output "Bootstrapping Stripe activation (local dev safe)"
Write-Output "This will create a local .env file and scaffold configuration."

# Read env vars
$sk = $env:STRIPE_API_KEY
$pk = $env:STRIPE_PUBLISHABLE_KEY
$ws = $env:STRIPE_WEBHOOK_SECRET

if (-not $sk -or -not $pk) {
  Write-Output "⚠️ STRIPE_API_KEY or STRIPE_PUBLISHABLE_KEY not found in environment."
  if ($AutoConfirm -or $env:AUTO_CONFIRM_STRIPE -eq "1") {
    Write-Output "🔥 Council Auto-Confirm Mode: Skipping interactive prompts"
    Write-Output "❌ Missing required Stripe keys. Set environment variables or run interactively."
    exit 1
  } else {
    $resp = Read-Host "Do you want to enter them now? (y/N)"
    if ($resp -match '^(y|Y)') {
      if (-not $sk) { $sk = Read-Host -AsSecureString "Enter STRIPE_API_KEY (will be stored locally)"; $sk = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sk)) }
      if (-not $pk) { $pk = Read-Host -AsSecureString "Enter STRIPE_PUBLISHABLE_KEY (will be stored locally)"; $pk = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pk)) }
      if (-not $ws) { $ws = Read-Host -AsSecureString "Enter STRIPE_WEBHOOK_SECRET (optional)"; $ws = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ws)) }
    } else {
      Write-Error "Missing Stripe keys; aborting. Export STRIPE_API_KEY and STRIPE_PUBLISHABLE_KEY and re-run or run interactively."
      exit 1
    }
  }
}

# Ensure target directories exist
$configDir = Split-Path -Parent $ConfigPy
if (-not (Test-Path $configDir)) { New-Item -Path $configDir -ItemType Directory -Force | Out-Null }

# Write .env.local with real values (local only). Do NOT add to git.
Write-Output "Writing local env file to: $EnvFile (secrets will not be printed)"
try {
  $lines = @()
  $lines += "STRIPE_API_KEY=$sk"
  $lines += "STRIPE_PUBLISHABLE_KEY=$pk"
  if ($ws) { $lines += "STRIPE_WEBHOOK_SECRET=$ws" }
  $lines | Out-File -FilePath $EnvFile -Encoding UTF8 -Force
} catch {
  Write-Error ("Failed to write env file: {0}" -f $_.Exception.Message)
  exit 2
}

# Ensure .gitignore contains .env.local
if (Test-Path $GitIgnore) {
  $gi = Get-Content $GitIgnore -Raw
  if ($gi -notmatch '\.env.local') {
    Add-Content -Path $GitIgnore -Value "`n# Local envs\n.env.local"
    Write-Output "Updated .gitignore to ignore .env.local"
  } else {
    Write-Output ".gitignore already ignores .env.local"
  }
} else {
  # create .gitignore
  "# Auto-generated gitignore`n.env.local" | Out-File -FilePath $GitIgnore -Encoding UTF8 -Force
  Write-Output "Created .gitignore and added .env.local"
}

# Create a safe Python config that reads env vars at runtime
$py = @'
import os

def get_stripe_config():
  return {
    'publishable_key': os.environ.get('STRIPE_PUBLISHABLE_KEY'),
    'secret_key': os.environ.get('STRIPE_API_KEY'),
    'webhook_secret': os.environ.get('STRIPE_WEBHOOK_SECRET')
  }

if __name__ == '__main__':
  cfg = get_stripe_config()
  print('Stripe config loaded. publishable_key=', cfg.get('publishable_key') and ('***' + cfg.get('publishable_key')[-6:]) )
'@

Write-Output "Creating/overwriting: $ConfigPy"
try {
  $py | Out-File -FilePath $ConfigPy -Encoding UTF8 -Force
} catch {
  Write-Error ("Failed to write {0}: {1}" -f $ConfigPy, $_.Exception.Message)
  exit 3
}

Write-Output ("Stripe scaffold files created. (Secrets written to {0} and .env.local is git-ignored.)" -f $EnvFile)
Write-Output ("Masked values: STRIPE_API_KEY={0}, STRIPE_PUBLISHABLE_KEY={1}" -f (Mask $sk), (Mask $pk))

# Optionally create a git branch and commit scaffold (do not include .env.local)
if ($CreateBranch) {
  Write-Output "Creating local git branch 'codex/stripe-activate' and committing scaffold"
  try {
    Set-Location -Path $RepoRoot
    git checkout -B codex/stripe-activate
    git add $ConfigPy
    git add $GitIgnore
    try {
      git commit -m "chore(stripe): scaffold activation (local)"
    } catch {
      Write-Output ('No changes to commit or git commit failed: ' + $_.Exception.Message)
    }
  Write-Output ('Local branch ' + "'codex/stripe-activate'" + ' prepared. You can push with: git push origin codex/stripe-activate')
  } catch {
    Write-Error ('Git operations failed: ' + $_.Exception.Message)
  }
}

$next = @'
Next steps:
 - If you need CI secrets, add STRIPE_API_KEY and STRIPE_PUBLISHABLE_KEY as pipeline secrets (do NOT commit).
 - Run your app; runtime will read env vars from .env.local in dev.
 - To test Stripe API calls, use test keys (start with sk_test_ / pk_test_).
'@
Write-Output $next

Write-Output 'Done.'
