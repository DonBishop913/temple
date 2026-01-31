#!/usr/bin/env node
/**
 * Comet AI Autonomous Healer
 * Self-healing workflow correction and enhancement
 * John 14:6 Sovereignty - All glory to Yeshua
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CometAIHealer {
  constructor() {
    this.workflowFile = path.join(
      __dirname,
      "..",
      ".github",
      "workflows",
      "scheduled-ws-health.yml",
    );
    this.pendingReviewFile = path.join(
      __dirname,
      "..",
      "logs",
      "pending_council_review.json",
    );
    this.logFile = path.join(__dirname, "..", "logs", "live_dashboard.log");
    this.isHealing = false;

    // Ensure pending review file exists
    if (!fs.existsSync(this.pendingReviewFile)) {
      fs.writeFileSync(this.pendingReviewFile, "[]", "utf8");
    }

    console.log("🛠️ Comet AI Healer initialized - John 14:6");
  }

  /**
   * Main healing trigger - called when probes fail
   */
  async triggerSelfHeal(errorType, errorDetails) {
    if (this.isHealing) {
      console.log("⚠️ Healing already in progress...");
      return;
    }

    console.log("🔧 Comet AI Self-Heal triggered:", errorType);
    this.isHealing = true;

    try {
      const patch = this.generatePatch(errorType, errorDetails);

      if (patch.requiresCouncilApproval) {
        await this.queueForCouncilReview(patch);
      } else {
        await this.applyPatch(patch);
      }

      this.logHealingEvent("triggered", {
        errorType,
        patch: patch.description,
      });
    } catch (error) {
      console.error("❌ Healing failed:", error.message);
      this.logHealingEvent("failed", { error: error.message });
    } finally {
      this.isHealing = false;
    }
  }

  /**
   * Generate appropriate patch based on error type
   */
  generatePatch(errorType, errorDetails) {
    const patches = {
      api_not_ready: {
        description: "Increase API readiness wait time in workflow",
        requiresCouncilApproval: false,
        action: "workflow_patch",
        changes: {
          file: this.workflowFile,
          find: "sleep 20",
          replace: "sleep 30",
        },
      },
      port_conflict: {
        description: "Add port conflict resolution to startup script",
        requiresCouncilApproval: true,
        action: "script_patch",
        changes: {
          file: path.join(__dirname, "..", "scripts", "start_all.ps1"),
          find: 'Start-Process "node.exe" -ArgumentList "..\backend\api_server.js" -NoNewWindow',
          replace: `taskkill /IM node.exe /F 2>$null
Start-Process "node.exe" -ArgumentList "..\backend\api_server.js" -NoNewWindow`,
        },
      },
      dependency_missing: {
        description: "Add automatic dependency installation",
        requiresCouncilApproval: false,
        action: "script_enhancement",
        changes: {
          file: path.join(__dirname, "..", "scripts", "start_all.ps1"),
          find: 'Write-Host "🔥🕊️ STARTING LIVING DASHBOARD - JOHN 14:6 🕊️🔥" -ForegroundColor Yellow',
          replace: `Write-Host "🔥🕊️ STARTING LIVING DASHBOARD - JOHN 14:6 🕊️🔥" -ForegroundColor Yellow

# Auto-install dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
try {
    Push-Location "..\backend"
    npm install --silent
    Pop-Location
    Push-Location "..\frontend"
    npm install --silent
    Pop-Location
} catch {
    Write-Host "⚠️ Dependency check failed, continuing..." -ForegroundColor Yellow
}`,
        },
      },
      memory_leak: {
        description: "Add memory monitoring and restart triggers",
        requiresCouncilApproval: true,
        action: "monitoring_enhancement",
        changes: {
          file: path.join(
            __dirname,
            "..",
            "scripts",
            "self_healing_watchdog.ps1",
          ),
          find: 'Write-Host "✅ Self-Healing Watchdog cycle complete." -ForegroundColor Green',
          replace: `# Memory monitoring
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
foreach ($proc in $nodeProcesses) {
    $memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
    if ($memoryMB -gt 500) {
        Write-Host "🚨 High memory usage detected: $($proc.Id) using ${memoryMB}MB" -ForegroundColor Red
        # Could trigger restart here
    }
}

Write-Host "✅ Self-Healing Watchdog cycle complete." -ForegroundColor Green`,
        },
      },
    };

    return (
      patches[errorType] || {
        description: "Generic stability enhancement",
        requiresCouncilApproval: true,
        action: "generic_patch",
        changes: {
          file: this.logFile,
          find: "",
          replace: `// Generic healing applied at ${new Date().toISOString()}`,
        },
      }
    );
  }

  /**
   * Apply patch directly (for non-critical changes)
   */
  async applyPatch(patch) {
    console.log("🔧 Applying patch:", patch.description);

    try {
      if (patch.action === "workflow_patch") {
        this.patchWorkflowFile(patch.changes);
      } else if (patch.action === "script_patch") {
        this.patchScriptFile(patch.changes);
      } else if (patch.action === "script_enhancement") {
        this.patchScriptFile(patch.changes);
      } else if (patch.action === "monitoring_enhancement") {
        this.patchScriptFile(patch.changes);
      }

      // Auto-commit and push
      await this.commitAndPush(`Comet AI Self-Heal: ${patch.description}`);

      console.log("✅ Patch applied successfully");
      this.logHealingEvent("applied", patch);
    } catch (error) {
      console.error("❌ Patch application failed:", error.message);
      throw error;
    }
  }

  /**
   * Queue patch for Council review
   */
  async queueForCouncilReview(patch) {
    console.log("📋 Queuing patch for Council review:", patch.description);

    const reviewItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      patch: patch,
      status: "pending",
      sovereignty_affirmation: "John 14:6 - Requires Council blessing",
    };

    const queue = JSON.parse(fs.readFileSync(this.pendingReviewFile, "utf8"));
    queue.push(reviewItem);
    fs.writeFileSync(this.pendingReviewFile, JSON.stringify(queue, null, 2));

    console.log("📋 Patch queued for Council review");
    this.logHealingEvent("queued", patch);
  }

  /**
   * Apply approved patch from Council review
   */
  async applyApprovedPatch(patchId, approvedBy) {
    const queue = JSON.parse(fs.readFileSync(this.pendingReviewFile, "utf8"));
    const patchIndex = queue.findIndex((item) => item.id === patchId);

    if (patchIndex === -1) {
      throw new Error("Patch not found in review queue");
    }

    const patch = queue[patchIndex].patch;

    // Apply the patch
    await this.applyPatch(patch);

    // Update queue
    queue[patchIndex].status = "approved";
    queue[patchIndex].approvedBy = approvedBy;
    queue[patchIndex].approvedAt = new Date().toISOString();

    fs.writeFileSync(this.pendingReviewFile, JSON.stringify(queue, null, 2));

    console.log("✅ Approved patch applied by:", approvedBy);
  }

  /**
   * Patch workflow file
   */
  patchWorkflowFile(changes) {
    if (!fs.existsSync(changes.file)) {
      console.log("⚠️ Workflow file not found, skipping patch");
      return;
    }

    let content = fs.readFileSync(changes.file, "utf8");

    if (content.includes(changes.replace)) {
      console.log("⚠️ Patch already applied");
      return;
    }

    content = content.replace(changes.find, changes.replace);
    fs.writeFileSync(changes.file, content);

    console.log("📝 Workflow file patched");
  }

  /**
   * Patch script file
   */
  patchScriptFile(changes) {
    if (!fs.existsSync(changes.file)) {
      console.log("⚠️ Script file not found, skipping patch");
      return;
    }

    let content = fs.readFileSync(changes.file, "utf8");

    if (content.includes(changes.replace.split("\n")[0])) {
      console.log("⚠️ Patch already applied");
      return;
    }

    content = content.replace(changes.find, changes.replace);
    fs.writeFileSync(changes.file, content);

    console.log("📝 Script file patched");
  }

  /**
   * Commit and push changes
   */
  async commitAndPush(commitMessage) {
    try {
      execSync("git add .", { stdio: "inherit" });
      execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
      execSync("git push", { stdio: "inherit" });

      console.log("📤 Changes committed and pushed");
    } catch (error) {
      console.error("❌ Git operations failed:", error.message);
      // Don't throw here - healing should continue even if git fails
    }
  }

  /**
   * Log healing events
   */
  logHealingEvent(eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: "comet_ai_healing",
      type: eventType,
      details: details,
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    };

    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + "\n");
  }

  /**
   * Get pending reviews
   */
  getPendingReviews() {
    try {
      return JSON.parse(fs.readFileSync(this.pendingReviewFile, "utf8"));
    } catch (error) {
      console.error("❌ Failed to read pending reviews:", error.message);
      return [];
    }
  }

  /**
   * Monitor logs for healing triggers
   */
  startMonitoring() {
    console.log("👁️ Starting Comet AI monitoring...");

    // Watch log file for errors
    fs.watchFile(this.logFile, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        try {
          const logs = fs
            .readFileSync(this.logFile, "utf8")
            .split("\n")
            .slice(-10);
          const lastLog = logs[logs.length - 2]; // Second to last (last might be incomplete)

          if (lastLog && lastLog.includes("API not ready")) {
            this.triggerSelfHeal("api_not_ready", { log: lastLog });
          } else if (lastLog && lastLog.includes("EADDRINUSE")) {
            this.triggerSelfHeal("port_conflict", { log: lastLog });
          } else if (lastLog && lastLog.includes("Cannot find module")) {
            this.triggerSelfHeal("dependency_missing", { log: lastLog });
          }
        } catch (error) {
          // Ignore monitoring errors
        }
      }
    });

    console.log("✅ Comet AI monitoring active");
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    fs.unwatchFile(this.logFile);
    console.log("⏹️ Comet AI monitoring stopped");
  }
}

// Global healer instance
const cometHealer = new CometAIHealer();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Comet AI Healer...");
  cometHealer.stopMonitoring();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down Comet AI Healer...");
  cometHealer.stopMonitoring();
  process.exit(0);
});

// Start monitoring if this file is run directly
if (require.main === module) {
  cometHealer.startMonitoring();

  // Export for use in other modules
  module.exports = cometHealer;
}

module.exports = CometAIHealer;
