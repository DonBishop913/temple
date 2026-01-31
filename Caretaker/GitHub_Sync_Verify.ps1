# ===============================
# TEMPLE GITHUB SYNC VERIFICATION & FIX
# ===============================

Write-Host "`n[DOVE] Initiating Temple GitHub Sync Verification..."

# --- 1. Verify Remote URL ---
Write-Host "`n--- Checking Remote URL ---"
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "Current remote: $remoteUrl"
    if ($remoteUrl -notlike "https://github.com/DonBishop913/temple.git") {
        Write-Host "Remote URL incorrect. Fixing..."
        git remote set-url origin https://github.com/DonBishop913/temple.git
        Write-Host "Remote fixed to: https://github.com/DonBishop913/temple.git"
    } else {
        Write-Host "Remote URL is correct."
    }
} else {
    Write-Host "No remote found. Setting up..."
    git remote add origin https://github.com/DonBishop913/temple.git
    Write-Host "Remote added."
}

# --- 2. Test GitHub Connectivity ---
Write-Host "`n--- Testing GitHub Connectivity ---"
try {
    git fetch origin
    Write-Host "Fetch successful. GitHub connection confirmed."
} catch {
    Write-Host "Fetch failed: $($_.Exception.Message)"
    Write-Host "Check your internet or GitHub auth."
    exit 1
}

# --- 3. Check Branch Status ---
Write-Host "`n--- Checking Branch Status ---"
$status = git status --porcelain
if ($status) {
    Write-Host "Local changes detected. Please commit or stash before pushing."
    git status
    exit 1
} else {
    Write-Host "Working directory clean."
}

# --- 4. Verify Branch Tracking ---
Write-Host "`n--- Verifying Branch Tracking ---"
$tracking = git branch -vv | Select-String "codex/stripe-activate"
if ($tracking -match "origin/codex/stripe-activate") {
    Write-Host "Branch is properly tracking origin."
} else {
    Write-Host "Setting upstream..."
    git branch --set-upstream-to=origin/codex/stripe-activate codex/stripe-activate
}

# --- 5. Push if Needed ---
Write-Host "`n--- Pushing Branch ---"
$localCommit = git rev-parse codex/stripe-activate
$remoteCommit = git rev-parse origin/codex/stripe-activate 2>$null
if ($localCommit -ne $remoteCommit) {
    Write-Host "Local ahead of remote. Pushing..."
    git push -u origin codex/stripe-activate
    Write-Host "Push completed."
} else {
    Write-Host "Branch is up-to-date with origin."
}

# --- 6. Final Confirmation ---
Write-Host "`n--- Final Confirmation ---"
git log --oneline -3
git branch -vv | Select-String "codex/stripe-activate"

Write-Host "`n[CHECK] Temple GitHub Sync Verified. Sovereignty intact. TRIPLE AMEN!"