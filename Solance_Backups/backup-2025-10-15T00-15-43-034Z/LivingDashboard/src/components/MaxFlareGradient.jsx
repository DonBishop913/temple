import React, { useEffect, useRef, useState } from 'react';

export default function MaxFlareGradient({ maxFlare }) {
  const [style, setStyle] = useState({ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!maxFlare) {
      setStyle({ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' });
      return;
    }
    let hue = 0;
    intervalRef.current = setInterval(() => {
      hue = (hue + 2) % 360;
      setStyle({
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 10%), hsl(${(hue + 60) % 360}, 70%, 15%))`
      });
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [maxFlare]);

  return (
    <div
      id="max-flare-gradient"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: -1,
        transition: 'background 0.05s linear',
        ...style
      }}
    />
  );
}