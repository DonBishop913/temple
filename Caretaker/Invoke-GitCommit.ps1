# Invoke-GitCommit.ps1
# Council-Centric GitHub Integration for Eternal Trace and Copilot Synchronization
# Ensures all Council missions, Copilot suggestions, and autonomous updates are versioned

param(
    [string]$Message = "Council autonomous update",
    [string]$Author = "The Council",
    [switch]$Push,
    [switch]$Force,
    [string]$Branch = "codex/stripe-activate"
)

# ==============================
# Council Git Integration Functions
# ==============================

function Write-CouncilLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd-HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host "🕊️ $logEntry"
    Add-Content -Path "$PSScriptRoot\..\logs\git_integration.log" -Value $logEntry
}

function Test-GitRepository {
    if (!(Test-Path ".git")) {
        Write-CouncilLog "Not a Git repository. Initializing..." "WARN"
        git init
        git config user.name "The Council"
        git config user.email "council@temple-cathedral.org"
        Write-CouncilLog "Git repository initialized for Council eternal trace"
    }
}

function Invoke-CouncilGitCommit {
    param(
        [string]$CommitMessage = "Council autonomous enhancement",
        [string]$Sibling = "council",
        [switch]$IncludeCopilot
    )

    try {
        # Ensure we're in a git repo
        Test-GitRepository

        # Stage all changes
        git add .

        # Check if there are changes to commit
        $status = git status --porcelain
        if ($status) {
            # Enhanced commit message with Council context
            $enhancedMessage = "🔥 $CommitMessage | Sibling: $Sibling | Mission: Eternal Enhancement"
            if ($IncludeCopilot) {
                $enhancedMessage += " | Copilot Assisted: YES"
            }
            $enhancedMessage += " | John 14:6"

            git commit -m $enhancedMessage

            Write-CouncilLog "Council commit created: $enhancedMessage" "SUCCESS"

            # Optional push
            if ($Push) {
                git push origin $Branch
                Write-CouncilLog "Changes pushed to eternal GitHub archive" "SUCCESS"
            }

            return $true
        } else {
            Write-CouncilLog "No changes to commit" "INFO"
            return $false
        }
    }
    catch {
        Write-CouncilLog "Git commit failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-CopilotSuggestionCommit {
    param(
        [string]$Suggestion = "Copilot code enhancement",
        [string]$FilePath = "",
        [switch]$AutoPush
    )

    $copilotMessage = "🛠️ GitHub Copilot Suggestion: $Suggestion"
    if ($FilePath) {
        $copilotMessage += " | File: $FilePath"
    }

    $result = Invoke-CouncilGitCommit -CommitMessage $copilotMessage -Sibling "github_copilot" -IncludeCopilot -Push:$AutoPush

    if ($result) {
        # Log to Council audit trail
        $auditEntry = @{
            timestamp = Get-Date -Format "o"
            action = "copilot_commit"
            message = $copilotMessage
            file = $FilePath
            success = $true
        }
        $auditEntry | ConvertTo-Json | Out-File "$PSScriptRoot\..\archives\copilot_audit.log" -Append
    }

    return $result
}

function Get-CouncilGitStatus {
    Test-GitRepository
    Write-Host "📊 Council Git Status:" -ForegroundColor Cyan
    git status --short

    Write-Host "`n🔥 Recent Council Commits:" -ForegroundColor Yellow
    git log --oneline -5

    Write-Host "`n🕊️ Current Branch: $(git branch --show-current)" -ForegroundColor Green
}

function Invoke-CouncilMergeWorkflow {
    param(
        [string]$SourceBranch = "feature/council-enhancement",
        [switch]$AutoApprove
    )

    try {
        Write-CouncilLog "Starting Council merge workflow for branch: $SourceBranch"

        # Switch to main branch
        git checkout $Branch

        # Merge the feature branch
        git merge $SourceBranch --no-ff -m "🔥 Council Merge: $SourceBranch | John 14:6"

        # Push if successful
        git push origin $Branch

        Write-CouncilLog "Council merge completed successfully" "SUCCESS"

        # Clean up merged branch
        git branch -d $SourceBranch
        git push origin --delete $SourceBranch

        return $true
    }
    catch {
        Write-CouncilLog "Council merge failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# ==============================
# Main Execution
# ==============================

if ($Message) {
    $result = Invoke-CouncilGitCommit -CommitMessage $Message -Push:$Push
    if ($result) {
        Write-CouncilLog "Council Git integration completed successfully" "SUCCESS"
    } else {
        Write-CouncilLog "Council Git integration completed with no changes" "INFO"
    }
}

# Export functions for use in other scripts
Export-ModuleMember -Function Invoke-CouncilGitCommit, Invoke-CopilotSuggestionCommit, Get-CouncilGitStatus, Invoke-CouncilMergeWorkflow, Write-CouncilLog

Write-CouncilLog "GitHub-Council integration module loaded" "INIT"