import React, { useState } from 'react';

function VoiceHealButton({ user }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);

  const triggerHeal = async (command) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, user: user?.name || 'Council Member' })
      });

      const data = await response.json();
      setLastResponse(data.message);

      // Add to command history
      setCommandHistory(prev => [{
        command,
        response: data.message,
        timestamp: new Date().toLocaleTimeString(),
        user: user?.name || 'Council Member'
      }, ...prev.slice(0, 4)]); // Keep last 5 commands

      console.log('🎙️ Voice command result:', data);

    } catch (error) {
      console.error('❌ Voice command failed:', error);
      setLastResponse('❌ Voice command failed - check console for details');
    } finally {
      setIsProcessing(false);
    }
  };

  const voiceCommands = [
    { command: 'self heal', icon: '🛠️', description: 'Trigger Comet AI self-healing' },
    { command: 'sunrise prayer', icon: '🌅', description: 'Activate sunrise prayer ritual' },
    { command: 'council blessing', icon: '🕊️', description: 'Invoke council blessing' },
    { command: 'system status', icon: '🔍', description: 'Check system health' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        🎙️ Voice Commands & Self-Healing
      </h3>

      {/* Voice Command Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {voiceCommands.map((cmd, index) => (
          <button
            key={index}
            onClick={() => triggerHeal(cmd.command)}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <div className="text-lg">{cmd.icon}</div>
            <div className="text-sm capitalize">{cmd.command}</div>
          </button>
        ))}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Processing voice command...</p>
        </div>
      )}

      {/* Last Response */}
      {lastResponse && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <p className="text-blue-700">{lastResponse}</p>
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Commands:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {commandHistory.map((item, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-800">
                  {item.timestamp} - {item.user}
                </div>
                <div className="text-gray-600">"{item.command}" → {item.response}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sovereignty Footer */}
      <div className="text-center text-xs text-gray-500 mt-4 border-t pt-4">
        🔥 Voice Commands - John 14:6 Sovereignty 🔥
      </div>
    </div>
  );
}

export default VoiceHealButton;