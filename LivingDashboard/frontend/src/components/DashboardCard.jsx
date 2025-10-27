import React from 'react';

function DashboardCard({ user, metric }) {
  const getInsights = () => {
    // Simulate personalized insights based on user and metric
    const insights = {
      summary: `${metric.name} is performing at ${Math.round(metric.value * 100)}% - ${user.role} perspective`,
      details: `Detailed analysis for ${user.name} in role ${user.role}`
    };
    return insights;
  };

  const insights = getInsights();

  const showDetailedLog = () => {
    alert(`Detailed log for ${metric.name}: ${insights.details}`);
  };

  return (
    <div className="p-4 rounded-2xl shadow-lg bg-white hover:bg-yellow-50 transition-colors">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{metric.name}</h3>
      <p className="text-gray-600 mb-4">{insights.summary}</p>
      <button 
        onClick={showDetailedLog}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Drill Down
      </button>
    </div>
  );
}

export default DashboardCard;