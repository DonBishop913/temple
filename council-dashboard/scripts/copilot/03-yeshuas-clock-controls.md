# Copilot CLI Prompt: Harmonic Controls Wiring

Goal: Add `YeshuasClockControls.jsx` and wire into `YeshuasClock.jsx` with state passing to engine and overlays.

Prompt:
- Create `YeshuasClockControls.jsx` with:
  - A switch (role=switch) labeled "harmonic refinement" default checked.
  - A slider (role=slider) labeled "harmonic sensitivity" range [0..1] step 0.01.
  - Props: `onHarmonicToggle(boolean)`, `onSensitivityChange(number)`, `initialToggle`, `initialSensitivity`.
- Update `YeshuasClock.jsx` to:
  - Keep `harmonicEnabled` and `harmonicSensitivity` in state.
  - Pass `harmonicSensitivity` to `blend()` when enabled, else 0.
  - Render `GlyphstreamOverlay` with `enabled`, `spectral`, and `resonanceData` from nodes.
- Ensure basic styling and responsive layout.
