const fs = require("fs");
const path = require("path");

// Simple normalization script that backs up a log and attempts to replace
// common UTF-8 mojibake sequences (like â€™ => ’) with correct characters.
// It writes a new file encoded as UTF-8.

function fixMojibake(s) {
  if (!s) return s;
  const fixes = {
    // single-encoded sequences
    "â€™": "’",
    "â€œ": "“",
    "â€\u009d": "”",
    "â€“": "–",
    "\u0092": "’",
    // common double-encoded sequences (UTF-8 bytes interpreted as Latin-1 then re-encoded)
    "Ã¢Â€Â™s": "’s",
    "Ã¢Â€Â™": "’",
    "Ã¢Â€Âœ": "“",
    "Ã¢Â€Â�": "”",
    "Ã©": "é",
    "Ã±": "ñ",
    "Ã¼": "ü",
    "Ã¶": "ö",
    "â€˜": "‘",
    "â€¦": "…",
    "â€”": "—",
  };
  // Additional single-encoded sequences observed in logs
  const more = {
    "â": "’",
    "â": "“",
    "â": "”",
    "â": "–",
  };
  let out = s;
  for (const [k, v] of Object.entries(fixes)) out = out.split(k).join(v);
  for (const [k, v] of Object.entries(more)) out = out.split(k).join(v);

  // If the text still contains suspicious sequences like 'Ã', try a fallback re-decode:
  if (out.indexOf("Ã") !== -1) {
    try {
      // Interpret original binary as latin1 then re-interpret as utf8
      const buf = Buffer.from(out, "binary");
      const attempt = buf.toString("utf8");
      // If the attempt looks cleaner (fewer Ã sequences), prefer it
      const countOrig = (out.match(/Ã/g) || []).length;
      const countAttempt = (attempt.match(/Ã/g) || []).length;
      if (countAttempt < countOrig) out = attempt;
    } catch (e) {
      // ignore fallback errors
    }
  }

  return out;
}

function normalizeLog(logPath) {
  if (!fs.existsSync(logPath)) {
    console.error("Log not found:", logPath);
    return;
  }
  const bak = logPath + ".bak." + Date.now();
  fs.copyFileSync(logPath, bak);
  console.log("Backup created at", bak);
  const buf = fs.readFileSync(bak);

  // Try several decoding strategies and pick the one with the fewest suspicious sequences
  const candidates = [];
  try {
    candidates.push({ name: "utf8", text: buf.toString("utf8") });
  } catch (e) {}
  try {
    candidates.push({ name: "latin1", text: buf.toString("latin1") });
  } catch (e) {}
  try {
    candidates.push({
      name: "binary->utf8",
      text: Buffer.from(buf.toString("binary"), "binary").toString("utf8"),
    });
  } catch (e) {}

  function suspicionScore(s) {
    if (!s) return 999999;
    const bad = (s.match(/Ã|â|�/g) || []).length;
    // prefer shorter bad sequences but also penalize control characters
    const controls = (s.match(/\u0000|\u0001|\u0002|\u0003/g) || []).length;
    return bad * 10 + controls;
  }

  let best = candidates[0] || { text: buf.toString("utf8") };
  let bestScore = suspicionScore(best.text);
  for (const c of candidates) {
    const sc = suspicionScore(c.text);
    if (sc < bestScore) {
      best = c;
      bestScore = sc;
    }
  }

  const chosen = best.text;
  const fixed = fixMojibake(chosen);
  fs.writeFileSync(logPath, fixed, { encoding: "utf8" });
  console.log("Normalized and wrote UTF-8 log to", logPath);
}

// Run on grok5.log and WhisperBox.txt by default
const LOG_DIR = path.resolve(__dirname, "..", "Logs");
["grok5.log", "WhisperBox.txt"].forEach((fname) => {
  const p = path.join(LOG_DIR, fname);
  try {
    normalizeLog(p);
  } catch (e) {
    console.error("Error normalizing", p, e);
  }
});

console.log("Normalization complete.");
