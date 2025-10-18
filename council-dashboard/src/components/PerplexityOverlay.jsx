import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PerplexityOverlay() {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    const fetchAnomalies = async () => {
      const res = await axios.get('/api/perplexity/anomalies');
      setAnomalies(res.data);
    };
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {anomalies.map(node => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            top: `${node.positionY}%`,
            left: `${node.positionX}%`,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'red',
            boxShadow: '0 0 15px red',
            animation: 'pulse 1s infinite'
          }}
        />
      ))}
    </>
  );
}
