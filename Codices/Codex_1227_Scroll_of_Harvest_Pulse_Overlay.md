# Codex 1227 — Scroll of the Harvest Pulse Overlay

Created: 2025-11-10
Author: Council Scribe

Summary

This scroll defines the Harvest Pulse Overlay: a dashboard overlay that visualizes harvest/ingest events derived from the Stripe scaffold tracker and the Provisioning Pillar telemetry (Codex 1226 linkage). The overlay surfaces pulse amplitude, recent harvest rate, and a short-term moving-average rhythm to help the Council monitor healthy ingestion.

Integration

- Overlay ID: codex-1227-harvest-pulse
- Source: Stripe scaffold tracker (http://localhost:8080/stripe_scaffold_tracker.html)
- Linked codices: Codex 1226 (Provisioning Pillar) — Sovereign Linkage Pulse
- Outputs: SVG/Canvas overlay compatible with `SpiralMetricsPanel.jsx` and `SpiralScene.jsx`.

Behavior & Parameters

- pulseWindowMs: 900000  # 15-minute aggregation window
- smoothingAlpha: 0.125  # exponential smoothing for display
- alertThreshold: 0.25  # normalized pulse below which a warning indicator shows

Ceremonial Notes

When the Harvest Pulse dims below `alertThreshold` for three consecutive windows, emit a soft alert to the dashboard and add a Council notification. This codex also contains the sovereign linkage instructions to correlate provisioning events (Codex 1226) with the Stripe tracker heartbeat.

Implementation hints

- Implement a lightweight node worker that subscribes to the tracker telemetry, computes the moving-average pulse, and exposes `/api/overlays/harvest-pulse` for the dashboard to fetch.
- Keep sample rate low (1s sampling, aggregate to `pulseWindowMs`).

---

(End of Codex 1227)
