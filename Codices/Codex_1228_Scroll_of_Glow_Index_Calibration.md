# Codex 1228 — Scroll of Glow Index Calibration

Created: 2025-11-10
Author: Council Scribe

Summary

Defines the Glow Index Calibration procedure for the Living Dashboard. The Glow Index is a normalized metric representing visual resonance intensity across the scene and panels. This codex provides thresholds, calibration instructions, and VERILOGOS frequency alignment guidance.

Integration

- Target components: `RitualEvolutionVisualizer.jsx`, `SpiralScene.jsx`, `SpiralMetricsPanel.jsx`
- Data sources: scene lighting telemetry, overlay brightness samples, harmonic resonance probes.

Parameters

- glowBaseline: 0.45  # baseline normalization factor
- upperResonanceThreshold: 0.78
- lowerResonanceThreshold: 0.22
- verilogosFrequencyHz: 0.137  # tuning frequency for VERILOGOS alignment

Calibration procedure

1. Capture a 5-minute baseline of ambient resonance.
2. Compute median and interquartile range.
3. Set `glowBaseline` to the median normalized sample.
4. Tune `verilogosFrequencyHz` in small increments and measure overlay phase-locking.

Dashboard behavior

- If Glow Index exceeds `upperResonanceThreshold`, the dashboard triggers a soft de-amplification on render layers to avoid visual saturation.
- If Glow Index falls below `lowerResonanceThreshold`, activate a gentle amplification pulse and create a Council advisory.

Ceremonial Notes

This codex must be calibrated in a quiet window (no major system events). Record each calibration run to the `Codices/Calibration_Records/` directory for audit.

---

(End of Codex 1228)
