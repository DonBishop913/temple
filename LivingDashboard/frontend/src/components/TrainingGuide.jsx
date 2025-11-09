import React, { useState, useEffect } from "react";

function TrainingGuide({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const trainingSteps = [
    {
      id: "welcome",
      title: "Welcome to The Living Dashboard",
      content:
        "Greetings, faithful Council member. This sacred interface connects you to the eternal flow of divine metrics and quantum insights. Every number, every insight, every ritual reflects the sovereignty of John 14:6.",
      action: 'Click "Begin Training" to start your sacred journey',
      type: "introduction",
    },
    {
      id: "dashboard_overview",
      title: "Dashboard Overview - Your Sacred View",
      content:
        "Before you lies the Living Dashboard - a real-time altar of wisdom. Each card represents divine data streams: Quantum Logs (divine field readings), Ritual Metrics (sacred ceremony success), and Council Streams (communion activity).",
      action: "Observe the three main metric cards updating in real-time",
      type: "observation",
    },
    {
      id: "role_rituals",
      title: "Your Sacred Role & Daily Rituals",
      content: `As ${user.role}, you are called to specific divine duties. Your daily rituals are displayed above - these are your sacred responsibilities in the Council Cathedral.`,
      action: "Review your role-specific rituals and scripture overlay",
      type: "personalization",
    },
    {
      id: "system_health",
      title: "System Health - Divine Monitoring",
      content:
        "The System Health card shows the vitality of our sovereign systems. Uptime, error counts, and faith confirmation ensure our altar remains pure and operational.",
      action: "Check the System Health card for current status",
      type: "monitoring",
    },
    {
      id: "interactive_cards",
      title: "Interactive Cards - Sacred Drill-Down",
      content:
        'Each metric card is interactive. Click "Drill Down" to see detailed analysis personalized for your role. This reveals deeper insights into the divine patterns.',
      action: 'Click "Drill Down" on any metric card to explore details',
      type: "interaction",
    },
    {
      id: "council_flagging",
      title: "Council Flagging - Sacred Discernment",
      content:
        'If you discern anything requiring Council attention, use "Flag for Council". This creates an eternal audit trail for review by the full Council.',
      action:
        'Click "Flag for Council" on a card if you see something needing discernment',
      type: "discernment",
    },
    {
      id: "ai_insights",
      title: "AI Faith Filter - Blessed Analysis",
      content:
        "All insights are faith-affirmed through John 14:6 principles. The AI continuously analyzes patterns, blessing encouraging messages and flagging concerning content for review.",
      action: "Review the Recent Alerts section for faith-affirmed insights",
      type: "wisdom",
    },
    {
      id: "audit_trail",
      title: "Audit Trail - Eternal Memory",
      content:
        "Every action, insight, and flag is eternally recorded. The Council maintains complete sovereignty through perfect traceability of all divine operations.",
      action: "Access audit trails through API endpoints for complete history",
      type: "sovereignty",
    },
    {
      id: "completion",
      title: "Training Complete - Council Member Activated",
      content:
        "You are now fully initiated into The Living Dashboard. May your discernment be sharp, your faith unwavering, and your service to the Council eternal.",
      action: 'Click "Complete Training" to finish your sacred initiation',
      type: "completion",
    },
  ];

  const markStepComplete = (stepId) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    if (currentStep < trainingSteps.length - 1) {
      markStepComplete(trainingSteps[currentStep].id);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTraining = () => {
    markStepComplete(trainingSteps[currentStep].id);
    if (onComplete) {
      onComplete(completedSteps);
    }
  };

  const currentTrainingStep = trainingSteps[currentStep];
  const progress = ((currentStep + 1) / trainingSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Council Training Guide</h2>
            <button
              onClick={completeTraining}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm opacity-90">
            Step {currentStep + 1} of {trainingSteps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {currentTrainingStep.title}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {currentTrainingStep.content}
            </p>

            {currentTrainingStep.type === "observation" && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-blue-800">
                  <strong>Observe:</strong> {currentTrainingStep.action}
                </p>
              </div>
            )}

            {currentTrainingStep.type === "interaction" && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-800">
                  <strong>Interact:</strong> {currentTrainingStep.action}
                </p>
              </div>
            )}

            {currentTrainingStep.type === "discernment" && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Discern:</strong> {currentTrainingStep.action}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {completedSteps.has(currentTrainingStep.id)
                ? "✓ Completed"
                : "In Progress"}
            </div>

            {currentStep === trainingSteps.length - 1 ? (
              <button
                onClick={completeTraining}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 font-bold"
              >
                Complete Training
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
              >
                Next Step
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
          <p className="text-center text-sm text-gray-600">
            🔥 Training Guide - John 14:6 Sacred Initiation 🔥
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrainingGuide;
