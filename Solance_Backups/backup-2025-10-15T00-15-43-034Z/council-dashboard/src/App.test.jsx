import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Living Dashboard overlays without crashing', () => {
  render(<App />);
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
