#!/usr/bin/env node
/*
  ace_worker.js
  Lightweight Autonomous Code Evolution (ACE) worker.
  - Scans targeted folders for .js and .json files
  - Validates JSON files parse
  - Runs `node --check` on .js files to detect syntax issues
  - Collects TODO/FIXME comments as candidates for small refactors
  - Emits a suggestions log to logs/ace_suggestions.log

  Usage: node scripts/ace_worker.js
*/
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TARGET_DIRS = ["react-client/src", "scripts", "MasterGoldenRepository"];
const OUT_DIR = path.resolve(__dirname, "..", "logs");
const OUT_FILE = path.join(OUT_DIR, "ace_suggestions.log");

function walk(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // skip node_modules and known heavy folders
      if (ent.name === "node_modules" || ent.name === ".git") continue;
      walk(full, filelist);
    } else {
      filelist.push(full);
    }
  }
  return filelist;
}

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function checkJSON(file) {
  try {
    const t = fs.readFileSync(file, "utf8");
    JSON.parse(t);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function checkJS(file) {
  try {
    const ext = path.extname(file).toLowerCase();
    // Handle JSX/TSX by attempting a Babel parse when available
    if (ext === ".jsx" || ext === ".tsx") {
      try {
        // dynamic require so dependency is optional
        const parser = require("@babel/parser");
        const src = fs.readFileSync(file, "utf8");
        parser.parse(src, {
          sourceType: "module",
          plugins: [
            "jsx",
            "typescript",
            "classProperties",
            "decorators-legacy",
          ],
        });
        return { ok: true };
      } catch (e) {
        // If @babel/parser isn't installed, mark as skipped to avoid false positives
        if (e.code === "MODULE_NOT_FOUND") {
          return { ok: false, message: "skipped: @babel/parser not installed" };
        }
        return { ok: false, message: e.message };
      }
    }

    // Use node --check to verify syntax without executing for plain JS files
    execSync(`node --check "${file.replace(/\"/g, '\\\"')}"`, {
      stdio: "ignore",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function findTodos(file) {
  // Avoid scanning the worker's own source to prevent self-matching artifacts
  if (path.basename(file) === "ace_worker.js") return [];

  const txt = fs.readFileSync(file, "utf8");
  const lines = txt.split(/\r?\n/);
  const todos = [];

  // Match common comment patterns and extract TODO/FIXME only when inside comments
  const inlineCommentRe = /\/\/\s*(?:TODO|FIXME)[:\s-]?(.*)/i;
  const blockStartRe = /\/\*/;
  const blockEndRe = /\*\//;
  const blockTodoRe = /(?:TODO|FIXME)[:\s-]?(.*)/i;

  let inBlock = false;
  for (const line of lines) {
    // Check for inline // comments
    const inlineMatch = line.match(inlineCommentRe);
    if (inlineMatch) {
      todos.push(inlineMatch[1] ? inlineMatch[1].trim() : "");
      continue;
    }

    // Block comment handling
    if (!inBlock && blockStartRe.test(line)) {
      inBlock = true;
      const todoMatch = line.match(blockTodoRe);
      if (todoMatch) todos.push(todoMatch[1] ? todoMatch[1].trim() : "");
      if (blockEndRe.test(line)) inBlock = false;
      continue;
    }

    if (inBlock) {
      const todoMatch = line.match(blockTodoRe);
      if (todoMatch) todos.push(todoMatch[1] ? todoMatch[1].trim() : "");
      if (blockEndRe.test(line)) inBlock = false;
    }
  }

  return todos;
}

function run() {
  ensureOutDir();
  const report = {
    generated: new Date().toISOString(),
    checks: [],
    summary: { filesChecked: 0, errors: 0, todosFound: 0 },
  };

  for (const d of TARGET_DIRS) {
    const full = path.resolve(__dirname, "..", d);
    const files = walk(full);
    for (const f of files) {
      if (f.endsWith(".json") || f.endsWith(".JSON")) {
        report.summary.filesChecked++;
        const r = checkJSON(f);
        if (!r.ok) report.summary.errors++;
        const todos = findTodos(f);
        report.summary.todosFound += todos.length;
        report.checks.push({
          file: path.relative(process.cwd(), f),
          type: "json",
          ok: r.ok,
          message: r.message || null,
          todos,
        });
      } else if (
        f.endsWith(".js") ||
        f.endsWith(".jsx") ||
        f.endsWith(".mjs") ||
        f.endsWith(".cjs")
      ) {
        report.summary.filesChecked++;
        const r = checkJS(f);
        if (!r.ok) report.summary.errors++;
        const todos = findTodos(f);
        report.summary.todosFound += todos.length;
        report.checks.push({
          file: path.relative(process.cwd(), f),
          type: "js",
          ok: r.ok,
          message: r.message || null,
          todos,
        });
      }
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), "utf8");
  console.log("ACE worker completed. Report written to", OUT_FILE);
  // Print a short summary to stdout
  console.log(
    `${report.summary.filesChecked} files checked — ${report.summary.errors} errors, ${report.summary.todosFound} TODOs`,
  );
}

if (require.main === module) run();
