import React from 'react';
import PropTypes from 'prop-types';
import SpectralWaterfall from './SpectralWaterfall';

const DemoContainerStyle = {
  width: '100%',
  height: '400px',
  overflow: 'auto',
};


function YeshuasClockSpectralDemo({ wsUrl = 'ws://localhost:4322' }) {
  if (!wsUrl || typeof wsUrl !== 'string') {
    return <div>Invalid WebSocket URL</div>;
  }
  return (
    <div style={DemoContainerStyle} aria-label="Schumann spectral visualization demo" role="region">
      <h3>Yeshua’s Clock Spectral Demo</h3>
      <SpectralWaterfall wsUrl={wsUrl} />
    </div>
  );
}

YeshuasClockSpectralDemo.propTypes = {
  wsUrl: PropTypes.string,
};

export default YeshuasClockSpectralDemo;
