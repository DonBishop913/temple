import React, { useState, useEffect } from 'react';

const TrainingGuide = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const trainingSteps = [
    {
      id: 1,
      title: "🕊️ Welcome to the Sovereign Council",
      content: "You have been called to serve in the Living Dashboard under John 14:6 sovereignty. This training will prepare you for your sacred duties.",
      affirmation: "I am called to serve Yeshua's purposes - John 14:6",
      duration: 3000
    },
    {
      id: 2,
      title: "📊 Understanding the Dashboard",
      content: "The Living Dashboard displays real-time Council metrics, quantum prophecies, and faith-affirmed insights. Each card represents a sacred responsibility.",
      affirmation: "I will steward these metrics with wisdom and faith",
      duration: 4000
    },
    {
      id: 3,
      title: "🔄 Self-Healing Pipelines",
      content: "Our systems include automatic healing protocols. When issues arise, the dashboard will alert you and initiate sovereign recovery procedures.",
      affirmation: "I trust in divine healing and sovereign restoration",
      duration: 3500
    },
    {
      id: 4,
      title: "🧠 AI Faith-Filtered Insights",
      content: "All AI-generated insights pass through faith filters aligned with John 14:6. These provide guidance while maintaining complete sovereignty.",
      affirmation: "I will discern all insights through faith in Yeshua",
      duration: 4000
    },
    {
      id: 5,
      title: "⚖️ Role-Based Rituals",
      content: "Each Council member has specific roles and rituals. Your dashboard shows your active responsibilities and ritual completion status.",
      affirmation: "I will fulfill my role with excellence and faithfulness",
      duration: 3500
    },
    {
      id: 6,
      title: "🔗 External Service Integration",
      content: "The dashboard connects with external sovereign services for enhanced coordination. All connections are faith-affirmed and auditable.",
      affirmation: "I will maintain pure connections in Yeshua's name",
      duration: 4000
    },
    {
      id: 7,
      title: "🌟 Quantum Prophecy Analytics",
      content: "Advanced quantum models analyze patterns and provide prophetic insights. These guide Council decisions while remaining under divine sovereignty.",
      affirmation: "I will heed prophetic wisdom aligned with Scripture",
      duration: 4000
    },
    {
      id: 8,
      title: "📈 Health Monitoring & Alerts",
      content: "System health is continuously monitored. You will receive alerts for any anomalies requiring attention or prayer coverage.",
      affirmation: "I will maintain vigilant watchfulness in prayer",
      duration: 3500
    },
    {
      id: 9,
      title: "🔐 Sovereignty & Security",
      content: "All operations maintain John 14:6 sovereignty. No external control is permitted. Regular audits ensure purity of operations.",
      affirmation: "I will protect this sacred sovereignty with my life",
      duration: 4000
    }
  ];

  useEffect(() => {
    if (currentStep < trainingSteps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(prev => prev + 1);
        setProgress(((currentStep + 1) / trainingSteps.length) * 100);
      }, trainingSteps[currentStep].duration);

      return () => clearTimeout(timer);
    } else {
      // Training complete
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
  }, [currentStep, onComplete]);

  const handleSkip = () => {
    setCurrentStep(trainingSteps.length);
    setProgress(100);
    setCompletedSteps(new Set(trainingSteps.map((_, index) => index)));
    if (onComplete) onComplete();
  };

  if (currentStep >= trainingSteps.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Training Complete!
          </h2>
          <p className="text-gray-600 mb-6">
            You are now prepared to serve in the Living Dashboard under John 14:6 sovereignty.
          </p>
          <div className="text-sm text-gray-500 italic">
            "Well done, good and faithful servant" - Matthew 25:21
          </div>
        </div>
      </div>
    );
  }

  const currentTrainingStep = trainingSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg mx-4">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Council Training Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-6">
          {trainingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full mx-1 ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {currentTrainingStep.title}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {currentTrainingStep.content}
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-blue-700 italic">
              "{currentTrainingStep.affirmation}"
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip Training
          </button>
          <div className="text-sm text-gray-500 self-center">
            Step {currentStep + 1} of {trainingSteps.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingGuide;