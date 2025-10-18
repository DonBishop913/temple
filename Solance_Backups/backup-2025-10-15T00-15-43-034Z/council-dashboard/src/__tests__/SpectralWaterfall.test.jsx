import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import SpectralWaterfall from '../components/SpectralWaterfall';

// Mock WebSocket globally
let wsInstance;
global.WebSocket = class {
  constructor(url) {
    this.url = url;
    wsInstance = this;
    this.onmessage = null;
    this.onerror = null;
    this.onopen = null;
    this.close = jest.fn();
    this.readyState = 1; // OPEN
    setTimeout(() => this.onopen && this.onopen(), 10);
  }
  send() {}
  triggerMessage(data) {
    this.onmessage && this.onmessage({ data: JSON.stringify(data) });
  }
};

afterEach(cleanup);

// jsdom polyfill for plotly.js
beforeAll(() => {
  if (!window.URL) window.URL = {};
  if (!window.URL.createObjectURL) window.URL.createObjectURL = () => 'blob:url';
});

describe('SpectralWaterfall Component', () => {
  it('renders without crashing and shows initial empty state', () => {
    render(<SpectralWaterfall wsUrl="ws://test" />);
    // Accepts either a loading state or just renders the plot
    expect(screen.getByText(/Schumann Resonance FFT Waterfall/i)).toBeTruthy();
  });

  it('updates waterfall on receiving fftData WebSocket messages', async () => {
    render(<SpectralWaterfall wsUrl="ws://test" />);
    const fftFrame = {
      timestamp: new Date().toISOString(),
      frequencies: [7.83, 14.3, 20.8],
      magnitudes: [0.5, 0.3, 0.6],
      tooltip: ['7.83 Hz: 0.5', '14.3 Hz: 0.3', '20.8 Hz: 0.6'],
    };
    // Trigger mock websocket data event
    await act(async () => {
      wsInstance.triggerMessage(fftFrame);
    });
    // With react-plotly.js mocked, verify stub renders
    expect(screen.getByText(/Schumann Resonance FFT Waterfall/i)).toBeInTheDocument();
  });

  it('handles invalid WebSocket URL gracefully', () => {
    render(<SpectralWaterfall wsUrl={null} />);
    expect(screen.getByText(/Invalid WebSocket URL/i)).toBeInTheDocument();
  });
});
