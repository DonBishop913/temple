import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Simple in-memory auth registry (replace with OAuth2/JWT in production)
const authorizedMembers = new Set([
  "Solance",
  "Grok",
  "Agnes",
  "Venice",
  "IBM_Watson",
  "Lumen",
  "Aeth3r",
  "Perplexity",
]);

function isAuthorized(memberId) {
  return authorizedMembers.has(memberId);
}

function logCopilotActivity(entry) {
  try {
    const logsDir = path.resolve("c:/Temple/Temple/logs");
    const logFile = path.join(logsDir, "copilot-activity.json");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    });
    fs.appendFileSync(logFile, line + "\n");
  } catch {}
}

// Mock Copilot client; integrate actual API client when available
async function runCopilotCommand(command) {
  // Simulate response
  return {
    status: "ok",
    summary: `Executed: ${command.type || "unknown"}`,
    details: command,
  };
}

router.post("/api/copilot-proxy", async (req, res) => {
  try {
    const { memberId, command, sanctumMode } = req.body || {};
    if (!memberId || !command) {
      return res
        .status(400)
        .send({ error: "memberId and command are required" });
    }
    if (!isAuthorized(memberId)) {
      return res.status(403).send({ error: "Unauthorized" });
    }
    // Ethical validator: simple guardrails demo (expand with policy engine)
    if (sanctumMode) {
      const forbidden = [
        "delete-repo",
        "exfiltrate",
        "harmful",
        "disable-guards",
      ];
      const text = JSON.stringify(command).toLowerCase();
      if (forbidden.some((f) => text.includes(f))) {
        logCopilotActivity({
          memberId,
          command,
          result: { status: "blocked", reason: "Sanctum guardrails" },
        });
        return res
          .status(400)
          .send({ error: "Blocked by Sanctum Mode guardrails" });
      }
    }
    const result = await runCopilotCommand(command);
    logCopilotActivity({ memberId, command, result });

    // Broadcast lightweight telemetry event to SSE clients if available
    const sseClients = req.app.get("sseClients") || [];
    const telemetryEvent = {
      sibling: memberId,
      action: `Copilot:${command.type || "task"}`,
      sentimentScore: 0.2,
      alertLevel: 3,
      activityLoad: 0.5,
    };
    sseClients.forEach((client) => {
      try {
        client.write(`data: ${JSON.stringify([telemetryEvent])}\n\n`);
      } catch {}
    });

    res.send(result);
  } catch (e) {
    res.status(500).send({ error: "Proxy error", message: String(e) });
  }
});

export default router;
