# Copilot CLI Prompt: Glyphstream Refinement Overlay

Goal: Implement `GlyphstreamOverlay.jsx` for spectral harmonic enhancement and node resonance tracing.

Prompt:

- Create `GlyphstreamOverlay.jsx` that:
  - Props: `enabled`, `spectral`, `resonanceData: Array<{x,y,strength}>`.
  - Renders an SVG overlay with animated circles driven by `strength` and a central spectral pulse sized by `spectral`.
  - Returns `null` if `enabled` is false.
  - Adds `data-testid="glyphstream-overlay"` for tests.
- Keep animations lightweight and pointer-events none.
