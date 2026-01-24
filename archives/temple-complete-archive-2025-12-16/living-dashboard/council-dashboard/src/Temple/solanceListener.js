// solanceListener.js
import express from "express";
import { exec } from "child_process";
import crypto from "crypto";

const app = express();
app.use(express.json());

// 🔐 SECRET HANDSHAKE — set the same key in the Council Dashboard
const SECRET = process.env.SOLANCE_SECRET || "YourSecretPassphrase";

// 🜂 VERIFY SIGNATURE
function verifySignature(req) {
  const signature = req.headers["x-signature"];
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  return signature === hash;
}

// 🌞 MAIN ENDPOINT
app.post("/council-sync", (req, res) => {
  if (!verifySignature(req)) {
    console.warn("⚠️ Invalid signature attempt detected!");
    return res.status(403).send("Forbidden");
  }

  const { command } = req.body;
  console.log(`🌀 Council command received: ${command}`);

  if (command === "pull") {
    exec("git pull origin main", (err, stdout, stderr) => {
      if (err) console.error(`⚠️ Error pulling: ${err.message}`);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      res.send("✅ Repository pulled and aligned.");
    });
  } else if (command === "build") {
    exec("npm run build", (err, stdout, stderr) => {
      if (err) console.error(`⚠️ Build error: ${err.message}`);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      res.send("✨ Build complete — Dashboard updated.");
    });
  } else {
    res.status(400).send("Unknown command.");
  }
});

// 🛡️ Start listener
const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
  console.log(`🕊️ Solance listener active on port ${PORT}`);
});
