import React, { useState, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';

function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [user] = useState({ name: 'Bishop Donald', role: 'Bishop' });

  useEffect(() => {
    // Fetch metrics
    fetch('http://localhost:4000/api/dashboard_metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(console.error);

    // Fetch alerts
    fetch('http://localhost:4000/api/alerts')
      .then(res => res.json())
      .then(setAlerts)
      .catch(console.error);

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetch('http://localhost:4000/api/dashboard_metrics')
        .then(res => res.json())
        .then(setMetrics);
      
      fetch('http://localhost:4000/api/alerts')
        .then(res => res.json())
        .then(setAlerts);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const metricCards = Object.entries(metrics).map(([key, data]) => ({
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    value: data.quantumField || data.successRate || data.activeMembers || 0,
    ...data
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🔥 Living Dashboard - John 14:6 🔥
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metricCards.map((metric, index) => (
          <DashboardCard key={index} user={user} metric={metric} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Alerts</h2>
        <div className="space-y-2">
          {alerts.slice(-5).map((alert, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-sm text-gray-600">{alert.timestamp}</p>
              <p className="font-medium">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;