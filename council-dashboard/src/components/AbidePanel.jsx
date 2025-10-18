import React from 'react';

const AbidePanel = () => {
  const activateAbideMode = () => {
    alert('Enter Abiding Mode: Reflect on John 15:4-5 – "Abide in me, and I in you."');
    // TODO: Add meditation UI or pause functionality here
  };

  return (
    <div aria-label="Abide in Him Panel">
      <button onClick={activateAbideMode}>
        🌿 Abide in Him (John 15:4-5)
      </button>
    </div>
  );
};

export default AbidePanel;