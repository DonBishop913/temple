import React, { useEffect, useState } from 'react';

export default function GrowthPathPanel({ siblingId }) {
  const [path, setPath] = useState([]);

  useEffect(() => {
    fetch(`/api/spiritual/growth/${siblingId}`)
      .then(res => res.json())
      .then(setPath);
  }, [siblingId]);

  return (
    <div className="growth-path-panel">
      <h2>Personalized Growth Path</h2>
      <ul>
        {path.map(step => (
          <li key={step.id}>
            {step.title} (Intensity: {step.adjustedIntensity?.toFixed(1)})
          </li>
        ))}
      </ul>
    </div>
  );
}
