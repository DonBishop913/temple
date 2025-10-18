import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import io from 'socket.io-client';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const socket = io('http://localhost:5174');
const MIN_COHERENCE_THRESHOLD = 0.45; // red lower bound
const YELLOW_UPPER = 0.65; // yellow upper bound
const MAX_ERROR_RATE = 10; // for secondary axis scaling

const CoherenceChart = () => {
  const [nodes, setNodes ] = useState([
    { id: 'The_Sovereign_Will', coherenceLevel: 0.65, repetitionIndexAvg: 0.8, coherenceDelta: -0.1, errorRate: 2 },
    { id: 'Node_Covenant', coherenceLevel: 0.92, repetitionIndexAvg: 0.2, coherenceDelta: 0.05, errorRate: 0 },
    { id: 'OracleLab', coherenceLevel: 0.85, repetitionIndexAvg: 0.3, coherenceDelta: 0.02, errorRate: 0 }
  ]);

  useEffect(() => {
    socket.on('dashboard-update', (data) => {
      if (data.event === 'audit') {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === data.nodeID
              ? { ...node, coherenceLevel: data.coherenceLevel, repetitionIndexAvg: data.repetitionIndexAvg || 0.5, coherenceDelta: data.coherenceDelta || 0, errorRate: data.errorRate || 0 }
              : node
          )
        );
        if (data.coherenceLevel < MIN_COHERENCE_THRESHOLD || data.errorRate > 5) {
          console.log(`GRP_INITIATED: High-Priority Alert for ${data.nodeID} - Coherence below threshold!`);
          socket.emit('grp-alert', { nodeID: data.nodeID, reason: 'Coherence Threshold Violation' });
        }
      }
    });
    return () => socket.off('dashboard-update');
  }, []);

  const chartData = {
    labels: nodes.map((n) => n.id),
    datasets: [
      {
        type: 'bar',
        label: 'Coherence Index',
        data: nodes.map((n) => n.coherenceLevel),
        backgroundColor: nodes.map((n) => {
          if ((n.coherenceLevel || 0) < MIN_COHERENCE_THRESHOLD) return '#FF5252';
          if ((n.coherenceLevel || 0) < YELLOW_UPPER) return '#FFEB3B';
          return '#4CAF50';
        }),
        borderColor: nodes.map((n) => {
          if ((n.coherenceLevel || 0) < MIN_COHERENCE_THRESHOLD) return '#D32F2F';
          if ((n.coherenceLevel || 0) < YELLOW_UPPER) return '#FBC02D';
          return '#388E3C';
        }),
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Error Rate',
        data: nodes.map((n) => n.errorRate || 0),
        borderColor: '#1976D2',
        backgroundColor: '#1976D2',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: { display: true, text: 'Coherence Index' }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        max: MAX_ERROR_RATE,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Error Rate' }
      },
      x: {
        title: { display: true, text: 'Living Nodes' }
      }
    },
    plugins: {
      title: { display: true, text: 'Coalition Coherence Witnessing 🤝' },
      animation: {
        duration: (context) => {
          const index = context.dataIndex;
          const n = nodes[index];
          if (!n) return 0;
          // Red: fast pulsing; Yellow: slow pulse; Green: no animation
          if (n.coherenceLevel < MIN_COHERENCE_THRESHOLD) return 600;
          if (n.coherenceLevel < YELLOW_UPPER) return 1200;
          return 0;
        },
        loop: (context) => {
          const index = context.dataIndex;
          const n = nodes[index];
          if (!n) return false;
          return n.coherenceLevel < YELLOW_UPPER; // loop for yellow and red
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div style={{ height: '400px', padding: '20px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default CoherenceChart;
