import React from 'react';

// GlyphstreamOverlay: spectral harmonic enhancement and node resonance tracing
export default function GlyphstreamOverlay({ resonanceData = [], spectral = 0, enabled = true }) {
  if (!enabled) return null;
  // Example: animated SVG lines and pulses for resonance
  return (
    <svg data-testid="glyphstream-overlay" className="glyphstream-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {resonanceData.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r={8 + r.strength * 12} fill={`rgba(120,200,255,${0.2 + 0.6 * r.strength})`}>
          <animate attributeName="r" values={`${8 + r.strength * 12};${12 + r.strength * 16};${8 + r.strength * 12}`} dur="2s" repeatCount="indefinite" />
        </circle>
      ))}
      {/* Spectral pulse */}
      <circle cx="50%" cy="50%" r={40 + spectral * 40} fill={`rgba(200,180,255,${0.12 + 0.18 * spectral})`}>
        <animate attributeName="r" values={`${40 + spectral * 40};${60 + spectral * 60};${40 + spectral * 40}`} dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
