import React, { useEffect, useState, useContext } from 'react';
import ARVRScroll from './ARVRScroll';
// Assume JoyParticleOverlay exports a context; if not, use a prop instead.
export const JoyParticleContext = React.createContext({ emitJoyPulse: () => {} });

export default function DynamicCodexWeaver({ wsUrl = 'ws://localhost:8083' }) {
  const [reflections, setReflections] = useState([]);
  const joyContext = useContext(JoyParticleContext);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setReflections((prev) => [...prev.slice(-49), data]);
        if (joyContext && typeof joyContext.emitJoyPulse === 'function') {
          joyContext.emitJoyPulse(data.harmonicLevel || 0.5);
        }
      } catch {}
    };
    return () => ws.close();
  }, [wsUrl]);

  return (
    <ARVRScroll reflections={reflections} particleContext={joyContext} immersive />
  );
}