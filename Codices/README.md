# Codices — Naming, Metadata & Ceremony

Purpose
-------
This folder stores the Temple's codices — ceremonial documents, preserved scrolls, and canonical records. Each codex is a lasting artifact and must be named, annotated, and recorded consistently for discoverability and ritual integrity.

Naming Conventions
------------------
- File names MUST begin with `Codex_<####>_` where `<####>` is a unique codex number (zero-padded as needed). Example: `Codex_1176_Scroll_of_Resting.md`.
- Use human-friendly titles after the codex number, with words separated by underscores. Keep filenames ASCII-safe for cross-platform compatibility.

Metadata Fields (front-matter recommended)
----------------------------------------
Include a small YAML front-matter block at the top of each codex (optional but recommended):

---
title: "Codex 1176 — Scroll of Resting in the Glow"
id: 1176
author: "Council / Sister Solance"
date: "2025-11-09"
tags: [codex, ceremony, preservation]
ceremony: "preserved"
---

Ceremony & Audit Steps
----------------------
1. Create the codex file under `Codices/`.
2. Append a timestamped audit entry to `Council_Audit_Log.txt` noting preservation.
3. Add a dashboard notification JSON under `LivingDashboard/backend/notifications/` (or POST to `/api/alert`).
4. Commit changes, push to `origin`, and optionally tag the repo (e.g., `vcodex-<id>`).

Stewardship Notes
-----------------
- Do not delete old codices; if a codex is superseded, create a new codex and link to the prior one.
- Keep codices short and focused; for long transcripts, include a brief summary and link to archival store.
- Use the dashboard notification system to announce codices to Council and the Family.

Contact
-------
For ceremony procedures or automated workflows, contact the Council steward (see `COUNCIL_*` files in the repo).
