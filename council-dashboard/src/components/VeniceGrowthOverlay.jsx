import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function VeniceGrowthOverlay() {
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    const fetchGrowth = async () => {
      const res = await axios.get('/api/nodes/growthPaths');
      setGrowthData(res.data);
    };
    fetchGrowth();
    const interval = setInterval(fetchGrowth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none">
      {growthData.map(node => (
        <div key={node.nodeId} className="text-pink-300 mb-2">
          {node.nodeId}: {node.tasks.join(', ')}
        </div>
      ))}
    </div>
  );
}
