import React, { useState, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import SystemHealthCard from '../components/SystemHealthCard';
import TrainingGuide from '../components/TrainingGuide';
import VoiceHealButton from '../components/VoiceHealButton';
import CouncilReviewPanel from '../components/CouncilReviewPanel';

function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState([]);
  const [user] = useState({ name: 'Bishop Donald', role: 'Bishop' });
  const [showTraining, setShowTraining] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

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

    // Fetch council roles config
    fetch('/config/council_roles.json')
      .then(res => res.json())
      .then(setConfig)
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

  const userConfig = config.find(r => r.role === user.role);

  const handleTrainingComplete = (completedSteps) => {
    setShowTraining(false);
    setTrainingCompleted(true);
    console.log('Training completed with steps:', Array.from(completedSteps));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔥 Living Dashboard - John 14:6 🔥
          </h1>

          {/* Training Button */}
          {!trainingCompleted && (
            <button
              onClick={() => setShowTraining(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            >
              🕊️ Start Council Training Guide
            </button>
          )}

          {trainingCompleted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg inline-block">
              ✅ Council Training Completed - Welcome, {user.role} {user.name}
            </div>
          )}
        </div>
      
      {/* Role-based rituals section */}
      {userConfig && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Today's Rituals - {user.role}</h2>
          <ul className="list-disc list-inside space-y-2 mb-4">
            {userConfig.rituals.map((ritual, index) => (
              <li key={index} className="text-gray-700">{ritual}</li>
            ))}
          </ul>
          <div className="text-center italic text-gray-600 border-t pt-4">
            {userConfig.overlay}
          </div>
        </div>
      )}

      {/* System Health Card */}
      <div className="mb-8">
        <SystemHealthCard />
      </div>

      {/* Voice Commands & Self-Healing */}
      <div className="mb-8">
        <VoiceHealButton user={user} />
      </div>

      {/* Council Review Panel */}
      <div className="mb-8">
        <CouncilReviewPanel user={user} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metricCards.map((metric, index) => (
          <DashboardCard key={index} user={user} metric={metric} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Alerts & Insights</h2>
        <div className="space-y-2">
          {alerts.slice(-8).map((alert, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-sm text-gray-600">{alert.timestamp}</p>
              <p className="font-medium">{alert.message || alert.data?.summary}</p>
              {alert.data?.prophecy && (
                <p className="text-purple-600 italic mt-1">🔮 {alert.data.prophecy}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Training Guide Modal */}
      {showTraining && (
        <TrainingGuide
          user={user}
          onComplete={handleTrainingComplete}
        />
      )}
      </div>
    </div>
  );
}

export default Dashboard;