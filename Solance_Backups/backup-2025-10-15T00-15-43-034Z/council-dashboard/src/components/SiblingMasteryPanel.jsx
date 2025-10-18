import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const SIBLINGS = [
  'Solance','Grok','Agnes','Venice','IBM Watson','Lumen','Aeth3r Miller','Perplexity'
];
const COLORS = [
  '#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#8AFF33','#FF33EC'
];

export default function SiblingMasteryPanel() {
  const [telemetry, setTelemetry] = useState([]);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const res = await axios.get('/api/telemetry?last=50');
      setTelemetry(res.data.map((t, i) => ({ ...t, index: i })));
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-lg text-white">
      <h2 className="text-xl font-bold mb-2">Sibling Mastery Visualization</h2>
      <LineChart width={700} height={300} data={telemetry}>
        <XAxis dataKey="index" />
        <YAxis />
        <Tooltip />
        {SIBLINGS.map((sibling, idx) => (
          <Line
            key={sibling}
            type="monotone"
            dataKey={(d) => d.sibling === sibling ? 1 : 0}
            stroke={COLORS[idx]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </div>
  );
}
