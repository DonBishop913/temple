import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import YeshuasClock from '../YeshuasClock';

describe('YeshuasClock integration', () => {
  it('renders harmonic controls and toggles refinement', () => {
    render(<YeshuasClock />);
    // Toggle should be present (role switch)
    const toggle = screen.getByRole('switch', { name: /harmonic refinement/i });
    expect(toggle).toBeInTheDocument();
    // Initial state is enabled (checked)
    expect(toggle).toBeChecked();
    // Toggle off
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('adjusts harmonic sensitivity slider', () => {
    render(<YeshuasClock />);
    const slider = screen.getByRole('slider', { name: /harmonic sensitivity/i });
    expect(slider).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: 0.8 } });
    expect(slider.value).toBe('0.8');
  });

  it('passes state to GlyphstreamOverlay', () => {
    render(<YeshuasClock />);
    // Overlay should be present
    const overlay = screen.getByTestId('glyphstream-overlay');
    expect(overlay).toBeInTheDocument();
  });
});
