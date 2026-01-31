// Audit Hash Linker: posts a hash-linked audit entry to Council backend
// Usage: node scripts/audit_hash_linker.js
const crypto = require("crypto");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args))(
    async () => {
      const apiUrl = process.env.COUNCIL_API_URL || "http://localhost:4321";
      const token = process.env.COUNCIL_ADMIN_TOKEN || "changeme";
      const payload = {
        actor: process.env.GITHUB_ACTOR || "unknown",
        event: process.env.GITHUB_EVENT_NAME || "push",
        repo: process.env.GITHUB_REPOSITORY || "unknown",
        sha: process.env.GITHUB_SHA || "unknown",
        workflow: process.env.GITHUB_WORKFLOW || "council-ci",
        run_id: process.env.GITHUB_RUN_ID || "0",
        timestamp: new Date().toISOString(),
      };
      const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
      const body = { ...payload, hash };
      const res = await fetch(
        `${apiUrl}/api/admin/audit-anchor?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      console.log("Audit anchor status:", res.status);
      process.exit(0);
    },
  )();
