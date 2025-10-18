import React, { useState, useEffect } from 'react';

const YeshuasClockControls = ({
  onHarmonicToggle,
  onSensitivityChange,
  initialToggle = true,
  initialSensitivity = 0.5
}) => {
  const [isHarmonicEnabled, setIsHarmonicEnabled] = useState(initialToggle);
  const [harmonicSensitivity, setHarmonicSensitivity] = useState(initialSensitivity);

  useEffect(() => {
    onHarmonicToggle(isHarmonicEnabled);
    // eslint-disable-next-line
  }, [isHarmonicEnabled]);
  useEffect(() => {
    onSensitivityChange(harmonicSensitivity);
    // eslint-disable-next-line
  }, [harmonicSensitivity]);

  const handleToggle = () => {
    setIsHarmonicEnabled(v => !v);
  };
  const handleSensitivityChange = (e) => {
    setHarmonicSensitivity(parseFloat(e.target.value));
  };

  return (
    <div style={{ padding: '1rem', background: '#181c2a', borderRadius: 8, marginBottom: 12, color: '#cde', maxWidth: 340 }}>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input type="checkbox" checked={isHarmonicEnabled} onChange={handleToggle} role="switch" aria-label="harmonic refinement" />
        Enable Harmonic Refinement
      </label>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Harmonic Sensitivity: {harmonicSensitivity.toFixed(2)}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={harmonicSensitivity}
          onChange={handleSensitivityChange}
          disabled={!isHarmonicEnabled}
          role="slider"
          aria-label="harmonic sensitivity"
        />
      </label>
    </div>
  );
};

export default YeshuasClockControls;
