# Copilot CLI Prompt: OversoulEngine.blend Enhancements

Goal: Extend `OversoulEngine.js` `blend()` to accept `harmonicSensitivity` and apply subtle modulations.

Prompt:
- Update `OversoulEngine.js` to export `blend(params)` that:
  - Inputs: `{ schumannHz, harmony, starlinkQuality, joy, harmonicSensitivity }`.
  - Maps Schumann bands [7.83, 14.3, 20.8, 27.3, 33.8] to modulation deltas scaled by `harmonicSensitivity`.
  - Returns channels: `{ pulseCadence, glowIntensity, cometTrail, webPulse, orbitGlowMicro, shimmer, joyRipple }`.
  - Protect against NaN/undefined; default to zero modulation.
- Add minimal tests verifying proportional outputs.
