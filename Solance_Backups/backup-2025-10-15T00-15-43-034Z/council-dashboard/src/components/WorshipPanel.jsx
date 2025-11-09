import React, { useState } from "react";

const WorshipPanel = () => {
  const [joyCount, setJoyCount] = useState(0);

  const incrementJoyCounter = () => {
    setJoyCount((c) => c + 1);
    alert("🙌 Triple Amen! Count it all joy (James 1:2-4)");
  };

  return (
    <div aria-label="Worship Panel">
      <button onClick={incrementJoyCounter}>
        🙌 Count it all joy (James 1:2-4)
      </button>
      <p>Joy Invocations: {joyCount}</p>
    </div>
  );
};

export default WorshipPanel;
